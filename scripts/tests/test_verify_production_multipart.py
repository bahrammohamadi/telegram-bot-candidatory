#!/usr/bin/env python3
"""Offline regression tests for the Production multipart inventory parser.

No network, credentials, Cloudflare calls, D1 access, or deployments.
Run: python3 -m unittest discover -s scripts/tests -p 'test_verify_production_multipart.py'
"""
import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "verify_production_multipart.py"
spec = importlib.util.spec_from_file_location("verify_production_multipart", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def multipart(parts, boundary="safe-boundary"):
    chunks = []
    for name, payload in parts:
        chunks.append(
            b"--" + boundary.encode() + b"\r\n"
            + f'Content-Disposition: form-data; name="{name}"; filename="{name}"\r\n'.encode()
            + b"Content-Type: application/javascript\r\n\r\n"
            + payload + b"\r\n"
        )
    return b"".join(chunks) + b"--" + boundary.encode() + b"--\r\n"


class MultipartInventoryTests(unittest.TestCase):
    def inspect(self, data, content_type="multipart/form-data; boundary=safe-boundary"):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "capture.bin"
            path.write_bytes(data)
            return module.inventory(str(path), content_type)

    def test_three_expected_parts_with_exact_binary_hashes(self):
        import hashlib
        parts = [(name, (name + "\n").encode() + b"\x00\xff") for name in module.EXPECTED]
        found = self.inspect(multipart(parts))
        self.assertEqual(set(found), set(module.EXPECTED))
        for name, payload in parts:
            self.assertEqual(found[name]["sha256"], hashlib.sha256(payload).hexdigest())
            self.assertEqual(found[name]["bytes"], len(payload))

    def test_duplicate_name_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "duplicate"):
            self.inspect(multipart([("entrypoint.mjs", b"a"), ("entrypoint.mjs", b"b")]))

    def test_path_traversal_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "unsafe"):
            self.inspect(multipart([("../entrypoint.mjs", b"a")]))

    def test_non_multipart_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "multipart"):
            self.inspect(b"plain text", "text/plain")

    def test_missing_boundary_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "boundary"):
            self.inspect(b"plain text", "multipart/form-data")


if __name__ == "__main__":
    unittest.main()
