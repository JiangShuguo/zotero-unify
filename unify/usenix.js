/**
 * USENIX venue fill-in ONLY.
 * Touches: conferenceName, proceedingsTitle, publisher (if empty), itemType->conferencePaper.
 * Never touches: title, creators, date, url, DOI, abstract, attachments.
 */
var UnifyUsenix = {
  HEADER_CHARS: 3500,

  series: [
    {
      id: "security",
      canonical: "USENIX Security Symposium",
      patterns: [
        /\busenix\s*security\s*symposium\b/i,
        /\b\d{1,2}(st|nd|rd|th)\s+usenix\s+security\b/i,
        /\busenix\s*security\s*\d{2}\b/i,
        /usenix\.org\/conference\/usenixsecurity/i,
      ],
    },
    {
      id: "atc",
      canonical: "USENIX ATC",
      patterns: [
        /\busenix\s*atc\b/i,
        /\busenix\s*annual\s*technical\s*conference\b/i,
        /usenix\.org\/conference\/atc/i,
      ],
    },
    {
      id: "nsdi",
      canonical: "NSDI",
      patterns: [
        /\bnsdi\s*\d{2}\b/i,
        /\bnetworked\s*systems\s*design\s*and\s*implementation\b/i,
        /usenix\.org\/conference\/nsdi/i,
      ],
    },
    {
      id: "osdi",
      canonical: "Operating Systems Design and Implementation",
      patterns: [
        /\bosdi\s*\d{2}\b/i,
        /\boperating\s*systems\s*design\s*and\s*implementation\b/i,
        /usenix\.org\/conference\/osdi/i,
      ],
    },
  ],

  detectSeries(texts) {
    const blob = (texts || []).filter(Boolean).join("\n");
    if (!blob) return null;
    const head = blob.slice(0, this.HEADER_CHARS);
    for (const s of this.series) {
      for (const re of s.patterns) {
        if (re.test(head)) return s;
      }
    }
    return null;
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
   * Fill USENIX venue fields only. Does not modify title/creators/date/url/DOI.
   */
  async enrich(item) {
    if (!item || !item.isRegularItem || !item.isRegularItem()) return false;

    const conf = item.getField("conferenceName") || "";
    const proc = item.getField("proceedingsTitle") || "";
    const pub = item.getField("publicationTitle") || "";
    const existing = [conf, proc, pub].join("\n");

    if (typeof UnifyVenueMap !== "undefined") {
      const v = UnifyVenueMap.resolve(existing);
      if (
        v &&
        ![
          "USENIX Security Symposium",
          "USENIX ATC",
          "NSDI",
          "Operating Systems Design and Implementation",
        ].includes(v.name)
      ) {
        return false;
      }
    }

    const title = item.getField("title") || "";
    const url = item.getField("url") || "";
    const filenameBits = await this.attachmentHints(item);

    let series = this.detectSeries([title, url, conf, proc, pub].concat(filenameBits));
    if (!series && !(conf || proc)) {
      const pdfText = await this.getPdfText(item, this.HEADER_CHARS);
      if (pdfText) series = this.detectSeries([pdfText]);
    }
    if (!series) return false;

    let changed = false;

    if (item.itemType !== "conferencePaper") {
      item.setType(Zotero.ItemTypes.getID("conferencePaper"));
      changed = true;
    }

    if ((item.getField("conferenceName") || "") !== series.canonical) {
      item.setField("conferenceName", series.canonical);
      changed = true;
    }
    if ((item.getField("proceedingsTitle") || "") !== series.canonical) {
      item.setField("proceedingsTitle", series.canonical);
      changed = true;
    }
    if (!(item.getField("publisher") || "").trim()) {
      item.setField("publisher", "USENIX Association");
      changed = true;
    }

    if (changed) await item.saveTx();
    return changed;
  },
};
