/**
 * Sparse-item Crossref lookup.
 * Only runs when title exists and venue fields are empty (no DOI required to trigger,
 * but existing non-empty DOI/venue fields are never overwritten).
 * Used so Style can show tags when Zotero PDF recognition leaves a shell item.
 */
var UnifyCrossref = {
  TIMEOUT_MS: 10000,
  MIN_TITLE_LEN: 16,
  MIN_TOKEN_JACCARD: 0.82,

  _normTitle(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  titlesMatch(a, b) {
    const na = this._normTitle(a);
    const nb = this._normTitle(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    if (na.length >= 20 && nb.length >= 20 && (na.includes(nb) || nb.includes(na))) {
      return true;
    }
    const ta = new Set(na.split(" ").filter(Boolean));
    const tb = new Set(nb.split(" ").filter(Boolean));
    if (!ta.size || !tb.size) return false;
    let inter = 0;
    for (const t of ta) if (tb.has(t)) inter++;
    const union = ta.size + tb.size - inter;
    return union > 0 && inter / union >= this.MIN_TOKEN_JACCARD;
  },

  isSparse(item) {
    if (!item || !item.isRegularItem || !item.isRegularItem()) return false;
    const title = (item.getField("title") || "").trim();
    if (title.length < this.MIN_TITLE_LEN) return false;
    const conf = (item.getField("conferenceName") || "").trim();
    const proc = (item.getField("proceedingsTitle") || "").trim();
    const pub = (item.getField("publicationTitle") || "").trim();
    // Only when Style has nothing to query yet
    return !conf && !proc && !pub;
  },

  async _httpGetJson(url) {
    if (typeof Zotero === "undefined" || !Zotero.HTTP || !Zotero.HTTP.request) {
      return null;
    }
    const xhr = await Zotero.HTTP.request("GET", url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "ZoteroUnify/1.3.0 (https://github.com/JiangShuguo/zotero-unify; mailto:unify@jsg.local)",
      },
      timeout: this.TIMEOUT_MS,
      responseType: "json",
    });
    if (xhr.response && typeof xhr.response === "object") return xhr.response;
    if (xhr.responseText) return JSON.parse(xhr.responseText);
    return null;
  },

  async lookupByTitle(title) {
    const q =
      "https://api.crossref.org/works?" +
      "query.bibliographic=" +
      encodeURIComponent(title) +
      "&rows=5&select=DOI,title,container-title,type,issued,event,URL";
    const data = await this._httpGetJson(q);
    const items = data && data.message && data.message.items;
    if (!items || !items.length) return null;

    for (const it of items) {
      const crTitle = (it.title && it.title[0]) || "";
      if (!this.titlesMatch(title, crTitle)) continue;
      return it;
    }
    return null;
  },

  _yearFromIssued(issued) {
    try {
      const parts = issued && issued["date-parts"] && issued["date-parts"][0];
      if (parts && parts[0]) return String(parts[0]);
    } catch (e) {}
    return "";
  },

  _containerName(rec) {
    if (rec["container-title"] && rec["container-title"][0]) {
      return String(rec["container-title"][0]).trim();
    }
    if (rec.event) {
      if (rec.event.name) return String(rec.event.name).trim();
      if (Array.isArray(rec.event) && rec.event[0] && rec.event[0].name) {
        return String(rec.event[0].name).trim();
      }
    }
    return "";
  },

  _isConferenceType(type) {
    return (
      type === "proceedings-article" ||
      type === "proceedings" ||
      type === "paper-conference"
    );
  },

  /**
   * Fill empty DOI / venue / date / url from Crossref. Does not touch title or creators.
   * @returns {boolean} true if any field changed
   */
  async enrichSparse(item) {
    if (!this.isSparse(item)) return false;
    const title = (item.getField("title") || "").trim();
    let rec;
    try {
      rec = await this.lookupByTitle(title);
    } catch (e) {
      Zotero.debug("UnifyCrossref lookup: " + e);
      return false;
    }
    if (!rec || !rec.DOI) return false;

    let dirty = false;
    const doi = String(rec.DOI).trim();
    const container = this._containerName(rec);
    const year = this._yearFromIssued(rec.issued);
    const isConf = this._isConferenceType(rec.type);

    if (!(item.getField("DOI") || "").trim() && doi) {
      item.setField("DOI", doi);
      dirty = true;
    }

    if (isConf) {
      if (item.itemType !== "conferencePaper") {
        try {
          item.setType(Zotero.ItemTypes.getID("conferencePaper"));
          dirty = true;
        } catch (e) {}
      }
      if (container) {
        if (!(item.getField("conferenceName") || "").trim()) {
          item.setField("conferenceName", container);
          dirty = true;
        }
        if (!(item.getField("proceedingsTitle") || "").trim()) {
          item.setField("proceedingsTitle", container);
          dirty = true;
        }
      }
    } else if (container && !(item.getField("publicationTitle") || "").trim()) {
      if (
        item.itemType === "journalArticle" ||
        item.itemType === "document" ||
        item.itemType === "preprint" ||
        item.itemType === "report"
      ) {
        if (item.itemType !== "journalArticle") {
          try {
            item.setType(Zotero.ItemTypes.getID("journalArticle"));
            dirty = true;
          } catch (e) {}
        }
        item.setField("publicationTitle", container);
        dirty = true;
      }
    }

    if (year && !(item.getField("date") || "").trim()) {
      item.setField("date", year);
      dirty = true;
    }

    if (!(item.getField("url") || "").trim()) {
      const url = (rec.URL && String(rec.URL).trim()) || (doi ? "https://doi.org/" + doi : "");
      if (url) {
        item.setField("url", url);
        dirty = true;
      }
    }

    if (!dirty) return false;
    try {
      await item.saveTx();
      Zotero.debug("UnifyCrossref enriched DOI=" + doi);
      return true;
    } catch (e) {
      Zotero.debug("UnifyCrossref save: " + e);
      return false;
    }
  },
};
