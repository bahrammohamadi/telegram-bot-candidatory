#!/usr/bin/env python3
"""Offline regression for fail-closed multipart inventory on malformed captures.

No network, credentials, deployment, or production data.
"""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

GATE = Path(__file__).resolve().parents[1] / "verify_production_multipart.py"
CTYPE = "multipart/form-data; boundary=offline-boundary"

def run_capture(body):
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "capture.bin"
        p.write_bytes(body)
        return subprocess.run(
            [sys.executable, str(GATE), "--live", str(p), "--content-type", CTYPE],
            capture_output=True, text=True, timeout=10,
        )

def part(name, body):
    return (b"--offline-boundary\r\nContent-Disposition: form-data; name=\"" +
            name.encode() + b"\"; filename=\"" + name.encode() +
            b"\"\r\nContent-Type: application/javascript\r\n\r\n" + body + b"\r\n")

class MultipartMalformedCaptureRegression(unittest.TestCase):
    def test_truncated_boundary_must_not_pass(self):
        body = b"".join(part(n, b"export default {};") for n in ("entrypoint.mjs", "legacy.mjs", "preview.mjs"))
        self.assertNotEqual(run_capture(body).returncode, 0)

    def test_duplicate_part_must_not_pass(self):
        body = (part("entrypoint.mjs", b"a") + part("legacy.mjs", b"b") +
                part("preview.mjs", b"c") + part("preview.mjs", b"d") +
                b"--offline-boundary--\r\n")
        self.assertNotEqual(run_capture(body).returncode, 0)

    def test_missing_part_must_not_pass(self):
        body = part("entrypoint.mjs", b"a") + part("legacy.mjs", b"b") + b"--offline-boundary--\r\n"
        self.assertNotEqual(run_capture(body).returncode, 0)

if __name__ == "__main__":
    unittest.main()
