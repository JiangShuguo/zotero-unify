/**
 * Venue-field normalizer for Ethereal Style tags.
 * May change: conferenceName, proceedingsTitle, publicationTitle (journals),
 * itemType when converting to conferencePaper; sparse Crossref fill may also
 * set empty DOI / date / url (never title or creators).
 */
var UnifyNormalizer = {
  detectFromFields(item) {
    const blob = [
      item.getField("conferenceName"),
      item.getField("proceedingsTitle"),
      item.getField("publicationTitle"),
      item.getField("url"),
      item.getField("DOI"),
    ]
      .filter(Boolean)
      .join("\n");
    return UnifyVenueMap.resolve(blob);
  },

  needsShortening(item, venue) {
    if (!venue) return false;
    const name = venue.name;
    if (venue.kind === "conference") {
      const conf = (item.getField("conferenceName") || "").trim();
      const proc = (item.getField("proceedingsTitle") || "").trim();
      // Empty conference fields: do not refill from URL/DOI alone.
      if (!conf && !proc) return false;
      if (item.itemType === "conferencePaper") {
        return conf !== name || proc !== name;
      }
      return ["journalArticle", "document", "preprint", "report"].includes(
        item.itemType
      );
    }
    if (venue.kind === "journal" && item.itemType === "journalArticle") {
      const cur = (item.getField("publicationTitle") || "").trim();
      return cur !== name;
    }
    return false;
  },

  async saveWithRetry(item, attempts) {
    attempts = attempts || 3;
    let last;
    for (let i = 0; i < attempts; i++) {
      try {
        await item.saveTx();
        return true;
      } catch (e) {
        last = e;
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
      }
    }
    Zotero.debug("Unify save failed: " + last);
    return false;
  },

  async applyVenue(item, venue) {
    const name = venue.name;
    let dirty = false;

    if (venue.kind === "conference") {
      if (item.itemType !== "conferencePaper") {
        item.setType(Zotero.ItemTypes.getID("conferencePaper"));
        dirty = true;
      }
      if ((item.getField("conferenceName") || "") !== name) {
        item.setField("conferenceName", name);
        dirty = true;
      }
      if ((item.getField("proceedingsTitle") || "") !== name) {
        item.setField("proceedingsTitle", name);
        dirty = true;
      }
    } else if (venue.kind === "journal" && item.itemType === "journalArticle") {
      const cur = (item.getField("publicationTitle") || "").trim();
      if (cur !== name) {
        item.setField("publicationTitle", name);
        dirty = true;
      }
    }

    if (!dirty) return false;
    return this.saveWithRetry(item);
  },

  /**
   * After Crossref/USENIX/PDF fill, map to canonical Style lookup names.
   */
  async _canonicalizeIfMapped(item) {
    const venue = this.detectFromFields(item);
    if (!venue) return false;
    // After an explicit fill, write canonical even if conference fields were empty.
    return this.applyVenue(item, venue);
  },

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.fillEmpty=true] When true, empty venue fields may be
   *   filled from Crossref / USENIX / PDF (new imports / manual Unify).
   */
  async normalizeItem(item, opts) {
    opts = opts || {};
    const fillEmpty = opts.fillEmpty !== false;
    if (!item || !item.isRegularItem || !item.isRegularItem()) return false;

    // 1) Shorten / normalize from existing field metadata (incl. URL/DOI)
    const venue = this.detectFromFields(item);
    if (venue) {
      if (this.needsShortening(item, venue)) {
        return this.applyVenue(item, venue);
      }
      return false;
    }

    // 2) No mapped venue from fields — stop unless empty-fill is allowed
    const conf = (item.getField("conferenceName") || "").trim();
    const proc = (item.getField("proceedingsTitle") || "").trim();
    const pub = (item.getField("publicationTitle") || "").trim();
    if (conf || proc || pub) return false;
    if (!fillEmpty) return false;

    // 3) Empty venue fields:
    //    local USENIX (URL/filename) → Crossref → one PDF read (USENIX or conference)
    try {
      if (typeof UnifyUsenix !== "undefined" && (await UnifyUsenix.enrichLocal(item))) {
        return true;
      }
      if (
        typeof UnifyCrossref !== "undefined" &&
        (await UnifyCrossref.enrichSparse(item))
      ) {
        await this._canonicalizeIfMapped(item);
        return true;
      }
      const pdf =
        typeof UnifyUsenix !== "undefined"
          ? await UnifyUsenix.getPdfText(item, UnifyUsenix.HEADER_CHARS || 3500)
          : "";
      if (pdf) {
        const fromPdf = UnifyVenueMap.resolve(pdf);
        if (fromPdf && fromPdf.kind === "conference") {
          if (
            typeof UnifyUsenix !== "undefined" &&
            UnifyUsenix.isUsenixVenue(fromPdf)
          ) {
            return UnifyUsenix.applyCanonical(item, fromPdf.name);
          }
          return this.applyVenue(item, fromPdf);
        }
      }
    } catch (e) {
      Zotero.debug("Unify normalize fillEmpty: " + e);
    }
    return false;
  },

  async normalizeItems(items, opts) {
    let n = 0;
    for (const item of items) {
      try {
        if (await this.normalizeItem(item, opts)) n++;
      } catch (e) {
        Zotero.debug("Unify normalize error: " + e);
      }
    }
    return n;
  },
};
