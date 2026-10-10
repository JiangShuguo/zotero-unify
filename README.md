# Zotero Unify

[Zotero](https://www.zotero.org/) plugin used with [Ethereal Style](https://github.com/MuiseDestiny/zotero-style). It rewrites journal and conference venue fields to names that easyscholar can look up, fills USENIX venue fields when the PDF cover text is available, and can re-run Zotero’s metadata recognition from the item context menu.

Unify does not write CCF or other ranking labels; those come from Ethereal Style.

[中文说明](README.zh-CN.md)

| | |
| --- | --- |
| Version | 1.2.0 |
| Author | jsg |
| Compatible with | Zotero 7.x – 10.* |
| License | MIT |

---

## Why it exists

Ethereal Style can show venue rankings (CCF, SCI, impact factor, etc.) in the item list via easyscholar. Tags only appear when:

1. Style’s Fields / Map / Sort By / Journal Aliases are set for the metrics you want (defaults often favor SCI-oriented fields; CS conference CCF tags usually need extra setup).
2. The item’s venue string matches an easyscholar lookup name (for example `SIGCOMM`, `INFOCOM`, `USENIX Security Symposium`). Import often leaves long, year-bearing titles in `publicationTitle`, `proceedingsTitle`, or `conferenceName`, so the tag column stays empty.
3. The item has usable venue metadata. Failed PDF recognition or USENIX PDFs without filled conference fields leave Style with nothing to query.

Unify addresses (2) and (3). Style still handles (1) and the tag display.

---

## Behavior

### Venue name normalization

Maps recognized venue strings to a fixed lookup name used by Style / easyscholar.

| | |
| --- | --- |
| May change | `conferenceName`, `proceedingsTitle`; journal `publicationTitle` when an existing name matches a known venue; item type to `conferencePaper` when required for conference papers |
| Does not change | Title, creators, date, DOI, URL, abstract, and other non-venue fields |
| Runs on | New items (`add` notifier); selected items via the **Unify** context menu |
| No match | Fields are left as they are |

### USENIX venue fields

For USENIX papers, Unify can set `conferenceName` / `proceedingsTitle` from cover-page text, and set `publisher` to `USENIX Association` when that field is empty.

Works reliably when the PDF includes the **official USENIX cover page** (association mark, title/authors, paper URL, and a venue line such as “This paper is included in the Proceedings of the 35th USENIX Security Symposium”). Body-only PDFs without extractable cover text usually cannot be enriched this way. Prefer the official PDF from the [USENIX](https://www.usenix.org/) paper page.

### Context menu: Unify

On one or more selected items:

1. Re-run Zotero’s native PDF/document recognition.
2. Normalize venue / journal names.
3. If recognition still leaves a USENIX PDF without venue fields, apply cover-page enrich.

---

## Ethereal Style setup

In Ethereal Style’s publication tag settings: **Source** = `easyscholar`, and paste the **API Key** from the Style UI.

Reference files in this repo:

- [`unify/STYLE_PUBLICATION_TAGS.txt`](unify/STYLE_PUBLICATION_TAGS.txt) — Fields / Map / Sort By
- [`unify/JOURNAL_ALIASES.txt`](unify/JOURNAL_ALIASES.txt) — Journal Aliases

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

Paste the full contents of [`unify/JOURNAL_ALIASES.txt`](unify/JOURNAL_ALIASES.txt) into Style’s Journal Aliases. Format is one line per venue: `canonical = canonical`. Unify rewrites diverse import spellings to that canonical name before Style queries easyscholar.

---

## Covered venues

Primarily computer-science venues in networking, systems, and security, including:

- Conferences: USENIX Security, USENIX ATC, NSDI, OSDI, NDSS, CCS, S&P, SIGCOMM, INFOCOM, IMC, CoNEXT, IWQoS, ICC, NOSSDAV, ISCC, IPCCC, ICNP, ICDCS, and others in the map
- Journals: TON, JSAC, TDSC, TIFS, TPDS, TMC, TSC, TC, IEEE Network, Computer Networks, Computers & Security, and others in the map

The full list of Style alias lines is in `JOURNAL_ALIASES.txt`; matching rules live in `unify/src/venue-map.js`.

---

## Install

1. Download `unify.xpi` from [Releases](https://github.com/JiangShuguo/zotero-unify/releases), or build:

```text
python unify/tools/inspect_and_build.py
```

Requires Python 3.8+. Output: `unify/build/unify.xpi`.

2. Zotero → Tools → Plugins → gear → **Install Plugin From File…** → select `unify.xpi`.
3. Enable **Unify**, restart Zotero, then apply the Ethereal Style settings above.

---

## Repository layout

```text
unify/
  bootstrap.js                   plugin entry
  manifest.json
  src/                           venue-map, normalizer, usenix, unify
  tools/inspect_and_build.py     build XPI
  tools/validate_aliases.py      check Style names against easyscholar
  JOURNAL_ALIASES.txt            Style Journal Aliases
  STYLE_PUBLICATION_TAGS.txt     Style Fields / Map / Sort By
  updates.json
```

---

## License

MIT
