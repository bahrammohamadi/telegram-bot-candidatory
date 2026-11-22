#!/usr/bin/env python3
"""Offline, fail-closed manifest gate for the EXISTING candidatory-miniapp-api.

Usage: python scripts/operations/check_candidatory_release_manifest.py candidate.json
No network, credentials, Cloudflare writes or deployment. Input is a locally
assembled candidate manifest, NOT a live Production introspection substitute.
"""
import json
import sys

TARGET = "candidatory-miniapp-api"
EXPECTED = {
    "ADMIN_TELEGRAM_IDS": "secret_text",
    "ADMIN_TELEGRAM_IDS_MAHDI": "secret_text",
    "AI": "ai",
    "AVALAI_API_KEY": "secret_text",
    "DB": "d1",
    "REVIEW_DB": "d1",
    "TELEGRAM_BOT_TOKEN": "secret_text",
}
REQUIRED = ("worker", "deploy_target", "bindings", "modules", "main_module", "compatibility_date",
            "ci_sha", "ci_success", "rollback_version", "production_parity_verified",
            "handler_auth_verified", "d1_schema_verified", "routes_verified",
            "homepage_readonly_verified")

def validate(m):
    errors = []
    if not isinstance(m, dict):
        return ["manifest must be a JSON object"]
    errors += [f"missing {k}" for k in REQUIRED if k not in m]
    if m.get("worker") != TARGET:
        errors.append("only existing candidatory-miniapp-api is allowed")
    b = m.get("bindings")
    if not isinstance(b, list) or any(not isinstance(x, dict) or not isinstance(x.get("name"), str) or not isinstance(x.get("type"), str) for x in b):
        errors.append("bindings must be an array of name/type objects")
    else:
        names = [x.get("name") for x in b]
        if len(names) != len(set(names)):
            errors.append("duplicate binding names")
        observed = {x.get("name"): x.get("type") for x in b}
        if observed != EXPECTED:
            errors.append("binding names/types differ from pinned historical baseline; recheck live settings")
        if any(set(x) - {"name", "type"} for x in b):
            errors.append("binding manifest must not contain IDs or secret values")
    modules = m.get("modules")
    if not isinstance(modules, list) or not modules or any(not isinstance(x, str) or not x for x in modules):
        errors.append("modules must be a nonempty array of paths")
    elif len(modules) != len(set(modules)):
        errors.append("duplicate modules")
    elif m.get("main_module") not in modules:
        errors.append("main_module missing from module bundle")
    if m.get("compatibility_date") != "2026-10-27":
        errors.append("compatibility date differs; manual parity review required")
    if not isinstance(m.get("ci_sha"), str) or len(m.get("ci_sha", "")) != 40 or any(c not in "0123456789abcdef" for c in m.get("ci_sha", "")):
        errors.append("CI must be pinned to a full lowercase SHA")
    if not isinstance(m.get("rollback_version"), str) or not m.get("rollback_version"):
        errors.append("validated rollback version required")
    for key in ("ci_success", "production_parity_verified", "handler_auth_verified",
                "d1_schema_verified", "routes_verified", "homepage_readonly_verified"):
        if m.get(key) is not True:
            errors.append(f"{key} must be explicitly true with external evidence")
    if m.get("deploy_target") != TARGET:
        errors.append("second environment prohibited")
    return errors

def main():
    if len(sys.argv) != 2:
        print("usage: check_candidatory_release_manifest.py candidate.json", file=sys.stderr)
        return 2
    try:
        with open(sys.argv[1], encoding="utf-8") as f:
            manifest = json.load(f)
    except (OSError, ValueError) as exc:
        print(f"BLOCK: unreadable manifest: {exc}", file=sys.stderr)
        return 2
    errors = validate(manifest)
    for error in errors:
        print(f"BLOCK: {error}", file=sys.stderr)
    if errors:
        return 1
    print("Offline manifest structure passed; this is NOT authorization to deploy.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
