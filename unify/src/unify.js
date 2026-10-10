var Unify = {
  id: null,
  version: null,
  rootURI: null,
  notifierID: null,
  _queue: new Set(),
  _timer: null,
  _processing: false,
  _addedElementIDs: [],
  /** attachment.id → field snapshot taken before detach/erase */
  _recognizeSnapshots: new Map(),

  init({ id, version, rootURI }) {
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
  },

  async fileLog(msg) {
    Zotero.debug("Unify: " + msg);
    try {
      const dir = Zotero.DataDirectory.dir;
      const path =
        typeof PathUtils !== "undefined"
          ? PathUtils.join(dir, "unify.log")
          : dir + (dir.endsWith("\\") || dir.endsWith("/") ? "" : "\\") + "unify.log";
      if (typeof IOUtils !== "undefined" && IOUtils.writeUTF8) {
        await IOUtils.writeUTF8(path, new Date().toISOString() + " " + msg + "\n", {
          append: true,
        });
      }
    } catch (e) {}
  },

  // --- lifecycle -----------------------------------------------------------

  async main() {
    await this.fileLog("startup v" + this.version + " (venue-fields + manual re-recognize)");

    this.notifierID = Zotero.Notifier.registerObserver(
      {
        notify: (event, type, ids) => this.onNotify(event, type, ids),
      },
      ["item"],
      "unify-venue-normalizer"
    );

    for (const win of Zotero.getMainWindows()) {
      this.onMainWindowLoad(win);
    }
  },

  onMainWindowLoad(window) {
    try {
      this._injectMenu(window);
    } catch (e) {
      this.fileLog("menu: " + e);
    }
  },

  shutdown() {
    if (this.notifierID) {
      try {
        Zotero.Notifier.unregisterObserver(this.notifierID);
      } catch (e) {}
      this.notifierID = null;
    }
    if (this._timer) clearTimeout(this._timer);
    this._queue.clear();
    for (const win of Zotero.getMainWindows()) {
      for (const id of this._addedElementIDs) {
        const el = win.document.getElementById(id);
        if (el) el.remove();
      }
    }
    this._addedElementIDs = [];
  },

  // --- context menu --------------------------------------------------------

  _injectMenu(window) {
    const doc = window.document;
    const existing = doc.getElementById("unify-menu-item");
    if (existing) existing.remove();

    const el = doc.createXULElement
      ? doc.createXULElement("menuitem")
      : doc.createElement("menuitem");
    el.id = "unify-menu-item";
    el.setAttribute("label", "Unify");
    el.setAttribute("class", "menuitem-iconic");
    const iconURL = this.rootURI + "icon.png";
    el.setAttribute("image", iconURL);
    try {
      el.style.listStyleImage = 'url("' + iconURL + '")';
    } catch (e) {}
    el.addEventListener("command", () => this.runUnifyOnSelected(window));

    const target =
      doc.getElementById("zotero-itemmenu") || doc.getElementById("menu_ToolsPopup");
    if (!target) return;
    target.appendChild(el);
    this._addedElementIDs.push(el.id);
  },

  _finishProgress(progress, description, ms) {
    progress.changeHeadline("Unify");
    progress.addDescription(description);
    progress.startCloseTimer(ms);
  },

  // --- import path (add notifier) ------------------------------------------

  onNotify(event, type, ids) {
    if (type !== "item" || event !== "add") return;
    for (const id of ids) this._queue.add(id);
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this.flushQueue(), 1500);
  },

  async flushQueue() {
    if (this._processing) {
      this._timer = setTimeout(() => this.flushQueue(), 800);
      return;
    }
    this._processing = true;
    const ids = Array.from(this._queue);
    this._queue.clear();
    try {
      const map = new Map();
      for (const id of ids) {
        const item = Zotero.Items.get(id);
        if (!item) continue;
        if (item.isAttachment()) {
          const parent = item.parentItem;
          if (parent) map.set(parent.id, parent);
          continue;
        }
        if (item.isRegularItem()) map.set(item.id, item);
      }
      const list = Array.from(map.values());
      if (list.length) {
        const n = await UnifyNormalizer.normalizeItems(list);
        await this.fileLog("flush changed=" + n + "/" + list.length);
      }
    } catch (e) {
      await this.fileLog("flush error: " + e);
    } finally {
      this._processing = false;
    }
  },

  // --- context-menu path: recognize → restore → normalize ------------------

  async runUnifyOnSelected(window) {
    if (this._processing) {
      await this.fileLog("Unify busy; ignore click");
      return;
    }
    this._processing = true;
    const progress = new Zotero.ProgressWindow({ closeOnClick: true });
    progress.changeHeadline("Unify");
    progress.addDescription("Working…");
    progress.show();

    try {
      const pane = window.ZoteroPane || Zotero.getActiveZoteroPane();
      const selected = pane.getSelectedItems() || [];
      if (!selected.length) {
        this._finishProgress(progress, "No items selected", 2000);
        return;
      }

      const recognizedParents = await this._runRecognize(selected);
      const list = this._collectNormalizeTargets(selected, recognizedParents);
      const n = await UnifyNormalizer.normalizeItems(list);
      await this.fileLog(
        "Unify done recognizeParents=" +
          recognizedParents.length +
          " normalized=" +
          n +
          "/" +
          list.length
      );

      try {
        if (pane.itemsView && pane.itemsView.refreshAndMaintainSelection) {
          await pane.itemsView.refreshAndMaintainSelection();
        }
      } catch (e) {}

      this._finishProgress(progress, "Finished " + recognizedParents.length, 2500);
    } catch (e) {
      await this.fileLog("runUnifyOnSelected: " + e + "\n" + (e && e.stack));
      this._finishProgress(progress, "Error: " + e, 4000);
    } finally {
      this._processing = false;
    }
  },

  async _runRecognize(selected) {
    const Recognize = Zotero.RecognizeDocument || Zotero.RecognizePDF;
    if (!Recognize || typeof Recognize.recognizeItems !== "function") {
      await this.fileLog("RecognizeDocument API missing");
      return [];
    }

    const docs = await this._collectRecognizeDocs(selected);
    await this.fileLog("recognize candidates=" + docs.length);
    if (!docs.length) return [];

    try {
      const queue = Zotero.ProgressQueues && Zotero.ProgressQueues.get("recognize");
      if (queue && queue.getDialog) {
        const dialog = queue.getDialog();
        if (dialog && dialog.open) dialog.open();
      }
    } catch (e) {}

    await Recognize.recognizeItems(docs);

    const parents = [];
    for (const doc of docs) {
      const fresh = Zotero.Items.get(doc.id);
      if (!fresh) continue;
      let parent = fresh.parentItem;
      if (!parent && fresh.isRegularItem && fresh.isRegularItem()) {
        parent = fresh;
      }
      if (!parent) continue;
      const snap = this._recognizeSnapshots.get(doc.id);
      if (snap) {
        await this._restoreSnapshotIfSparse(parent, snap);
        this._recognizeSnapshots.delete(doc.id);
      }
      parents.push(parent);
    }
    this._recognizeSnapshots.clear();
    return parents;
  },

  /**
   * Zotero.RecognizeDocument only accepts top-level PDF/EPUB attachments.
   * For parent items, detach the sole PDF (same idea as Undo Retrieve Metadata).
   */
  async _collectRecognizeDocs(selected) {
    const docs = [];
    const seen = new Set();

    for (const item of selected) {
      if (!item) continue;

      if (this._isRecognizableAttachment(item)) {
        if (item.isTopLevelItem()) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            docs.push(item);
          }
        } else {
          const parent = item.parentItem;
          if (parent) {
            const att = await this._detachForRerecognition(parent, item);
            if (att && !seen.has(att.id)) {
              seen.add(att.id);
              docs.push(att);
            }
          }
        }
        continue;
      }

      if (item.isRegularItem && item.isRegularItem()) {
        const atts = Zotero.Items.get(item.getAttachments()).filter((a) =>
          this._isRecognizableAttachment(a)
        );
        if (!atts.length) continue;
        const att = await this._detachForRerecognition(item, atts[0]);
        if (att && !seen.has(att.id)) {
          seen.add(att.id);
          docs.push(att);
        }
      }
    }
    return docs;
  },

  _collectNormalizeTargets(selected, recognizedParents) {
    const toNormalize = new Map();
    for (const it of recognizedParents) {
      if (it && it.isRegularItem && it.isRegularItem()) toNormalize.set(it.id, it);
    }
    for (const it of selected) {
      const cur = Zotero.Items.get(it.id) || it;
      if (!cur) continue;
      if (cur.isRegularItem && cur.isRegularItem()) {
        toNormalize.set(cur.id, cur);
      } else if (cur.isAttachment && cur.isAttachment() && cur.parentItem) {
        toNormalize.set(cur.parentItem.id, cur.parentItem);
      }
    }
    return Array.from(toNormalize.values());
  },

  _isRecognizableAttachment(item) {
    if (!item || !item.isAttachment || !item.isAttachment()) return false;
    try {
      if (typeof item.isPDFAttachment === "function" && item.isPDFAttachment()) {
        return true;
      }
      if (typeof item.isEPUBAttachment === "function" && item.isEPUBAttachment()) {
        return true;
      }
    } catch (e) {}
    const ct = (item.attachmentContentType || "").toLowerCase();
    return ct === "application/pdf" || ct === "application/epub+zip";
  },

  async _detachForRerecognition(parent, attachment) {
    if (!parent || !attachment) return null;
    if (attachment.isTopLevelItem()) return attachment;

    // Only safe when this PDF/EPUB is the sole child (same as Undo Retrieve Metadata).
    const attachIDs = parent.getAttachments() || [];
    const noteIDs = parent.getNotes ? parent.getNotes() : [];
    const onlyThisFile =
      attachIDs.length === 1 &&
      attachIDs[0] === attachment.id &&
      (!noteIDs || noteIDs.length === 0);
    if (!onlyThisFile) {
      await this.fileLog(
        "skip re-recognize for item " + parent.key + " (has notes or other children)"
      );
      return null;
    }

    const snap = this._snapshotItemFields(parent);
    const collections = parent.getCollections();
    await Zotero.DB.executeTransaction(async () => {
      attachment.parentItemID = null;
      if (collections && collections.length) {
        attachment.setCollections(collections);
      }
      await attachment.save();
      await parent.erase();
    });
    const att = Zotero.Items.get(attachment.id);
    if (att && snap) this._recognizeSnapshots.set(att.id, snap);
    return att;
  },

  _snapshotItemFields(item) {
    if (!item || !item.isRegularItem || !item.isRegularItem()) return null;
    return {
      itemType: item.itemType,
      title: item.getField("title") || "",
      DOI: item.getField("DOI") || "",
      url: item.getField("url") || "",
      date: item.getField("date") || "",
      publicationTitle: item.getField("publicationTitle") || "",
      conferenceName: item.getField("conferenceName") || "",
      proceedingsTitle: item.getField("proceedingsTitle") || "",
      volume: item.getField("volume") || "",
      pages: item.getField("pages") || "",
    };
  },

  async _restoreSnapshotIfSparse(item, snap) {
    if (!item || !snap) return false;
    const hasVenue = !!(
      (item.getField("publicationTitle") || "").trim() ||
      (item.getField("conferenceName") || "").trim() ||
      (item.getField("proceedingsTitle") || "").trim()
    );
    if (hasVenue) return false;

    let dirty = false;
    if (snap.itemType && item.itemType !== snap.itemType) {
      try {
        item.setType(Zotero.ItemTypes.getID(snap.itemType));
        dirty = true;
      } catch (e) {}
    }
    const fields = [
      "DOI",
      "url",
      "date",
      "publicationTitle",
      "conferenceName",
      "proceedingsTitle",
      "volume",
      "pages",
    ];
    for (const f of fields) {
      const cur = (item.getField(f) || "").trim();
      const prev = (snap[f] || "").trim();
      if (!cur && prev) {
        item.setField(f, prev);
        dirty = true;
      }
    }
    // Fix OCR-mangled title only when recognize left a clearly worse one
    const curTitle = (item.getField("title") || "").trim();
    const prevTitle = (snap.title || "").trim();
    if (
      prevTitle &&
      curTitle &&
      /1pv6/i.test(curTitle) &&
      /ipv6/i.test(prevTitle) &&
      !/1pv6/i.test(prevTitle)
    ) {
      item.setField("title", prevTitle);
      dirty = true;
    }
    if (!dirty) return false;
    try {
      await item.saveTx();
      return true;
    } catch (e) {
      await this.fileLog("restore snapshot: " + e);
      return false;
    }
  },
};
