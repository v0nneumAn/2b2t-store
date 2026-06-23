#!/usr/bin/env python3
"""
Append a log entry to the shulker-logs Obsidian vault on CouchDB.

Usage:
    python3 tools/log_to_obsidian.py "Title of action" <<'EOF'
    Detailed markdown content here.
    EOF

The script writes to a daily note under 2b2t-store/session-logs/YYYY-MM-DD.md.
"""

import hashlib
import json
import os
import sys
import time
import urllib.parse

import requests

COUCH_URL = os.environ.get("OBSIDIAN_COUCH_URL", "http://logsrv.homelab.lan:5984")
DATABASE = os.environ.get("OBSIDIAN_DATABASE", "shulker-logs")
USER = os.environ.get("OBSIDIAN_COUCH_USER", "admin")
PASSWORD = os.environ.get("OBSIDIAN_COUCH_PASS", "")
if not PASSWORD:
    raise SystemExit("Set OBSIDIAN_COUCH_PASS environment variable to the CouchDB admin password.")


def couch_put(doc_id: str, doc: dict) -> dict:
    base = f"{COUCH_URL}/{DATABASE}"
    encoded_id = urllib.parse.quote(doc_id, safe="")
    resp = requests.put(f"{base}/{encoded_id}", auth=(USER, PASSWORD), json=doc)
    resp.raise_for_status()
    return resp.json()


def couch_get(doc_id: str) -> dict | None:
    base = f"{COUCH_URL}/{DATABASE}"
    encoded_id = urllib.parse.quote(doc_id, safe="")
    resp = requests.get(f"{base}/{encoded_id}", auth=(USER, PASSWORD))
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()


def write_file(path: str, content: str) -> None:
    content_bytes = content.encode("utf-8")
    size = len(content_bytes)
    now_ms = int(time.time() * 1000)
    leaf_id = "h:" + hashlib.sha256(content_bytes).hexdigest()

    # Write leaf chunk
    couch_put(leaf_id, {"_id": leaf_id, "type": "leaf", "data": content})

    # Write metadata to match Self-hosted LiveSync unencrypted format
    existing = couch_get(path)
    doc = {
        "_id": path,
        "path": path,
        "type": "plain",
        "children": [leaf_id],
        "mtime": now_ms,
        "size": size,
        "eden": {},
    }
    if existing:
        doc["_rev"] = existing["_rev"]
        doc["ctime"] = existing.get("ctime", now_ms)
    else:
        doc["ctime"] = now_ms

    couch_put(path, doc)


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: log_to_obsidian.py 'Title of action' [content from stdin]", file=sys.stderr)
        return 1

    title = sys.argv[1]
    body = sys.stdin.read().strip()
    if not body:
        body = "_(No details provided.)_"

    date_str = time.strftime("%Y-%m-%d")
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S %Z")
    path = f"2b2t-store/session-logs/{date_str}.md"

    section = f"\n\n## {timestamp} — {title}\n\n{body}\n"

    existing = couch_get(path)
    if existing:
        # Fetch current content from leaf chunk
        leaf_id = existing["children"][0]
        leaf = couch_get(leaf_id)
        current_content = leaf.get("data", "")
        new_content = current_content + section
    else:
        new_content = f"# 2b2t Store Session Log — {date_str}\n" + section

    write_file(path, new_content)
    print(f"Logged to {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
