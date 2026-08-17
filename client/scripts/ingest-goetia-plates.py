#!/usr/bin/env python3
"""
Download Mathers 1904 Goetia plates from Wikimedia Commons and write
gold-on-transparent PNGs next to the generated SVG fallbacks.

Reads the Commons map from client/src/data/goetiaSealPlates.ts and spirit
names from client/src/data/arsGoetia.ts.

Usage (from repo root or client/):
  python3 client/scripts/ingest-goetia-plates.py
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
CLIENT = HERE.parent
PLATES_TS = CLIENT / "src" / "data" / "goetiaSealPlates.ts"
ARS_TS = CLIENT / "src" / "data" / "arsGoetia.ts"
OUT_DIR = CLIENT / "public" / "assets" / "Images" / "Goetia"
ORIG_DIR = OUT_DIR / "mathers-1904"
COVERAGE_PATH = HERE / "goetia-plates-coverage.json"

USER_AGENT = (
    "AnanaelPlateIngest/1.0 "
    "(https://ananael.tech; educational PD plate ingest)"
)
FILEPATH = "https://commons.wikimedia.org/wiki/Special:FilePath/"
THUMB = "https://commons.wikimedia.org/w/thumb.php"
GOLD = (232, 197, 71, 255)  # #e8c547
SLEEP_S = 1.2
MAX_RETRIES = 6


def seal_ref(number: int, name: str) -> str:
    pad = f"{number:02d}"
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"seal-{pad}-{slug}"


def parse_spirit_calls(text: str) -> list[tuple[int, str]]:
    pat = re.compile(r"spirit\((\d+),\s*'([^']+)',")
    return [(int(n), name) for n, name in pat.findall(text)]


def parse_plate_map(text: str) -> dict[int, dict[str, str]]:
    pat = re.compile(
        r"(\d+):\s*\{\s*commonsFile:\s*'([^']+)',\s*kind:\s*'(\w+)'"
        r"(?:,\s*preferGenerated:\s*(true))?"
    )
    out: dict[int, dict[str, str]] = {}
    for n, filename, kind, prefer in pat.findall(text):
        out[int(n)] = {
            "commonsFile": filename,
            "kind": kind,
            "preferGenerated": bool(prefer),
        }
    return out


def download(url: str) -> bytes:
    delay = 8.0
    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except urllib.error.HTTPError as err:
            last_err = err
            if err.code in (429, 503) and attempt < MAX_RETRIES - 1:
                time.sleep(delay)
                delay *= 1.8
                continue
            raise
        except urllib.error.URLError as err:
            last_err = err
            if attempt < MAX_RETRIES - 1:
                time.sleep(delay)
                delay *= 1.8
                continue
            raise
    raise last_err or RuntimeError(f"download failed: {url}")


def source_url(commons_file: str) -> str:
    if commons_file.lower().endswith(".svg"):
        return f"{THUMB}?{urllib.parse.urlencode({'f': commons_file, 'w': 450})}"
    return FILEPATH + urllib.parse.quote(commons_file)


def flatten_on_white(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
    return Image.alpha_composite(bg, rgba)


def gold_tint(im: Image.Image) -> Image.Image:
    # Normalize SVG thumbs (black-on-transparent) to dark-on-light, then invert.
    flat = flatten_on_white(im)
    gray = ImageOps.grayscale(flat)
    alpha_src = ImageOps.invert(gray)
    gold = Image.new("RGBA", alpha_src.size, GOLD)
    gold.putalpha(alpha_src)
    if gold.getextrema()[3][1] == 0:
        raise RuntimeError("gold tint produced empty alpha")
    return gold


def raster_from_bytes(raw: bytes) -> Image.Image:
    return Image.open(BytesIO(raw)).convert("RGBA")


def main() -> int:
    spirits = parse_spirit_calls(ARS_TS.read_text(encoding="utf-8"))
    plates = parse_plate_map(PLATES_TS.read_text(encoding="utf-8"))
    if len(spirits) != 72:
        print(f"expected 72 spirits, got {len(spirits)}", file=sys.stderr)
        return 1
    if len(plates) != 72:
        print(f"expected 72 plate map entries, got {len(plates)}", file=sys.stderr)
        return 1

    ORIG_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    coverage: list[dict] = []
    ok = 0
    failed: list[str] = []

    for number, name in spirits:
        src = plates[number]
        ref = seal_ref(number, name)
        row: dict = {
            "number": number,
            "name": name,
            "sealRef": ref,
            "commonsFile": src["commonsFile"],
            "kind": src["kind"],
            "status": "fallback",
        }
        dest = OUT_DIR / f"{ref}.png"
        orig_stem = src["commonsFile"].replace(" ", "_")
        if dest.is_file():
            try:
                existing = Image.open(dest)
                if existing.mode == "RGBA" and existing.getextrema()[3][1] == 0:
                    dest.unlink()
                    print(f"{number:02d} {name}: empty plate, re-ingest")
            except OSError:
                dest.unlink(missing_ok=True)
        if src.get("preferGenerated"):
            row["status"] = "prefer-generated"
            coverage.append(row)
            print(f"{number:02d} {name}: skip (prefer generated)")
            continue
        if dest.is_file() and dest.stat().st_size > 0:
            row["status"] = "plate"
            row["processed"] = dest.name
            row["skipped"] = True
            ok += 1
            coverage.append(row)
            print(f"{number:02d} {name}: already have {dest.name}")
            continue
        try:
            url = source_url(src["commonsFile"])
            orig_bytes = download(url)
            orig_name = orig_stem
            if src["commonsFile"].lower().endswith(".svg"):
                orig_name = orig_stem.rsplit(".", 1)[0] + ".png"
            (ORIG_DIR / orig_name).write_bytes(orig_bytes)

            tinted = gold_tint(raster_from_bytes(orig_bytes))
            tinted.save(dest, format="PNG", optimize=True)
            row["status"] = "plate"
            row["original"] = orig_name
            row["processed"] = dest.name
            ok += 1
            print(f"{number:02d} {name}: plate → {dest.name} ({src['kind']})")
        except (
            urllib.error.URLError,
            urllib.error.HTTPError,
            OSError,
            RuntimeError,
            FileNotFoundError,
            Image.UnidentifiedImageError,
        ) as err:
            row["status"] = "fallback"
            row["error"] = str(err)
            failed.append(f"{number} {name}: {err}")
            print(f"{number:02d} {name}: FALLBACK ({err})", file=sys.stderr)
        coverage.append(row)
        time.sleep(SLEEP_S)

    report = {
        "source": "Wikimedia Commons — Category:Ars Goetia sigils",
        "book": "The Book of the Goetia of Solomon the King (Mathers/Crowley, 1904)",
        "spirits": 72,
        "plates": ok,
        "fallback": 72 - ok,
        "dualPicked": "seal01",
        "entries": coverage,
    }
    COVERAGE_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"\ncoverage: {ok}/72 plates → {COVERAGE_PATH}")
    if failed:
        print("failures:", file=sys.stderr)
        for line in failed:
            print(f"  {line}", file=sys.stderr)
    return 0 if ok == 72 else 1


if __name__ == "__main__":
    raise SystemExit(main())
