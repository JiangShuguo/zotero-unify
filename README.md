# Zotero Unify

A [Zotero](https://www.zotero.org/) plugin that works with [Ethereal Style](https://github.com/MuiseDestiny/zotero-style): it normalizes journal and conference names, helps fill USENIX venue metadata, and can retry metadata recognition when the first attempt fails—so Style can show CCF and related tags correctly.

[中文说明](README.zh-CN.md)

| | |
| --- | --- |
| Version | 1.1.0 |
| Author | jsg |
| Compatible with | Zotero 7.x – 10.* |
| License | MIT |

---

## Motivation

[Ethereal Style](https://github.com/MuiseDestiny/zotero-style) can show venue rankings (CCF, SCI, impact factor, and so on) in the Zotero item list via sources such as easyscholar.

In practice, a few problems get in the way:

1. **Style needs the right configuration.** Defaults often favor SCI-oriented metrics. Without sensible Fields, Map, Sort By, and Journal Aliases, computer-science conference papers often miss the CCF (or similar) tags you expect.
2. **Venue names on items do not match lookup names.** Crossref or PDF import often leaves long, year-bearing titles in `publicationTitle`, `proceedingsTitle`, or `conferenceName`, while easyscholar usually expects fixed short names (for example `SIGCOMM`, `INFOCOM`, `USENIX Security Symposium`). When names do not match, the tag column is empty or incomplete. USENIX PDFs imported into Zotero also often lack conference venue fields.
3. **First-pass metadata recognition can fail.** When the network is unstable or a dependency is unreachable, Zotero may not recognize the PDF. The item then lacks usable venue metadata, and Style tags do not appear either.

So you typically need: (a) Ethereal Style configured for tags and aliases; (b) Unify to normalize venue fields to lookup-friendly names and, when possible, fill USENIX venue metadata; (c) a way to retry recognition after a failed first pass. **Tag text is still produced by Ethereal Style**—Unify does not write CCF or similar labels itself.

---

## Features

### 1. Normalize journal / conference names

Rewrites venue fields used for tag lookup into names Ethereal Style / easyscholar are more likely to match.

- **May change:** `conferenceName`, `proceedingsTitle`; journal `publicationTitle` (only when an existing name can be shortened); item type to `conferencePaper` when needed.
- **Does not change:** title, creators, date, DOI, URL, abstract, and other content metadata.
- **When it runs:** automatically on new item import. It does not force-rewrite after you edit an item. If you clear conference fields by hand, they are not immediately filled again.

### 2. Help fill USENIX venue metadata

USENIX PDFs imported into Zotero often miss conference fields. Unify can fill `conferenceName`, `proceedingsTitle`, and so on after import (and set `publisher` to `USENIX Association` when it is empty) so Style can show tags.

**PDF requirement:** the PDF should include the **official USENIX cover page**. That cover usually has the association mark and name, paper title and authors, a link to the paper page, and an explicit venue line (for example “This paper is included in the Proceedings of the 35th USENIX Security Symposium”), plus dates, location, and ISBN. PDFs with only the first body page and no cover (venue name as graphics or not extractable as text) usually cannot be recognized reliably, and Style tags may not appear.

Prefer downloading the official PDF with cover from the [USENIX website](https://www.usenix.org/) paper page before importing into Zotero.

### 3. Retry metadata recognition (context menu: Unify)

When recognition failed on the first try and Style tags are missing, select one or more items in the library, right-click, and choose **Unify**:

1. Re-recognize PDF/document metadata (needs network access to the usual recognition services);
2. Normalize venue / journal names so Ethereal Style can show tags.

---

## Ethereal Style: publication tag setup

Open Ethereal Style’s publication tag settings. Set **Source** to `easyscholar` and paste the **API Key** from the Style UI.

Reference files:

- [`unify/STYLE_PUBLICATION_TAGS.txt`](unify/STYLE_PUBLICATION_TAGS.txt) (Fields / Map / Sort By)
- [`unify/JOURNAL_ALIASES.txt`](unify/JOURNAL_ALIASES.txt) (Journal Aliases)

### Fields

```text
ccf, sciif, sci, sciUp, sciBase, eii
```

### Map

```text
北大中文核心=北核, SCIIF=IF, SCIIF(5)=IF(5), SCI基础版=中科院, SCI升级版=中科院, CCF=CCF, EI检索=EI
```

### Sort By

```text
ccf, sci, -sciif
```

### Journal Aliases

Paste the full contents of [`unify/JOURNAL_ALIASES.txt`](unify/JOURNAL_ALIASES.txt) into Style’s Journal Aliases (or merge with your existing aliases). Each line is `A = B`. This only affects Style lookup mapping; it **does not** change journal/conference fields on Zotero items.

---

## Scope

Focused on common **computer science** venues in networking, systems, and security, for example:

- Conferences: USENIX Security, USENIX ATC, NSDI, OSDI, NDSS, CCS, S&P, SIGCOMM, INFOCOM, IMC, CoNEXT, MobiCom, SOSP, ASPLOS, EuroSys, ICNP, ICDCS, ICSE, and others;
- Journals: TON, JSAC, TDSC, TIFS, TOPS, Computers & Security, Computer Networks, TNSM, Cybersecurity, and others.

If nothing matches the map, Unify leaves the fields unchanged.

---

## Install

1. Download `unify.xpi` from [Releases](https://github.com/JiangShuguo/zotero-unify/releases), or build locally:

```text
python unify/tools/inspect_and_build.py
```

(Requires Python 3.8+; output is `unify/build/unify.xpi`.)

2. In Zotero: Tools → Plugins → gear → **Install Plugin From File…** → select `unify.xpi`.
3. Confirm **Unify** is enabled, restart Zotero, and finish the Ethereal Style setup above.

---

## Repository layout

```text
unify/
  bootstrap.js                 plugin entry
  manifest.json
  src/                         source
  tools/inspect_and_build.py   packaging
  STYLE_PUBLICATION_TAGS.txt   Style: Fields / Map / Sort By
  JOURNAL_ALIASES.txt          Style: Journal Aliases
  updates.json
```

---

## License

MIT
