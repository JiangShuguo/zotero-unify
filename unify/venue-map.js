/**
 * Canonical venue names for Unify → Ethereal Style / easyscholar.
 *
 * Principles:
 * 1) Match MANY import spellings with regex (Crossref / IEEE / ACM / USENIX / DOI / URL).
 * 2) Write ONE canonical `name` that easyscholar can look up (CCF/SCI/IF…).
 *    Never “rename” a canonical string without validating getPublicationRank.
 * 3) JOURNAL_ALIASES.txt is one identity line per venue (auto-synced on build).
 *
 * Validated 2026-10-10 against easyscholar: prefer SIGCOMM/INFOCOM (not ACM/IEEE
 * prefixes); ICNP/ICDCS/IMC/OSDI need FULL names for CCF; TON works; NOMS has none.
 */
var UnifyVenueMap = {
  /**
   * @type {{name: string, kind: "conference"|"journal", patterns: RegExp[]}[]}
   */
  venues: [
    // ---- Security conferences ----
    {
      // easyscholar CCF: full symposium name
      name: "USENIX Security Symposium",
      kind: "conference",
      patterns: [
        /\busenix\s*security\s*symposium\b/i,
        /\b\d{1,2}(?:st|nd|rd|th)\s+usenix\s+security(?:\s+symposium)?\b/i,
        /\busenix\s*security\s*(?:symposium\s*)?(?:'?\d{2}|\d{4})\b/i,
        /\busenix\s*security\b/i,
        /\busenixsec(?:urity)?\b/i,
        /\bsec\s*'?\d{2}\b/i,
        /usenix\.org\/conference\/usenixsecurity/i,
      ],
    },
    {
      name: "USENIX ATC",
      kind: "conference",
      patterns: [
        /\busenix\s*annual\s*technical\s*conference\b/i,
        /\busenix\s*atc\b/i,
        /\batc\s*'?\d{2}\b/i,
        /\batc\d{2}\b/i,
        /\b\d{4}\s+usenix\s+annual\s+technical\s+conference\b/i,
        /usenix\.org\/conference\/atc/i,
      ],
    },
    {
      name: "NSDI",
      kind: "conference",
      patterns: [
        /\bnsdi\b/i,
        /\bnetworked\s*systems\s*design\s*and\s*implementation\b/i,
        /\busenix\s*symposium\s*on\s*networked\s*systems\s*design\b/i,
        /usenix\.org\/conference\/nsdi/i,
      ],
    },
    {
      // easyscholar: short "OSDI" often has no CCF; full name does
      name: "Operating Systems Design and Implementation",
      kind: "conference",
      patterns: [
        /\bosdi\b/i,
        /\boperating\s*systems\s*design\s*and\s*implementation\b/i,
        /\busenix\s*symposium\s*on\s*operating\s*systems\s*design\b/i,
        /usenix\.org\/conference\/osdi/i,
      ],
    },
    {
      name: "NDSS",
      kind: "conference",
      patterns: [
        /\bndss\b/i,
        /\bnetwork\s*and\s*distributed\s*system\s*security(?:\s*symposium)?\b/i,
        /\bnetwork\s*and\s*distributed\s*systems?\s*security\b/i,
        /\b\d{1,2}(?:st|nd|rd|th)\s+annual\s+network\s+and\s+distributed\b/i,
        /ndss-symposium\.org/i,
      ],
    },
    {
      name: "CCS",
      kind: "conference",
      patterns: [
        /\bacm\s*sigsac\s*conference\s*on\s*computer\s*and\s*communications\s*security\b/i,
        /\bconference\s*on\s*computer\s*and\s*communications\s*security\b/i,
        /\bcomputer\s*and\s*communications\s*security\b/i,
        /\bccs\s*'?\d{2}\b/i,
        /\bccs\s*\d{4}\b/i,
        /\bccs\b/i,
        /dl\.acm\.org\/doi\/.*ccs/i,
      ],
    },
    {
      name: "S&P",
      kind: "conference",
      patterns: [
        /\bieee\s*symposium\s*on\s*security\s*and\s*privacy\b/i,
        /\bsymposium\s*on\s*security\s*and\s*privacy\b/i,
        /\boekland\b/i,
        /\bieee\s*s\s*&\s*p\b/i,
        /\bs\s*&\s*p\b/i,
        /\bsp\s*'?\d{2}\b/i,
        /\b10\.1109\/sp[\.\/]/i,
      ],
    },
    {
      name: "EuroS&P",
      kind: "conference",
      patterns: [
        /\beuro(?:pean)?\s*symposium\s*on\s*security\s*and\s*privacy\b/i,
        /\beuros\s*&\s*p\b/i,
        /\beuro\s*s\s*&\s*p\b/i,
        /\beurosp\b/i,
        /\b10\.1109\/eurosp/i,
      ],
    },
    {
      name: "RAID",
      kind: "conference",
      patterns: [
        /\bresearch\s*in\s*attacks[,\s]*intrusions\s*and\s*defenses\b/i,
        /\brecent\s*advances\s*in\s*intrusion\s*detection\b/i,
        /\braid\s*'?\d{2}\b/i,
        /\braid\b/i,
      ],
    },
    {
      name: "ACSAC",
      kind: "conference",
      patterns: [
        /\bannual\s*computer\s*security\s*applications\s*conference\b/i,
        /\bacsac\b/i,
      ],
    },
    {
      name: "ESORICS",
      kind: "conference",
      patterns: [
        /\beuropean\s*symposium\s*on\s*research\s*in\s*computer\s*security\b/i,
        /\besorics\b/i,
      ],
    },
    {
      name: "DSN",
      kind: "conference",
      patterns: [
        /\bieee\/?ifip\s*international\s*conference\s*on\s*dependable\s*systems\b/i,
        /\bdependable\s*systems\s*and\s*networks\b/i,
        /\bdsn\b/i,
        /\b10\.1109\/dsn/i,
      ],
    },
    {
      name: "PETS",
      kind: "conference",
      patterns: [
        /\bprivacy\s*enhancing\s*technologies(?:\s*symposium)?\b/i,
        /\bproceedings\s+on\s+privacy\s+enhancing\s+technologies\b/i,
        /\bpopets\b/i,
        /\bpets\b/i,
      ],
    },
    {
      name: "SOUPS",
      kind: "conference",
      patterns: [
        /\bsymposium\s*on\s*usable\s*privacy\s*and\s*security\b/i,
        /\busable\s*privacy\s*and\s*security\b/i,
        /\bsoups\b/i,
        /usenix\.org\/conference\/soups/i,
      ],
    },
    {
      name: "FC",
      kind: "conference",
      patterns: [
        /\bfinancial\s*cryptography(?:\s*and\s*data\s*security)?\b/i,
        /\bfc\s*'?\d{2}\b/i,
      ],
    },
    {
      name: "WiSec",
      kind: "conference",
      patterns: [
        /\bacm\s*conference\s*on\s*security\s*and\s*privacy\s*in\s*wireless\b/i,
        /\bwisec\b/i,
        /\bwireless\s*network\s*security\b/i,
      ],
    },

    // ---- Network / systems / web ----
    {
      // easyscholar CCF query name: SIGCOMM (not "ACM SIGCOMM")
      name: "SIGCOMM",
      kind: "conference",
      patterns: [
        /\bproceedings\s+of\s+the\s+acm\s+sigcomm\b/i,
        /\bsigcomm\s*'?\d{2}\s*:\s*acm\s+sigcomm\b/i,
        /\bacm\s*sigcomm(?:\s+\d{4})?(?:\s+conference)?\b/i,
        /\bsigcomm\s+(?:'?\d{2}\s+)?posters?\s*(?:and|&)\s*demos?\b/i,
        /\bsigcomm\s*'?\d{2}\b/i,
        /\bsigcomm\b/i,
      ],
    },
    {
      // easyscholar CCF query name: INFOCOM (not "IEEE INFOCOM")
      name: "INFOCOM",
      kind: "conference",
      patterns: [
        /\bieee\s*infocom\b/i,
        /\binfocom\s*\d{4}\b/i,
        /\binfocom\b/i,
        /\bieee\s*conference\s*on\s*computer\s*communications\b/i,
        /\bconference\s*on\s*computer\s*communications\b/i,
        /\b10\.1109\/infocom/i,
        /\b10\.1109\/INFOCOM/i,
      ],
    },
    {
      // easyscholar CCF query name: full IMC title (short "IMC" has no CCF)
      name: "Internet Measurement Conference",
      kind: "conference",
      patterns: [
        /\binternet\s*measurement\s*conference\b/i,
        /\bacm\s*imc\b/i,
        /\bimc\s*'?\d{2}\b/i,
        /\bimc\s*\d{4}\b/i,
        /\bimc\b/i,
        /conferences\.sigcomm\.org\/imc/i,
      ],
    },
    {
      name: "CoNEXT",
      kind: "conference",
      patterns: [
        /\bconext\b/i,
        /\binternational\s*conference\s*on\s*emerging\s*networking\s*experiments\b/i,
        /conferences\.sigcomm\.org\/co-?next/i,
      ],
    },
    {
      name: "PAM",
      kind: "conference",
      patterns: [
        /\bpassive\s*and\s*active\s*measurement(?:\s*conference)?\b/i,
        /\bpam\s*'?\d{2}\b/i,
        /\bpam\s*\d{4}\b/i,
      ],
    },
    {
      name: "MobiCom",
      kind: "conference",
      patterns: [
        /\binternational\s*conference\s*on\s*mobile\s*computing\s*and\s*networking\b/i,
        /\bmobile\s*computing\s*and\s*networking\b/i,
        /\bmobicom\b/i,
      ],
    },
    {
      name: "WWW",
      kind: "conference",
      patterns: [
        /\bthe\s*web\s*conference\b/i,
        /\bworld\s*wide\s*web\s*conference\b/i,
        /\binternational\s*world\s*wide\s*web\s*conference\b/i,
        /\bwww\s*'?\d{2}\b/i,
        /\bwww\s*\d{4}\b/i,
        /\bacm\s*www\b/i,
      ],
    },
    {
      name: "ICSE",
      kind: "conference",
      patterns: [
        /\binternational\s*conference\s*on\s*software\s*engineering\b/i,
        /\bicse\b/i,
        /\b10\.1109\/icse/i,
      ],
    },
    {
      name: "SOSP",
      kind: "conference",
      patterns: [
        /\bacm\s*symposium\s*on\s*operating\s*systems\s*principles\b/i,
        /\bsymposium\s*on\s*operating\s*systems\s*principles\b/i,
        /\bsosp\b/i,
      ],
    },
    {
      name: "ASPLOS",
      kind: "conference",
      patterns: [
        /\binternational\s*conference\s*on\s*architectural\s*support\b/i,
        /\barchitectural\s*support\s*for\s*programming\s*languages\b/i,
        /\basplos\b/i,
      ],
    },
    {
      name: "EuroSys",
      kind: "conference",
      patterns: [
        /\beuropean\s*conference\s*on\s*computer\s*systems\b/i,
        /\beurosys\b/i,
      ],
    },
    {
      // easyscholar CCF: full name (short "ICNP" has no CCF)
      name: "International Conference on Network Protocols",
      kind: "conference",
      patterns: [
        /\binternational\s*conference\s*on\s*network\s*protocols\b/i,
        /\bicnp\b/i,
        /\b10\.1109\/icnp/i,
      ],
    },
    {
      // easyscholar CCF: full name (short "ICDCS" has no CCF)
      name: "International Conference on Distributed Computing Systems",
      kind: "conference",
      patterns: [
        /\binternational\s*conference\s*on\s*distributed\s*computing\s*systems\b/i,
        /\bicdcs\b/i,
        /\b10\.1109\/icdcs/i,
      ],
    },
    {
      // easyscholar CCF B: full workshop title (short IWQoS / Symposium title fail)
      name: "International Workshop on Quality of Service",
      kind: "conference",
      patterns: [
        /\binternational\s*workshop\s*on\s*quality\s*of\s*service\b/i,
        /\binternational\s*symposium\s*on\s*quality\s*of\s*service\b/i,
        /\bieee\s*\/?\s*acm\s*iwqos\b/i,
        /\bieee\/acm\s*iwqos\b/i,
        /\biwqos\b/i,
        /\b10\.1109\/iwqos/i,
      ],
    },
    {
      // easyscholar: ICC (CCF C)
      name: "ICC",
      kind: "conference",
      patterns: [
        /\bieee\s*international\s*conference\s*on\s*communications\b/i,
        /\binternational\s*conference\s*on\s*communications\b/i,
        /\bieee\s*icc\b/i,
        /\bicc\s*\d{4}\b/i,
        /\b10\.1109\/icc[\.\/]/i,
        /(^|[\s;,\|\/\-\[\(])icc($|[\s;,\|\/\-\.\]\)])/i,
      ],
    },
    {
      name: "NOSSDAV",
      kind: "conference",
      patterns: [
        /\bnetwork\s*and\s*operating\s*system\s*support\s*for\s*digital\s*audio\s*and\s*video\b/i,
        /\bnossdav\b/i,
      ],
    },
    {
      name: "ISCC",
      kind: "conference",
      patterns: [
        /\bieee\s*symposium\s*on\s*computers\s*and\s*communications\b/i,
        /\bsymposium\s*on\s*computers\s*and\s*communications\b/i,
        /\bieee\s*iscc\b/i,
        /\biscc\b/i,
        /\b10\.1109\/iscc/i,
      ],
    },
    {
      name: "IPCCC",
      kind: "conference",
      patterns: [
        /\binternational\s*performance\s*(?:computing\s*and\s*)?communications\s*conference\b/i,
        /\bieee\s*ipccc\b/i,
        /\bipccc\b/i,
        /\b10\.1109\/ipccc/i,
      ],
    },

    // ---- Journals ----
    {
      name: "TON",
      kind: "journal",
      patterns: [
        /\bieee\s*\/\s*acm\s*transactions\s*on\s*networking\b/i,
        /\bieee\/acm\s*transactions\s*on\s*networking\b/i,
        /\bieee\s*acm\s*transactions\s*on\s*networking\b/i,
        /\bieee\s*transactions\s*on\s*networking\b/i,
        /\btransactions\s*on\s*networking\b/i,
        /\bieee\s*trans(?:actions)?\.?\s*netw(?:orking)?\b/i,
        /(^|[\s;,\|\/\-\[\(])ton($|[\s;,\|\/\-\.\]\)]|\d)/i,
        /\b10\.1109\/ton[\.\/]/i,
        /\b10\.1109\/TNET[\.\/]/i,
      ],
    },
    {
      name: "JSAC",
      kind: "journal",
      patterns: [
        /\bieee\s*journal\s*(?:on|of)\s*selected\s*areas\s*in\s*communications\b/i,
        /\bjournal\s*on\s*selected\s*areas\s*in\s*communications\b/i,
        /\bjsac\b/i,
        /\b10\.1109\/jsac/i,
      ],
    },
    {
      name: "TDSC",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*dependable\s*and\s*secure\s*computing\b/i,
        /\btransactions\s*on\s*dependable\s*and\s*secure\s*computing\b/i,
        /\btdsc\b/i,
        /\b10\.1109\/tdsc/i,
      ],
    },
    {
      name: "TIFS",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*information\s*forensics\s*and\s*security\b/i,
        /\btransactions\s*on\s*information\s*forensics\s*and\s*security\b/i,
        /\btifs\b/i,
        /\b10\.1109\/tifs/i,
      ],
    },
    {
      name: "TOPS",
      kind: "journal",
      patterns: [
        /\bacm\s*transactions\s*on\s*privacy\s*and\s*security\b/i,
        /\btransactions\s*on\s*privacy\s*and\s*security\b/i,
        /\bacm\s*transactions\s*on\s*information\s*and\s*system\s*security\b/i,
        /\btissec\b/i,
        /\btops\b/i,
      ],
    },
    {
      name: "Computers & Security",
      kind: "journal",
      patterns: [
        /\bcomputers\s*&\s*security\b/i,
        /\bcomputers\s+and\s+security\b/i,
        /\b10\.1016\/j\.cose\b/i,
      ],
    },
    {
      name: "Computer Networks",
      kind: "journal",
      patterns: [
        /\bcomputer\s*networks\b/i,
        /\b10\.1016\/j\.comnet\b/i,
      ],
    },
    {
      name: "IEEE Transactions on Network and Service Management",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*network\s*and\s*service\s*management\b/i,
        /\btransactions\s*on\s*network\s*and\s*service\s*management\b/i,
        /\btnsm\b/i,
        /\b10\.1109\/tnsm/i,
      ],
    },
    {
      name: "Cybersecurity",
      kind: "journal",
      patterns: [
        /\bjournal\s+of\s+cybersecurity\b/i,
        /(^|[\s;,\|\/\-])cybersecurity($|[\s;,\|\/\-\.])/i,
        /\b10\.1186\/s42400\b/i, // Springer Cybersecurity
      ],
    },
    {
      name: "Journal of Computer Security",
      kind: "journal",
      patterns: [/\bjournal\s*of\s*computer\s*security\b/i],
    },
    {
      name: "IEEE Security & Privacy",
      kind: "journal",
      patterns: [
        /\bieee\s*security\s*&\s*privacy\b/i,
        /\bieee\s*security\s+and\s+privacy\b/i,
        /\bieee\s*sec(?:urity)?\s*&\s*priv(?:acy)?\b/i,
        /\b10\.1109\/msec/i,
      ],
    },
    {
      // magazine; easyscholar has IF (no CCF)
      name: "IEEE Network",
      kind: "journal",
      patterns: [
        /\bieee\s*network\b/i,
        /\b10\.1109\/mnet/i,
      ],
    },
    {
      name: "TPDS",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*parallel\s*and\s*distributed\s*systems\b/i,
        /\btransactions\s*on\s*parallel\s*and\s*distributed\s*systems\b/i,
        /\btpds\b/i,
        /\b10\.1109\/tpds/i,
      ],
    },
    {
      name: "TMC",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*mobile\s*computing\b/i,
        /\btransactions\s*on\s*mobile\s*computing\b/i,
        /\btmc\b/i,
        /\b10\.1109\/tmc/i,
      ],
    },
    {
      name: "TSC",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*services\s*computing\b/i,
        /\btransactions\s*on\s*services\s*computing\b/i,
        /\btsc\b/i,
        /\b10\.1109\/tsc/i,
      ],
    },
    {
      // easyscholar: TC — avoid matching TCAD / TCP
      name: "TC",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*computers\b/i,
        /\btransactions\s*on\s*computers\b/i,
        /\b10\.1109\/tc(?![a-z])/i,
        /(^|[\s;,\|\/\-\[\(])tc($|[\s;,\|\/\-\.\]\)]|\d)/i,
      ],
    },
    {
      name: "TCAD",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*computer-?aided\s*design(?:\s*of\s*integrated\s*circuits\s*and\s*systems)?\b/i,
        /\btransactions\s*on\s*computer-?aided\s*design\b/i,
        /\btcad\b/i,
        /\b10\.1109\/tcad/i,
      ],
    },
    {
      name: "Expert Systems with Applications",
      kind: "journal",
      patterns: [
        /\bexpert\s*systems\s*with\s*applications\b/i,
        /\b10\.1016\/j\.eswa\b/i,
      ],
    },
    {
      name: "Science China Information Sciences",
      kind: "journal",
      patterns: [
        /\bscience\s*china\s*information\s*sciences\b/i,
        /\bsci\.\s*china\s*inf(?:ormation)?\.?\s*sci/i,
        /\b10\.1007\/s11432\b/i,
      ],
    },
    {
      name: "Scientific Reports",
      kind: "journal",
      patterns: [
        /\bscientific\s*reports\b/i,
        /\b10\.1038\/s41598\b/i,
      ],
    },
  ],

  /**
   * Resolve free-text (fields / URL / DOI / PDF header) to a canonical venue.
   * Prefers the longest regex match so specific titles beat short tokens.
   */
  resolve(text) {
    if (!text || typeof text !== "string") return null;
    const s = text.trim();
    if (!s) return null;

    let best = null;
    let bestLen = -1;
    for (const venue of this.venues) {
      if (!venue.patterns || !venue.patterns.length) continue;
      for (const re of venue.patterns) {
        const m = s.match(re);
        if (!m) continue;
        const len = m[0].length;
        if (len > bestLen) {
          bestLen = len;
          best = venue;
        }
      }
    }
    return best;
  },

  /** One identity alias line per canonical venue (for Style paste). */
  toJournalAliases() {
    const seen = new Set();
    const lines = [];
    for (const v of this.venues) {
      if (seen.has(v.name)) continue;
      seen.add(v.name);
      lines.push(v.name + " = " + v.name);
    }
    return lines.join("\n") + "\n";
  },
};
