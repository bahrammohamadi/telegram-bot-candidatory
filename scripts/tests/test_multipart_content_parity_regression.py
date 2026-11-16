#!/usr/bin/env python3
"""Offline regression: module parity must be content-based, not order/size-based.

Uses synthetic multipart only. Never calls Cloudflare or Production.
"""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

GATE = Path(__file__).resolve().parents[1] / "verify_production_multipart.py"
PARTS = ("entrypoint.mjs", "legacy.mjs", "preview.mjs")
CTYPE = "multipart/form-data; boundary=offline-parity"


def payload(parts):
    chunks = []
    for name, body in parts:
        chunks.append(
            b"--offline-parity\r\n"
            + b'Content-Disposition: form-data; name="' + name.encode() + b'"; filename="' + name.encode() + b'"\r\n'
            + b"Content-Type: application/javascript\r\n\r\n"
            + body + b"\r\n"
        )
    return b"".join(chunks) + b"--offline-parity--\r\n"


def gate(live, candidate):
    with tempfile.TemporaryDirectory() as directory:
        a, b = Path(directory) / "live.bin", Path(directory) / "candidate.bin"
        a.write_bytes(live)
        b.write_bytes(candidate)
        return subprocess.run(
            [sys.executable, str(GATE), "--live", str(a), "--candidate", str(b), "--content-type", CTYPE],
            capture_output=True, text=True, timeout=10,
        )


class ContentParityRegression(unittest.TestCase):
    def test_reordered_parts_with_identical_content_pass(self):
        parts = [(name, ("export const id = '" + name + "';").encode()) for name in PARTS]
        result = gate(payload(parts), payload(list(reversed(parts))))
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)

    def test_equal_size_but_changed_bytes_fail(self):
        parts = [(name, b"abc123") for name in PARTS]
        modified = [(name, b"xyz789" if name == "legacy.mjs" else body) for name, body in parts]
        result = gate(payload(parts), payload(modified))
        self.assertEqual(result.returncode, 1, result.stderr + result.stdout)


if __name__ == "__main__":
    unittest.main()
