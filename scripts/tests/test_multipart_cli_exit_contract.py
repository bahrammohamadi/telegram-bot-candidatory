#!/usr/bin/env python3
"""Offline CLI exit-code contract for production multipart parity gate.

All fixtures are synthetic; no Cloudflare calls, credentials, or deployment.
"""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "verify_production_multipart.py"
PARTS = ("entrypoint.mjs", "legacy.mjs", "preview.mjs")
CONTENT_TYPE = "multipart/form-data; boundary=fixture-boundary"


def fixture(parts):
    result = []
    for name, body in parts:
        result.append(
            b"--fixture-boundary\r\n"
            + b'Content-Disposition: form-data; name="' + name.encode() + b'"; filename="' + name.encode() + b'"\r\n'
            + b"Content-Type: application/javascript\r\n\r\n"
            + body + b"\r\n"
        )
    return b"".join(result) + b"--fixture-boundary--\r\n"


class MultipartCliContractTests(unittest.TestCase):
    def run_gate(self, live, candidate=None):
        with tempfile.TemporaryDirectory() as tmp:
            live_path = Path(tmp) / "live.bin"
            live_path.write_bytes(live)
            args = [sys.executable, str(SCRIPT), "--live", str(live_path), "--content-type", CONTENT_TYPE]
            if candidate is not None:
                candidate_path = Path(tmp) / "candidate.bin"
                candidate_path.write_bytes(candidate)
                args += ["--candidate", str(candidate_path)]
            return subprocess.run(args, capture_output=True, text=True, timeout=10)

    def test_identical_three_part_payloads_pass(self):
        payload = fixture([(n, ("module:" + n).encode()) for n in PARTS])
        self.assertEqual(self.run_gate(payload, payload).returncode, 0)

    def test_changed_module_fails_closed(self):
        base = [(n, ("module:" + n).encode()) for n in PARTS]
        altered = [(n, b"changed" if n == PARTS[1] else body) for n, body in base]
        self.assertEqual(self.run_gate(fixture(base), fixture(altered)).returncode, 1)

    def test_missing_module_fails_closed(self):
        self.assertEqual(self.run_gate(fixture([(n, b"content") for n in PARTS[:-1]])).returncode, 1)

    def test_malformed_multipart_is_error(self):
        self.assertEqual(self.run_gate(b"not a multipart body").returncode, 2)


if __name__ == "__main__":
    unittest.main()
