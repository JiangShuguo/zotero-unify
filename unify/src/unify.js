var Unify = {
  id: null,
  version: null,
  rootURI: null,
  notifierID: null,
  _queue: new Set(),
  _timer: null,
  _processing: false,
  _addedElementIDs: [],
  _interval: null,

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

  log(msg) {
    this.fileLog(msg);
  },

  async main() {
    await this.fileLog("startup v" + this.version + " (venue-fields only)");

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

    // A few delayed scans after startup (imports settle slowly)
    setTimeout(() => this.scanAll(false, "t+3s"), 3000);
    setTimeout(() => this.scanAll(false, "t+10s"), 10000);
    // Light periodic scan (no orphan-PDF parent creation)
    this._interval = setInterval(() => this.scanAll(false, "interval"), 20000);
  },

  async scanAll(showPopup, label) {
    if (this._processing) return;
    this._processing = true;
    try {
      const n = await UnifyNormalizer.fixStaleVenues();
      await this.fileLog("scan " + (label || "") + " changed=" + n);
      if (showPopup) {
        const w = new Zotero.ProgressWindow({ closeOnClick: true });
        w.changeHeadline("Unify");
        w.addDescription("Updated venue fields: " + n);
        w.show();
        w.startCloseTimer(2500);
      }
      if (n > 0) {
        try {
          const pane = Zotero.getActiveZoteroPane();
          if (pane && pane.itemsView && pane.itemsView.refreshAndMaintainSelection) {
            await pane.itemsView.refreshAndMaintainSelection();
          }
        } catch (e) {}
      }
    } catch (e) {
      await this.fileLog("scan error: " + e);
    } finally {
      this._processing = false;
    }
  },

  onMainWindowLoad(window) {
    try {
      this._injectMenu(window);
    } catch (e) {
      this.fileLog("menu: " + e);
    }
  },

  _injectMenu(window) {
    const doc = window.document;
    if (doc.getElementById("unify-normalize-selected")) return;
    const mk = (id, label, fn) => {
      const el = doc.createXULElement
        ? doc.createXULElement("menuitem")
        : doc.createElement("menuitem");
      el.id = id;
      el.setAttribute("label", label);
      el.addEventListener("command", fn);
      return el;
    };
    const a = mk("unify-normalize-selected", "Unify: normalize selected venues", () =>
      this.normalizeSelected(window)
    );
    const b = mk("unify-normalize-library", "Unify: scan library venues", () =>
      this.scanAll(true, "manual")
    );
    const target =
      doc.getElementById("zotero-itemmenu") || doc.getElementById("menu_ToolsPopup");
    if (!target) return;
    target.appendChild(a);
    target.appendChild(b);
    this._addedElementIDs.push(a.id, b.id);
  },

  async normalizeSelected(window) {
    try {
      const pane = window.ZoteroPane || Zotero.getActiveZoteroPane();
      const items = pane.getSelectedItems().filter((i) => i.isRegularItem());
      const n = await UnifyNormalizer.normalizeItems(items);
      await this.fileLog("selected changed=" + n + "/" + items.length);
      const w = new Zotero.ProgressWindow({ closeOnClick: true });
      w.changeHeadline("Unify");
      w.addDescription("Updated " + n + " / " + items.length);
      w.show();
      w.startCloseTimer(2500);
    } catch (e) {
      await this.fileLog("normalizeSelected: " + e);
    }
  },

  shutdown() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
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

  onNotify(event, type, ids) {
    if (type !== "item") return;
    if (event !== "add" && event !== "modify") return;
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
        // Attachment notify -> normalize parent only (never create parent / invent title)
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
};
