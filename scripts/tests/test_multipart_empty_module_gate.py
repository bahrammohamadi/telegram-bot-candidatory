#!/usr/bin/env python3
"""Regression checks for the production multipart inventory gate.

Synthetic bytes only; no Worker, D1, credentials, network or deployment.
Run: python3 -m unittest discover -s scripts/tests -p 'test_multipart_empty_module_gate.py'
"""
import importlib.util
import tempfile
import unittest
from pathlib import Path

script = Path(__file__).resolve().parents[1] / "verify_production_multipart.py"
spec = importlib.util.spec_from_file_location("verify_production_multipart", script)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def body(parts):
    boundary = b"offline-boundary"
    result = b""
    for name, payload in parts:
        result += (b"--" + boundary + b"\r\n"
                   + b'Content-Disposition: form-data; name="' + name.encode()
                   + b'"; filename="' + name.encode() + b'"\r\n'
                   + b"Content-Type: application/javascript\r\n\r\n"
                   + payload + b"\r\n")
    return result + b"--" + boundary + b"--\r\n"


class EmptyModuleGateTests(unittest.TestCase):
    def inspect(self, parts):
        with tempfile.TemporaryDirectory() as directory:
            capture = Path(directory) / "synthetic.multipart"
            capture.write_bytes(body(parts))
            return gate.inventory(str(capture), "multipart/form-data; boundary=offline-boundary")

    def test_all_three_nonempty_modules_accepted(self):
        found = self.inspect([(name, b"export default {};") for name in gate.EXPECTED])
        self.assertEqual(set(found), set(gate.EXPECTED))
        self.assertTrue(all(info["bytes"] > 0 for info in found.values()))

    def test_each_empty_required_module_rejected(self):
        for empty in gate.EXPECTED:
            with self.subTest(empty=empty):
                parts = [(name, b"" if name == empty else b"export default {};")
                         for name in gate.EXPECTED]
                with self.assertRaisesRegex(ValueError, "Empty multipart module"):
                    self.inspect(parts)

    def test_empty_unexpected_part_rejected(self):
        parts = [(name, b"export default {};") for name in gate.EXPECTED]
        parts.append(("extra.mjs", b""))
        with self.assertRaisesRegex(ValueError, "Empty multipart module"):
            self.inspect(parts)


if __name__ == "__main__":
    unittest.main()
