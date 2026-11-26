"""CLI regression checks for the phase-15 D1 read-only gate.

Run: python3 -m unittest discover -s tests -p 'test_d1_budget_cli.py'
Offline only: no Cloudflare credentials, production data, or D1 queries.
"""
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "cloudflare-live" / "phase15" / "check_d1_read_budget.py"


class D1BudgetCliTests(unittest.TestCase):
    def run_gate(self, data):
        return subprocess.run(
            [sys.executable, str(SCRIPT)],
            input=data, text=True, capture_output=True, timeout=5, check=False,
        )

    def test_valid_read_only_response_exits_zero(self):
        payload = {"success": True, "result": [{"success": True, "meta": {
            "rows_read": 18, "rows_written": 0, "changed_db": False,
        }}]}
        result = self.run_gate(json.dumps(payload))
        self.assertEqual(result.returncode, 0)
        self.assertIn("PASS:", result.stdout)

    def test_malformed_json_fails_closed_without_echoing_input(self):
        marker = "PRIVATE_TEST_MARKER_DO_NOT_PRINT"
        result = self.run_gate('{"secret":"' + marker)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("FAIL:", result.stdout)
        self.assertNotIn(marker, result.stdout + result.stderr)

    def test_quota_error_fails_without_echoing_response(self):
        marker = "PRIVATE_TEST_MARKER_DO_NOT_PRINT"
        payload = {"success": False, "errors": [{"code": 7500, "message": marker}]}
        result = self.run_gate(json.dumps(payload))
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn(marker, result.stdout + result.stderr)

    def test_empty_input_fails_closed(self):
        result = self.run_gate("")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("FAIL:", result.stdout)


if __name__ == "__main__":
    unittest.main()
