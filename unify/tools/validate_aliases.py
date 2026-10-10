# -*- coding: utf-8 -*-
"""Validate JOURNAL_ALIASES / venue-map canonical names against easyscholar.

Reads the secret key from the local Zotero prefs.js (never prints it).
Usage:
  python unify/tools/validate_aliases.py
"""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREFS = (
    Path.home()
    / "AppData/Roaming/Zotero/Zotero/Profiles/uoyv7cci.default/prefs.js"
)


def load_key() -> str:
    text = PREFS.read_text(encoding="utf-8", errors="ignore")
    m = re.search(
        r'zoterostyle\.easyscholar\.secretKey",\s*"([^"]+)"', text
    )
    if not m:
        raise SystemExit("easyscholar secretKey not found in prefs.js")
    return m.group(1)


def load_names() -> list[str]:
    aliases = (ROOT / "JOURNAL_ALIASES.txt").read_text(encoding="utf-8")
    names = []
    for line in aliases.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        left, right = [x.strip() for x in line.split("=", 1)]
        # Style queries the right-hand side; identity lines use the same name.
        names.append(right or left)
    return names


def probe(key: str, name: str) -> dict:
    q = urllib.parse.urlencode(
        {"secretKey": key, "publicationName": name}
    )
    url = f"https://easyscholar.cc/open/getPublicationRank?{q}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    all_rank = (((data or {}).get("data") or {}).get("officialRank") or {}).get(
        "all"
    ) or {}
    return {
        "name": name,
        "ccf": all_rank.get("ccf") or "",
        "sciif": all_rank.get("sciif") or "",
        "ok": bool(all_rank.get("ccf") or all_rank.get("sciif")),
    }


def main():
    key = load_key()
    names = load_names()
    bad = []
    for name in names:
        r = probe(key, name)
        mark = "OK" if r["ok"] else "FAIL"
        print(f"{mark}\tccf={r['ccf'] or '-'}\tsciif={r['sciif'] or '-'}\t{name}")
        if not r["ok"]:
            bad.append(name)
        time.sleep(0.15)
    print()
    if bad:
        print("Not queryable (%d):" % len(bad))
        for n in bad:
            print(" -", n)
        raise SystemExit(1)
    print("All %d aliases are queryable." % len(names))


if __name__ == "__main__":
    main()
