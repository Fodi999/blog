#!/usr/bin/env python3
"""Split monolithic messages/{locale}.json into DDD-style per-domain files.

Output structure:
    messages/
        {locale}/
            metadata.json
            nav.json
            chef-tools.json
            home.json
            recipes.json
            blog.json
            about.json
            contact.json
            footer.json
            legal.json
            recipe-analysis.json
            auth.json
            app.json
            billing.json

Each per-domain file preserves the original top-level namespace(s),
so the loader can simply Object.assign all parts together.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESSAGES = ROOT / "messages"

LOCALES = ["en", "ru", "pl", "uk"]

# Domain → list of top-level namespaces it contains.
# Multiple namespaces in one file = bounded context.
DOMAINS: dict[str, list[str]] = {
    "metadata":         ["metadata"],
    "nav":              ["nav"],
    "chef-tools":       ["chefTools"],
    "home":             ["home"],
    "recipes":          ["recipesPage"],
    "blog":             ["blog"],
    "about":            ["about"],
    "contact":          ["contact"],
    "footer":           ["footer"],
    "legal":            ["cookieConsent", "privacy", "terms", "cookiesPage"],
    "recipe-analysis":  ["recipeAnalysis"],
    "auth":             ["auth"],
    "app":              ["app"],
    "billing":          ["pricing", "billing"],
}


def split_locale(locale: str) -> None:
    src = MESSAGES / f"{locale}.json"
    if not src.exists():
        print(f"⚠ {src} not found, skipping")
        return

    with src.open("r", encoding="utf-8") as f:
        data = json.load(f)

    out_dir = MESSAGES / locale
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    # Build reverse map for sanity check
    used: set[str] = set()
    for domain, namespaces in DOMAINS.items():
        bucket: dict = {}
        for ns in namespaces:
            if ns in data:
                bucket[ns] = data[ns]
                used.add(ns)
            else:
                print(f"  · [{locale}] domain={domain}: namespace '{ns}' MISSING")
        out_file = out_dir / f"{domain}.json"
        with out_file.open("w", encoding="utf-8") as f:
            json.dump(bucket, f, ensure_ascii=False, indent=2)
            f.write("\n")

    leftover = set(data.keys()) - used
    if leftover:
        print(f"  ⚠ [{locale}] uncategorized top-level keys: {sorted(leftover)}")
        # Dump them into a `misc.json` so nothing is lost
        misc = {k: data[k] for k in leftover}
        with (out_dir / "misc.json").open("w", encoding="utf-8") as f:
            json.dump(misc, f, ensure_ascii=False, indent=2)
            f.write("\n")

    print(f"✓ {locale} → {out_dir.relative_to(ROOT)} ({len(DOMAINS)} domains)")


def main() -> None:
    for locale in LOCALES:
        split_locale(locale)
    print("\nDone. Old monolithic files NOT deleted yet — run with --delete after verification.")


if __name__ == "__main__":
    import sys
    main()
    if "--delete" in sys.argv:
        for locale in LOCALES:
            old = MESSAGES / f"{locale}.json"
            if old.exists():
                old.unlink()
                print(f"🗑  removed {old.relative_to(ROOT)}")
