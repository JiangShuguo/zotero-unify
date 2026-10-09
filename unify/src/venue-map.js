/**
 * Canonical venue names for Unify + Ethereal Style Journal Aliases.
 * Patterns match Crossref / USENIX / ACM / IEEE style titles.
 * Keep in sync with JOURNAL_ALIASES.txt
 */
var UnifyVenueMap = {
  /**
   * @type {{name: string, kind: "conference"|"journal", patterns: RegExp[]}[]}
   */
  venues: [
    // ---- Security conferences ----
    {
      // CCF / easyscholar typically match the full symposium name
      name: "USENIX Security Symposium",
      kind: "conference",
      patterns: [
        /\busenix\s*security\s*symposium\b/i,
        /\busenix\s*security\b/i,
        /\busenixsec\b/i,
        /\b\d{1,2}(st|nd|rd|th)?\s+usenix\s+security\b/i,
        /\bsec\s*'?\d{2}\b/i,
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
      ],
    },
    {
      name: "NSDI",
      kind: "conference",
      patterns: [
        /\bnsdi\b/i,
        /\bnetworked\s*systems\s*design\s*and\s*implementation\b/i,
      ],
    },
    {
      // easyscholar: short "OSDI" has no CCF; full name does
      name: "Operating Systems Design and Implementation",
      kind: "conference",
      patterns: [
        /\bosdi\b/i,
        /\boperating\s*systems\s*design\s*and\s*implementation\b/i,
      ],
    },
    {
      name: "NDSS",
      kind: "conference",
      patterns: [
        /\bndss\b/i,
        /\bnetwork\s*and\s*distributed\s*system\s*security\b/i,
        /\bnetwork\s*and\s*distributed\s*system\s*security\s*symposium\b/i,
      ],
    },
    {
      name: "CCS",
      kind: "conference",
      patterns: [
        /\bacm\s*sigsac\s*conference\s*on\s*computer\s*and\s*communications\s*security\b/i,
        /\bcomputer\s*and\s*communications\s*security\b/i,
        /\bccs\b/i,
      ],
    },
    {
      name: "S&P",
      kind: "conference",
      patterns: [
        /\bieee\s*symposium\s*on\s*security\s*and\s*privacy\b/i,
        /\boekland\b/i,
        /\bs\s*&\s*p\b/i,
        /\bsp\s*'?\d{2}\b/i,
      ],
    },
    {
      name: "EuroS&P",
      kind: "conference",
      patterns: [/\beuros\s*&\s*p\b/i, /\beuro\s*s\s*&\s*p\b/i, /\beurosp\b/i],
    },
    {
      name: "RAID",
      kind: "conference",
      patterns: [/\braid\b/i, /\brecent\s*advances\s*in\s*intrusion\s*detection\b/i],
    },
    {
      name: "ACSAC",
      kind: "conference",
      patterns: [/\bacsac\b/i, /\bannual\s*computer\s*security\s*applications\s*conference\b/i],
    },
    {
      name: "ESORICS",
      kind: "conference",
      patterns: [/\besorics\b/i],
    },
    {
      name: "DSN",
      kind: "conference",
      patterns: [
        /\bdsn\b/i,
        /\bdependable\s*systems\s*and\s*networks\b/i,
      ],
    },
    {
      name: "PETS",
      kind: "conference",
      patterns: [/\bpets\b/i, /\bprivacy\s*enhancing\s*technologies\b/i],
    },
    {
      name: "SOUPS",
      kind: "conference",
      patterns: [/\bsoups\b/i, /\busable\s*privacy\s*and\s*security\b/i],
    },
    {
      name: "FC",
      kind: "conference",
      patterns: [/\bfinancial\s*cryptography\b/i, /\bfc\s*'?\d{2}\b/i],
    },
    {
      name: "WiSec",
      kind: "conference",
      patterns: [/\bwisec\b/i, /\bwireless\s*security\b/i],
    },

    // ---- Network / systems / web ----
    {
      name: "SIGCOMM",
      kind: "conference",
      patterns: [
        /\bsigcomm\b/i,
        /\bacm\s*sigcomm\b/i,
        /\bproceedings\s+of\s+the\s+acm\s+sigcomm\b/i,
      ],
    },
    {
      name: "INFOCOM",
      kind: "conference",
      patterns: [
        /\binfocom\b/i,
        /\bieee\s*infocom\b/i,
        /\bieee\s*conference\s*on\s*computer\s*communications\b/i,
      ],
    },
    {
      name: "Internet Measurement Conference",
      kind: "conference",
      patterns: [
        /\binternet\s*measurement\s*conference\b/i,
        /\bimc\s*'?\d{2}\b/i,
        /\bacm\s*imc\b/i,
      ],
    },
    {
      name: "CoNEXT",
      kind: "conference",
      patterns: [/\bconext\b/i],
    },
    {
      name: "PAM",
      kind: "conference",
      patterns: [/\bpassive\s*and\s*active\s*measurement\b/i, /\bpam\s*'?\d{2}\b/i],
    },
    {
      name: "MobiCom",
      kind: "conference",
      patterns: [/\bmobicom\b/i, /\bmobile\s*computing\s*and\s*networking\b/i],
    },
    {
      name: "WWW",
      kind: "conference",
      patterns: [
        /\bthe\s*web\s*conference\b/i,
        /\bworld\s*wide\s*web\s*conference\b/i,
        /\bwww\s*'?\d{2}\b/i,
        /\bacm\s*www\b/i,
        /\bproceedings\s+of\s+.*\bwww\b/i,
      ],
    },
    {
      name: "ICSE",
      kind: "conference",
      patterns: [/\bicse\b/i, /\binternational\s*conference\s*on\s*software\s*engineering\b/i],
    },
    {
      name: "SOSP",
      kind: "conference",
      patterns: [/\bsosp\b/i, /\bsymposium\s*on\s*operating\s*systems\s*principles\b/i],
    },
    {
      name: "ASPLOS",
      kind: "conference",
      patterns: [/\basplos\b/i],
    },
    {
      name: "EuroSys",
      kind: "conference",
      patterns: [/\beurosys\b/i],
    },
    {
      name: "International Conference on Network Protocols",
      kind: "conference",
      patterns: [/\bicnp\b/i, /\binternational\s*conference\s*on\s*network\s*protocols\b/i],
    },
    {
      name: "International Conference on Distributed Computing Systems",
      kind: "conference",
      patterns: [/\bicdcs\b/i, /\binternational\s*conference\s*on\s*distributed\s*computing\s*systems\b/i],
    },

    // ---- Journals ----
    {
      name: "TON",
      kind: "journal",
      patterns: [
        /\bieee\s*\/?\s*acm\s*transactions\s*on\s*networking\b/i,
        /\bieee\/acm\s*transactions\s*on\s*networking\b/i,
        /(^|[\s\/\-])ton($|[\s\/\-\.])/i,
      ],
    },
    {
      name: "JSAC",
      kind: "journal",
      patterns: [
        /\bieee\s*journal\s*on\s*selected\s*areas\s*in\s*communications\b/i,
        /\bjsac\b/i,
      ],
    },
    {
      name: "TDSC",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*dependable\s*and\s*secure\s*computing\b/i,
        /\btdsc\b/i,
      ],
    },
    {
      name: "TIFS",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*information\s*forensics\s*and\s*security\b/i,
        /\btifs\b/i,
      ],
    },
    {
      name: "TOPS",
      kind: "journal",
      patterns: [
        /\bacm\s*transactions\s*on\s*privacy\s*and\s*security\b/i,
        /\btops\b/i,
        /\btissec\b/i,
      ],
    },
    {
      name: "Computers & Security",
      kind: "journal",
      patterns: [/\bcomputers\s*&\s*security\b/i, /\bcomputers\s+and\s+security\b/i],
    },
    {
      name: "Computer Networks",
      kind: "journal",
      patterns: [/\bcomputer\s*networks\b/i],
    },
    {
      name: "IEEE Transactions on Network and Service Management",
      kind: "journal",
      patterns: [
        /\bieee\s*transactions\s*on\s*network\s*and\s*service\s*management\b/i,
        /\btnsm\b/i,
      ],
    },
    {
      name: "Cybersecurity",
      kind: "journal",
      patterns: [/\bcybersecurity\b/i],
    },
    {
      name: "Journal of Computer Security",
      kind: "journal",
      patterns: [/\bjournal\s*of\s*computer\s*security\b/i],
    },
    {
      name: "IEEE Security & Privacy",
      kind: "journal",
      patterns: [/\bieee\s*security\s*&\s*privacy\b/i, /\bieee\s*security\s+and\s+privacy\b/i],
    },
  ],

  /**
   * Resolve a free-text venue string to a canonical entry.
   * Longer / more specific patterns win by scanning in list order with first match;
   * USENIX Security is listed before generic USENIX ATC patterns carefully.
   */
  resolve(text) {
    if (!text || typeof text !== "string") return null;
    const s = text.trim();
    if (!s) return null;
    for (const venue of this.venues) {
      if (!venue.patterns || !venue.patterns.length) continue;
      for (const re of venue.patterns) {
        if (re.test(s)) return venue;
      }
    }
    return null;
  },

  /** Journal Aliases: one identity line per venue (same name on both sides). */
  toJournalAliases() {
    const seen = new Set();
    const lines = [];
    for (const v of this.venues) {
      if (seen.has(v.name)) continue;
      seen.add(v.name);
      lines.push(v.name + " = " + v.name);
    }
    return lines.join("\n");
  },
};
