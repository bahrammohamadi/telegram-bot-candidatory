"""Offline tests: python3 -m unittest discover -s tests -p 'test_d1_read_budget.py'"""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("budget", ROOT / "cloudflare-live/phase15/check_d1_read_budget.py")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)

class D1ReadBudgetTests(unittest.TestCase):
    def payload(self, **changes):
        meta = {"rows_read": 18, "rows_written": 0, "changed_db": False}
        meta.update(changes)
        return {"success": True, "result": [{"success": True, "meta": meta}]}

    def test_bounded_read_passes(self):
        self.assertTrue(module.check(self.payload()))

    def test_quota_exceeded_fails(self):
        self.assertFalse(module.check(self.payload(rows_read=101)))

    def test_any_write_fails(self):
        self.assertFalse(module.check(self.payload(rows_written=1)))
        self.assertFalse(module.check(self.payload(changed_db=True)))

    def test_missing_or_invalid_metadata_fails(self):
        for value in (None, True, "18", -1):
            self.assertFalse(module.check(self.payload(rows_read=value)))
        self.assertFalse(module.check({"success": False, "result": []}))
        self.assertFalse(module.check({"success": True, "result": []}))

    def test_success_flags_cannot_hide_api_errors(self):
        payload = self.payload()
        payload["errors"] = [{"code": 7500, "message": "quota"}]
        self.assertFalse(module.check(payload))
        payload["errors"] = []
        self.assertTrue(module.check(payload))
        payload["result"][0]["errors"] = [{"code": 1}]
        self.assertFalse(module.check(payload))

    def test_multiple_results_and_invalid_write_metadata_fail(self):
        payload = self.payload()
        payload["result"].append(payload["result"][0].copy())
        self.assertFalse(module.check(payload))
        for value in (True, None, "0", -1):
            self.assertFalse(module.check(self.payload(rows_written=value)))

    def test_boundary_and_fail_closed_metadata(self):
        self.assertTrue(module.check(self.payload(rows_read=100)))
        self.assertFalse(module.check(self.payload(rows_read=101)))
        for invalid in (True, None, "false", 0, 1):
            self.assertFalse(module.check(self.payload(changed_db=invalid)))
        for invalid in (1.0, 0.0, [], {}, "0", -1):
            self.assertFalse(module.check(self.payload(rows_written=invalid)))
        for invalid in (100.0, "100", [], {}):
            self.assertFalse(module.check(self.payload(rows_read=invalid)))

    def test_malformed_envelopes_fail_closed(self):
        for invalid in (None, [], "ok", {"success": True, "result": {}}):
            self.assertFalse(module.check(invalid))
        payload = self.payload()
        payload["result"][0]["meta"] = None
        self.assertFalse(module.check(payload))
        payload = self.payload()
        payload["result"][0]["success"] = 1
        self.assertFalse(module.check(payload))

if __name__ == "__main__":
    unittest.main()
