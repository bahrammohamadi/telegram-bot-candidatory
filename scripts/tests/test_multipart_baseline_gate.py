#!/usr/bin/env python3
"""Offline regression: a valid baseline is not proof that a changed candidate is deployable.

Synthetic multipart only; no Production calls or credentials.
"""
import contextlib
import importlib.util
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "verify_production_multipart.py"
spec = importlib.util.spec_from_file_location("multipart_baseline_gate", SCRIPT)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

def payload(parts):
    boundary = b"synthetic-baseline"
    body = b""
    for name, data in parts:
        body += b"--" + boundary + b"\r\n"
        body += ('Content-Disposition: form-data; name="%s"; filename="%s"\r\n' % (name, name)).encode()
        body += b"Content-Type: application/javascript\r\n\r\n" + data + b"\r\n"
    return body + b"--" + boundary + b"--\r\n"

class BaselineGateTests(unittest.TestCase):
    def run_gate(self, parts, candidate=None):
        with tempfile.TemporaryDirectory() as directory:
            live = Path(directory) / "live.bin"
            live.write_bytes(payload(parts))
            args = ["gate", "--live", str(live), "--content-type", "multipart/form-data; boundary=synthetic-baseline"]
            if candidate is not None:
                other = Path(directory) / "candidate.bin"
                other.write_bytes(payload(candidate))
                args.extend(["--candidate", str(other)])
            output = io.StringIO()
            with patch.object(sys, "argv", args), contextlib.redirect_stdout(output):
                status = gate.main()
            return status, json.loads(output.getvalue())

    def test_baseline_inventory_only_requires_all_modules(self):
        parts = [(name, name.encode()) for name in gate.EXPECTED]
        status, result = self.run_gate(parts)
        self.assertEqual(status, 0)
        self.assertIsNone(result["candidate"])

    def test_extra_module_blocks_baseline(self):
        parts = [(name, name.encode()) for name in gate.EXPECTED]
        status, result = self.run_gate(parts + [("unexpected.mjs", b"extra")])
        self.assertEqual(status, 1)
        self.assertFalse(result["ok"])

    def test_changed_candidate_fails_exact_parity_even_if_valid(self):
        parts = [(name, name.encode()) for name in gate.EXPECTED]
        changed = [(name, b"new" if name == "entrypoint.mjs" else name.encode()) for name in gate.EXPECTED]
        status, result = self.run_gate(parts, changed)
        self.assertEqual(status, 1)
        self.assertFalse(result["ok"])

if __name__ == "__main__":
    unittest.main()
