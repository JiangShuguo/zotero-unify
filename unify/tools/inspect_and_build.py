# -*- coding: utf-8 -*-
"""Build Unify XPI for Zotero 10 (requires applications.zotero.update_url)."""
import json
import struct
import time
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "build" / "unify.xpi"
ADDON_ID = "unify@jsg.local"
VERSION = "1.0.0"
HOMEPAGE = "https://github.com/JiangShuguo/zotero-unify"
UPDATE_URL = (
    "https://raw.githubusercontent.com/JiangShuguo/zotero-unify/main/unify/updates.json"
)


def make_manifest():
    return {
        "manifest_version": 2,
        "name": "Unify",
        "version": VERSION,
        "description": "Normalize venue names for publication tags and enrich USENIX metadata.",
        "homepage_url": HOMEPAGE,
        "author": "jsg",
        "icons": {"48": "icon.png", "96": "icon@2x.png"},
        "applications": {
            "zotero": {
                "id": ADDON_ID,
                "update_url": UPDATE_URL,
                "strict_min_version": "6.999",
                "strict_max_version": "10.*",
            }
        },
    }


def patch_zip_utf8_flags(path: Path):
    data = bytearray(path.read_bytes())
    eocd = data.rfind(b"PK\x05\x06")
    if eocd < 0:
        return
    cd_size = struct.unpack_from("<I", data, eocd + 12)[0]
    cd_off = struct.unpack_from("<I", data, eocd + 16)[0]
    pos = cd_off
    end = cd_off + cd_size
    while pos < end:
        if data[pos : pos + 4] != b"PK\x01\x02":
            break
        flags = struct.unpack_from("<H", data, pos + 8)[0] | 0x800
        struct.pack_into("<H", data, pos + 8, flags)
        local_off = struct.unpack_from("<I", data, pos + 42)[0]
        name_len = struct.unpack_from("<H", data, pos + 28)[0]
        extra_len = struct.unpack_from("<H", data, pos + 30)[0]
        comment_len = struct.unpack_from("<H", data, pos + 32)[0]
        if data[local_off : local_off + 4] == b"PK\x03\x04":
            lflags = struct.unpack_from("<H", data, local_off + 6)[0] | 0x800
            struct.pack_into("<H", data, local_off + 6, lflags)
        pos += 46 + name_len + extra_len + comment_len
    path.write_bytes(data)


def validate_utf8(path: Path):
    data = path.read_bytes()
    try:
        data.decode("utf-8")
    except UnicodeDecodeError as e:
        raise SystemExit(f"Non-UTF8 file: {path}: {e}")


def build():
    manifest = make_manifest()
    files = {
        "manifest.json": json.dumps(manifest, indent=2, ensure_ascii=True).encode(
            "utf-8"
        )
        + b"\n",
        "bootstrap.js": (ROOT / "bootstrap.js").read_bytes(),
        "icon.png": (ROOT / "icon.png").read_bytes(),
        "icon@2x.png": (ROOT / "icon@2x.png").read_bytes(),
        "JOURNAL_ALIASES.txt": (ROOT / "JOURNAL_ALIASES.txt").read_bytes(),
        "venue-map.js": (ROOT / "src" / "venue-map.js").read_bytes(),
        "usenix.js": (ROOT / "src" / "usenix.js").read_bytes(),
        "normalizer.js": (ROOT / "src" / "normalizer.js").read_bytes(),
        "unify.js": (ROOT / "src" / "unify.js").read_bytes(),
    }

    (ROOT / "manifest.json").write_bytes(files["manifest.json"])
    for name in ("venue-map.js", "usenix.js", "normalizer.js", "unify.js"):
        (ROOT / name).write_bytes(files[name])

    if OUT.exists():
        OUT.unlink()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(OUT, "w") as z:
        for name, data in files.items():
            info = zipfile.ZipInfo(name, time.localtime(time.time())[:6])
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0x81A40000
            info.flag_bits = 0x800
            z.writestr(info, data)
            print("+", name)

    patch_zip_utf8_flags(OUT)
    for _n, _d in files.items():
        if _n.endswith(".js"):
            try:
                _d.decode("utf-8")
            except UnicodeDecodeError as e:
                raise SystemExit(f"Non-UTF8 payload {_n}: {e}")
    print("Built", OUT, OUT.stat().st_size)
    with zipfile.ZipFile(OUT) as z:
        print(z.read("manifest.json").decode())
        print("entries:", z.namelist())
    return files


if __name__ == "__main__":
    build()
    print("Install from:", OUT)
    print("Zotero: Tools -> Plugins -> Install Plugin From File")
