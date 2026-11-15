#!/usr/bin/env python3
"""Offline Cloudflare multipart module inventory and parity gate.

Usage:
  python3 scripts/verify_production_multipart.py --live saved-live-response.bin --candidate saved-candidate-response.bin
  python3 scripts/verify_production_multipart.py --live saved-live-response.bin

Input must be a *complete* multipart response including Content-Type header (or
pass --content-type for body-only captures). Never fetch Production or deploy.
Exit 0 only if all expected parts exist and (when supplied) per-part hashes match.
"""
import argparse
import hashlib
import json
import sys
from email import policy
from email.parser import BytesParser

EXPECTED = ("entrypoint.mjs", "legacy.mjs", "preview.mjs")

def inventory(path, content_type):
    with open(path, "rb") as fh:
        raw = fh.read()
    if content_type:
        raw = ("Content-Type: " + content_type + "\r\nMIME-Version: 1.0\r\n\r\n").encode() + raw
    msg = BytesParser(policy=policy.default).parsebytes(raw)
    if msg.get_content_type() != "multipart/form-data" and not msg.get_content_type().startswith("multipart/"):
        raise ValueError("Expected a multipart response; supply --content-type if headers are absent")
    if not msg.is_multipart():
        raise ValueError("Multipart boundary missing or invalid")
    result = {}
    for part in msg.iter_parts():
        name = part.get_param("name", header="content-disposition")
        filename = part.get_filename()
        key = filename or name
        if not key or "/" in key or "\\" in key or key in result:
            raise ValueError("Missing, unsafe or duplicate multipart part name")
        data = part.get_payload(decode=True)
        if data is None:
            raise ValueError("Unparseable multipart payload")
        if not data:\n            raise ValueError("Empty multipart module is not deployable")\n        result[key] = {"sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}
    return result

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--live", required=True)
    p.add_argument("--candidate")
    p.add_argument("--content-type", help="MIME Content-Type including boundary for body-only files")
    args = p.parse_args()
    try:
        live = inventory(args.live, args.content_type)
        candidate = inventory(args.candidate, args.content_type) if args.candidate else None
        expected = set(EXPECTED)
        ok = set(live) == expected and (candidate is None or (set(candidate) == expected and all(live[k]["sha256"] == candidate[k]["sha256"] for k in EXPECTED)))
        print(json.dumps({"ok": ok, "expected_parts": list(EXPECTED), "live": live, "candidate": candidate}, indent=2, sort_keys=True))
        return 0 if ok else 1
    except (OSError, ValueError) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stderr)
        return 2

if __name__ == "__main__":
    sys.exit(main())
