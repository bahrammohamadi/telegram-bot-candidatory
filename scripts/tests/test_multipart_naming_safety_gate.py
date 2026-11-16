#!/usr/bin/env python3
"""Offline regression tests for multipart inventory naming safety.

Synthetic payloads only. No network, Worker deployment, D1, or credentials.
"""
import importlib.util
import tempfile
import unittest
from pathlib import Path

script = Path(__file__).resolve().parents[1] / "verify_production_multipart.py"
spec = importlib.util.spec_from_file_location("verify_production_multipart", script)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def multipart(parts):
    boundary = b"synthetic-boundary"
    chunks = []
    for filename, data in parts:
        chunks.append(
            b"--" + boundary + b"\r\n"
            + b'Content-Disposition: form-data; name="' + filename.encode()
            + b'"; filename="' + filename.encode() + b'"\r\n'
            + b"Content-Type: application/javascript\r\n\r\n"
            + data + b"\r\n"
        )
    return b"".join(chunks) + b"--" + boundary + b"--\r\n"


class MultipartNamingSafetyTests(unittest.TestCase):
    def inspect(self, parts):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fixture.multipart"
            path.write_bytes(multipart(parts))
            return gate.inventory(str(path), "multipart/form-data; boundary=synthetic-boundary")

    def test_duplicate_module_is_rejected(self):
        parts = [(name, b"export default {};") for name in gate.EXPECTED]
        parts.append((gate.EXPECTED[0], b"export default { changed: true };"))
        with self.assertRaisesRegex(ValueError, "(?i)duplicate multipart part name"):
            self.inspect(parts)

    def test_path_like_module_names_are_rejected(self):
        for unsafe in ("../entrypoint.mjs", "nested/legacy.mjs", "nested\\preview.mjs"):
            with self.subTest(unsafe=unsafe):
                parts = [(name, b"export default {};") for name in gate.EXPECTED]
                parts.append((unsafe, b"export default {};"))
                with self.assertRaisesRegex(ValueError, "(?i)unsafe or duplicate multipart part name"):
                    self.inspect(parts)

    def test_valid_fixture_hashes_are_deterministic(self):
        parts = [(name, ("module:" + name).encode()) for name in gate.EXPECTED]
        first = self.inspect(parts)
        second = self.inspect(parts)
        self.assertEqual(first, second)
        self.assertEqual(set(first), set(gate.EXPECTED))


if __name__ == "__main__":
    unittest.main()
