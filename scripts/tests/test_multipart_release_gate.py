#!/usr/bin/env python3
"""Offline release-gate regression tests: missing or modified modules must block parity.

Runs with synthetic multipart files only. No network, credentials, or deployment.
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
spec = importlib.util.spec_from_file_location("verify_production_multipart_gate", SCRIPT)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

def make_multipart(parts, boundary="gate-synthetic"):
    body = b""
    for name, payload in parts:
        body += (b"--" + boundary.encode() + b"\r\n" +
                 ('Content-Disposition: form-data; name="%s"; filename="%s"\r\n' % (name, name)).encode() +
                 b"Content-Type: application/javascript\r\n\r\n" + payload + b"\r\n")
    return body + b"--" + boundary.encode() + b"--\r\n"

class ReleaseGateTests(unittest.TestCase):
    def check(self, live_parts, candidate_parts):
        with tempfile.TemporaryDirectory() as tmp:
            live = Path(tmp) / "live.bin"
            candidate = Path(tmp) / "candidate.bin"
            live.write_bytes(make_multipart(live_parts))
            candidate.write_bytes(make_multipart(candidate_parts))
            args = ["gate", "--live", str(live), "--candidate", str(candidate),
                    "--content-type", "multipart/form-data; boundary=gate-synthetic"]
            out = io.StringIO()
            with patch.object(sys, "argv", args), contextlib.redirect_stdout(out):
                code = gate.main()
            return code, json.loads(out.getvalue())

    def test_identical_complete_bundle_passes(self):
        parts = [(name, name.encode() + b"\x00\xff") for name in gate.EXPECTED]
        code, result = self.check(parts, parts)
        self.assertEqual(code, 0)
        self.assertTrue(result["ok"])

    def test_changed_single_module_blocks_release(self):
        live = [(name, name.encode()) for name in gate.EXPECTED]
        candidate = [(name, b"modified" if name == "legacy.mjs" else name.encode())
                     for name in gate.EXPECTED]
        code, result = self.check(live, candidate)
        self.assertEqual(code, 1)
        self.assertFalse(result["ok"])
        self.assertNotEqual(result["live"]["legacy.mjs"]["sha256"],
                            result["candidate"]["legacy.mjs"]["sha256"])

    def test_missing_module_blocks_release(self):
        live = [(name, name.encode()) for name in gate.EXPECTED]
        candidate = [(name, name.encode()) for name in gate.EXPECTED if name != "preview.mjs"]
        code, result = self.check(live, candidate)
        self.assertEqual(code, 1)
        self.assertFalse(result["ok"])

if __name__ == "__main__":
    unittest.main()
