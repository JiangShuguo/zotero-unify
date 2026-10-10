/**
 * USENIX venue fill-in ONLY.
 * Matching uses UnifyVenueMap; this module writes fields + empty publisher.
 * Touches: conferenceName, proceedingsTitle, publisher (if empty), itemType->conferencePaper.
 * Never touches: title, creators, date, url, DOI, abstract, attachments.
 */
var UnifyUsenix = {
  HEADER_CHARS: 3500,

  USENIX_NAMES: {
    "USENIX Security Symposium": true,
    "USENIX ATC": true,
    NSDI: true,
    "Operating Systems Design and Implementation": true,
  },

  isUsenixVenue(venue) {
    return !!(venue && venue.name && this.USENIX_NAMES[venue.name]);
  },

  async _readFtCache(att) {
    try {
      if (Zotero.Fulltext && Zotero.Fulltext.getItemCacheFile) {
        const cacheFile = Zotero.Fulltext.getItemCacheFile(att);
        if (cacheFile && cacheFile.exists && cacheFile.exists()) {
          return await Zotero.File.getContentsAsync(cacheFile);
        }
      }
    } catch (e) {
      Zotero.debug("UnifyUsenix ft-cache: " + e);
    }
    return "";
  },

  async getPdfText(item, maxChars) {
    maxChars = maxChars || this.HEADER_CHARS;
    const chunks = [];
    try {
      for (const id of item.getAttachments()) {
        const att = Zotero.Items.get(id);
        if (!att || !att.isAttachment()) continue;
        const ct = (att.attachmentContentType || "").toLowerCase();
        const name = att.attachmentFilename || "";
        if (ct !== "application/pdf" && !/\.pdf$/i.test(name)) continue;
        let text = await this._readFtCache(att);
        if (!text) {
          try {
            if (att.attachmentText) text = await att.attachmentText;
          } catch (e) {}
        }
        if (text && String(text).trim()) {
          chunks.push(String(text).slice(0, maxChars));
        }
      }
    } catch (e) {
      Zotero.debug("UnifyUsenix getPdfText: " + e);
    }
    return chunks.join("\n");
  },

  async attachmentHints(item) {
    const bits = [];
    try {
      for (const id of item.getAttachments()) {
        const att = Zotero.Items.get(id);
        if (att && att.isAttachment()) {
          bits.push(att.attachmentFilename || "");
        }
      }
    } catch (e) {}
    return bits;
  },

  /**
   * Resolve USENIX venue from title / URL / filenames only (no PDF I/O).
   */
  async detectLocal(item) {
    if (!item || typeof UnifyVenueMap === "undefined") return null;
    const conf = item.getField("conferenceName") || "";
    const proc = item.getField("proceedingsTitle") || "";
    const pub = item.getField("publicationTitle") || "";
    const fromFields = UnifyVenueMap.resolve([conf, proc, pub].join("\n"));
    if (fromFields && !this.isUsenixVenue(fromFields)) return null;

    const title = item.getField("title") || "";
    const url = item.getField("url") || "";
    const filenameBits = await this.attachmentHints(item);
    const venue = UnifyVenueMap.resolve(
      [title, url, conf, proc, pub].concat(filenameBits).filter(Boolean).join("\n")
    );
    return this.isUsenixVenue(venue) ? venue : null;
  },

  /** Write canonical USENIX fields + empty publisher. */
  async applyCanonical(item, canonical) {
    if (!item || !canonical) return false;
    let changed = false;

    if (item.itemType !== "conferencePaper") {
      item.setType(Zotero.ItemTypes.getID("conferencePaper"));
      changed = true;
    }
    if ((item.getField("conferenceName") || "") !== canonical) {
      item.setField("conferenceName", canonical);
      changed = true;
    }
    if ((item.getField("proceedingsTitle") || "") !== canonical) {
      item.setField("proceedingsTitle", canonical);
      changed = true;
    }
    if (!(item.getField("publisher") || "").trim()) {
      item.setField("publisher", "USENIX Association");
      changed = true;
    }

    if (changed) await item.saveTx();
    return changed;
  },

  /** Local clues only (title / URL / filename). */
  async enrichLocal(item) {
    if (!item || !item.isRegularItem || !item.isRegularItem()) return false;
    const venue = await this.detectLocal(item);
    if (!venue) return false;
    return this.applyCanonical(item, venue.name);
  },

  /**
   * Full enrich: local first, then optional PDF header.
   * @param {object} [opts]
   * @param {boolean} [opts.allowPdf=true]
   */
  async enrich(item, opts) {
    opts = opts || {};
    const allowPdf = opts.allowPdf !== false;
    if (!item || !item.isRegularItem || !item.isRegularItem()) return false;
    if (typeof UnifyVenueMap === "undefined") return false;

    if (await this.enrichLocal(item)) return true;
    if (!allowPdf) return false;

    const conf = (item.getField("conferenceName") || "").trim();
    const proc = (item.getField("proceedingsTitle") || "").trim();
    if (conf || proc) return false;

    const pdfText = await this.getPdfText(item, this.HEADER_CHARS);
    if (!pdfText) return false;
    const venue = UnifyVenueMap.resolve(pdfText);
    if (!this.isUsenixVenue(venue)) return false;
    return this.applyCanonical(item, venue.name);
  },
};
