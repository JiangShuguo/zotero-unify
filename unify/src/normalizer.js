/**
 * Venue-field normalizer for Ethereal Style tags.
 * ONLY may change: conferenceName, proceedingsTitle, publicationTitle (journals),
 * and itemType when converting to conferencePaper.
 * Never touches title, creators, date, url, DOI, abstract, extra, tags, attachments.
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
      // Respect intentionally empty venue fields (do not refill from URL/DOI alone).
      // Empty → leave for USENIX/PDF enrich on import, or for the user.
      if (!conf && !proc) return false;
      if (item.itemType === "conferencePaper") {
        return conf !== name || proc !== name;
      }
      return ["journalArticle", "document", "preprint", "report"].includes(
        item.itemType
      );
    }
    if (venue.kind === "journal" && item.itemType === "journalArticle") {
      const cur = item.getField("publicationTitle") || "";
      // Only shorten an existing long publicationTitle; never invent one
      return cur && cur !== name;
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
      const cur = item.getField("publicationTitle") || "";
      if (cur && cur !== name) {
        item.setField("publicationTitle", name);
        dirty = true;
      }
    }

    if (!dirty) return false;
    return this.saveWithRetry(item);
  },

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.fillEmpty=true] When true, empty venue fields may be
   *   filled from USENIX/PDF heuristics (for new imports / manual Unify).
   */
  async normalizeItem(item, opts) {
    opts = opts || {};
    const fillEmpty = opts.fillEmpty !== false;
    if (!item || !item.isRegularItem || !item.isRegularItem()) return false;

    // 1) Shorten/normalize from existing venue metadata only
    let venue = this.detectFromFields(item);
    if (venue && this.needsShortening(item, venue)) {
      if (await this.applyVenue(item, venue)) return true;
    }
    if (venue && !this.needsShortening(item, venue)) {
      return false;
    }

    // 2) Empty venue fields: USENIX / PDF header for venue map only
    if (!fillEmpty) return false;
    const conf = (item.getField("conferenceName") || "").trim();
    const proc = (item.getField("proceedingsTitle") || "").trim();
    const pub = (item.getField("publicationTitle") || "").trim();
    if (conf || proc || pub) {
      return false;
    }

    try {
      if (await UnifyUsenix.enrich(item)) return true;
      const pdf = await UnifyUsenix.getPdfText(item, UnifyUsenix.HEADER_CHARS || 3500);
      if (pdf) {
        venue = UnifyVenueMap.resolve(pdf);
        // Only apply conference venues from PDF; do not invent journal titles
        if (venue && venue.kind === "conference") {
          return this.applyVenue(item, venue);
        }
      }
    } catch (e) {
      Zotero.debug("Unify normalize PDF: " + e);
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

  async fixStaleVenues() {
    // Shorten long names only; never refill emptied venue fields.
    const top = (await Zotero.Items.getAll(Zotero.Libraries.userLibraryID, true)) || [];
    const items = [];
    for (const it of top) {
      if (it && it.isRegularItem && it.isRegularItem()) items.push(it);
    }
    return this.normalizeItems(items, { fillEmpty: false });
  },
};
