"""Synthetic, offline tests; never contact Cloudflare or Telegram."""
import copy
import importlib.util
from pathlib import Path
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/operations/check_candidatory_release_manifest.py"
spec = importlib.util.spec_from_file_location("release_gate", SCRIPT)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def candidate():
    return {
        "worker": "candidatory-miniapp-api",
        "deploy_target": "candidatory-miniapp-api",
        "bindings": [{"name": name, "type": kind} for name, kind in gate.EXPECTED.items()],
        "modules": ["index.js", "tasks.js"],
        "main_module": "index.js",
        "compatibility_date": "2026-10-27",
        "ci_sha": "a" * 40,
        "ci_success": True,
        "rollback_version": "synthetic-only",
        "production_parity_verified": True,
        "handler_auth_verified": True,
        "d1_schema_verified": True,
        "routes_verified": True,
        "homepage_readonly_verified": True,
    }


class ReleaseGateTests(unittest.TestCase):
    def test_synthetic_structure_passes_not_deployment_authorization(self):
        self.assertEqual(gate.validate(candidate()), [])

    def test_missing_required_field_fails_closed(self):
        m = candidate()
        del m["rollback_version"]
        self.assertTrue(gate.validate(m))

    def test_second_worker_rejected(self):
        m = candidate()
        m["worker"] = "candidatory-miniapp-api-staging"
        self.assertTrue(gate.validate(m))

    def test_second_deploy_target_rejected(self):
        m = candidate()
        m["deploy_target"] = "preview"
        self.assertTrue(gate.validate(m))

    def test_missing_binding_rejected(self):
        m = candidate()
        m["bindings"].pop()
        self.assertTrue(gate.validate(m))

    def test_secret_value_rejected(self):
        m = candidate()
        m["bindings"][0]["value"] = "synthetic-secret"
        self.assertTrue(gate.validate(m))

    def test_duplicate_binding_rejected(self):
        m = candidate()
        m["bindings"].append(copy.deepcopy(m["bindings"][0]))
        self.assertTrue(gate.validate(m))

    def test_incomplete_module_inventory_rejected(self):
        m = candidate()
        m["main_module"] = "missing.js"
        self.assertTrue(gate.validate(m))

    def test_ci_sha_invalid_rejected(self):
        m = candidate()
        m["ci_sha"] = "not-a-sha"
        self.assertTrue(gate.validate(m))

    def test_false_gate_rejected(self):
        for field in ("ci_success", "production_parity_verified", "handler_auth_verified",
                      "d1_schema_verified", "routes_verified", "homepage_readonly_verified"):
            with self.subTest(field=field):
                m = candidate()
                m[field] = False
                self.assertTrue(gate.validate(m))

    def test_missing_deploy_target_rejected(self):
        m = candidate()
        del m["deploy_target"]
        self.assertTrue(gate.validate(m))

    def test_null_deploy_target_rejected(self):
        m = candidate()
        m["deploy_target"] = None
        self.assertTrue(gate.validate(m))

    def test_malformed_binding_entries_fail_closed_without_exception(self):
        for bad in ({"name": [], "type": "d1"},
                    {"name": "DB", "type": []},
                    {"name": None, "type": "d1"},
                    {"name": {"nested": "DB"}, "type": "d1"}):
            with self.subTest(bad=str(bad)):
                m = candidate()
                m["bindings"][0] = bad
                self.assertTrue(gate.validate(m))

    def test_unsafe_module_paths_rejected(self):
        for path in ("../secrets.js", "/absolute.js", "lib/../index.js",
                     "https://example.org/evil.js", "lib\\\\evil.js",
                     "lib//index.js", "index.txt"):
            with self.subTest(path=path):
                m = candidate()
                m["modules"] = ["index.js", path]
                self.assertTrue(gate.validate(m))

    def test_nested_local_js_module_allowed(self):
        m = candidate()
        m["modules"] = ["index.js", "src/tasks/handler.mjs"]
        self.assertEqual(gate.validate(m), [])

    def test_duplicate_module_paths_rejected(self):
        m = candidate()
        m["modules"] = ["index.js", "tasks.js", "tasks.js"]
        self.assertTrue(gate.validate(m))

    def test_compatibility_date_drift_rejected(self):
        m = candidate()
        m["compatibility_date"] = "2026-11-23"
        self.assertTrue(gate.validate(m))

    def test_non_boolean_security_attestations_rejected(self):
        for field in ("ci_success", "production_parity_verified", "handler_auth_verified",
                      "d1_schema_verified", "routes_verified", "homepage_readonly_verified"):
            for invalid in (1, "true", None, [], {}):
                with self.subTest(field=field, invalid=repr(invalid)):
                    m = candidate()
                    m[field] = invalid
                    self.assertTrue(gate.validate(m))

    def test_main_module_not_in_bundle_rejected(self):
        m = candidate()
        m["main_module"] = "src/other.js"
        self.assertTrue(gate.validate(m))

    def test_unexpected_top_level_fields_rejected(self):
        for field in ("TELEGRAM_BOT_TOKEN", "api_key", "secrets", "deployment_environment"):
            with self.subTest(field=field):
                m = candidate()
                m[field] = "synthetic-placeholder"
                self.assertTrue(gate.validate(m))

    def test_blank_rollback_version_rejected(self):
        for value in ("", " ", "\\t", "\\n", "  \\t  "):
            with self.subTest(value=repr(value)):
                m = candidate()
                m["rollback_version"] = value
                self.assertTrue(gate.validate(m))

    def test_non_object_rejected(self):
        self.assertTrue(gate.validate([]))
        self.assertTrue(gate.validate(None))


if __name__ == "__main__":
    unittest.main()
