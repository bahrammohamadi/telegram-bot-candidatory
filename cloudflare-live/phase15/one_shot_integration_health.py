#!/usr/bin/env python3
"""One-shot, quota-safe integration health gate. Never targets production by default."""
import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

EXPECTED_HOST = "candidatory-miniapp-integration"

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None
def check(url, timeout=8):
    parsed = urllib.parse.urlsplit(url)
    hostname = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or not (hostname.startswith(EXPECTED_HOST + ".") and hostname.endswith(".workers.dev")):
        raise ValueError("Refusing non-integration host or non-HTTPS URL")
    if parsed.path != "/api/health" or parsed.query or parsed.fragment or parsed.username or parsed.password or parsed.port not in (None, 443):
        raise ValueError("Only the exact integration /api/health path is allowed")
    request = urllib.request.Request(url, headers={"Accept": "application/json", "Cache-Control": "no-store"}, method="GET")
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=timeout) as response:
            status = response.status
            body = response.read(2048).decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        status = exc.code
        body = exc.read(2048).decode("utf-8", "replace")
    except urllib.error.URLError:
        return {"ok": False, "status": None, "reason": "NETWORK_ERROR"}
    # Never print response bodies, tokens, or user data.
    if status != 200:
        reason = "DB_UNAVAILABLE" if "DB_UNAVAILABLE" in body else ("D1_QUOTA_POSSIBLE" if "7500" in body else "HTTP_ERROR")
        return {"ok": False, "status": status, "reason": reason}
    try:
        data = json.loads(body)
    except ValueError:
        return {"ok": False, "status": status, "reason": "INVALID_JSON"}
    if not isinstance(data, dict) or data.get("status") not in ("ok", "healthy", "ready"):
        return {"ok": False, "status": status, "reason": "UNEXPECTED_HEALTH_BODY"}
    return {"ok": True, "status": status, "reason": "READY"}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url", help="Explicit isolated Worker URL ending in /api/health")
    args = parser.parse_args()
    try:
        result = check(args.url)
    except ValueError as exc:
        print(json.dumps({"ok": False, "reason": str(exc)}))
        return 2
    print(json.dumps(result))
    return 0 if result["ok"] else 1

if __name__ == "__main__":
    sys.exit(main())
