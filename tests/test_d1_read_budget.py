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

if __name__ == "__main__":
    unittest.main()
