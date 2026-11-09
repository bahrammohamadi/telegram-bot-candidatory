#!/usr/bin/env python3
"""Fail-closed budget gate for a single *isolated* Cloudflare D1 read response.

Input: Cloudflare D1 query JSON from stdin (never print the response).
Usage: python3 cloudflare-live/phase15/check_d1_read_budget.py < response.json
This does not execute queries or authenticate to Cloudflare.
"""
import json
import sys

MAX_ROWS_READ = 100

def check(payload):
    if not isinstance(payload, dict) or payload.get("success") is not True:
        return False
    results = payload.get("result")
    if not isinstance(results, list) or len(results) != 1:
        return False
    item = results[0]
    if not isinstance(item, dict) or item.get("success") is not True:
        return False
    meta = item.get("meta")
    if not isinstance(meta, dict):
        return False
    reads, writes = meta.get("rows_read"), meta.get("rows_written")
    return (type(reads) is int and 0 <= reads <= MAX_ROWS_READ
            and type(writes) is int and writes == 0
            and meta.get("changed_db") is False)

def main():
    try:
        payload = json.load(sys.stdin)
        passed = check(payload)
    except (ValueError, TypeError):
        passed = False
    print("PASS: bounded read-only D1 response" if passed else "FAIL: D1 read budget or read-only invariant")
    return 0 if passed else 1

if __name__ == "__main__":
    raise SystemExit(main())
