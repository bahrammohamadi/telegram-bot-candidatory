#!/usr/bin/env python3
"""Offline negative contract tests for the production multipart release gate.

No network, credentials, D1, deployment, or live user data.
"""
import importlib.util
import tempfile
import unittest
from pathlib import Path

script = Path(__file__).resolve().parents[1] / "verify_production_multipart.py"
spec = importlib.util.spec_from_file_location("verify_production_multipart", script)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def payload(parts):
    boundary = b"fixture-boundary"
    chunks = []
    for name, body in parts:
        chunks.append(
            b"--" + boundary + b"\r\n"
            + b'Content-Disposition: form-data; name="' + name.encode() + b'"\r\n'
            + b"Content-Type: application/javascript\r\n\r\n"
            + body + b"\r\n"
        )
    return b"".join(chunks) + b"--" + boundary + b"--\r\n"


class MultipartNegativeContractTests(unittest.TestCase):
    def inspect(self, parts, content_type="multipart/form-data; boundary=fixture-boundary"):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fixture.bin"
            path.write_bytes(payload(parts))
            return gate.inventory(str(path), content_type)

    def test_missing_required_module_fails_parity(self):
        parts = [(name, b"export default {};") for name in gate.EXPECTED[:-1]]
        inventory = self.inspect(parts)
        self.assertNotEqual(set(inventory), set(gate.EXPECTED))

    def test_changed_module_hash_fails_parity(self):
        original = [(name, b"export default {};") for name in gate.EXPECTED]
        modified = [(name, b"export default { changed: true };") if name == gate.EXPECTED[0]
                    else (name, b"export default {};") for name in gate.EXPECTED]
        baseline = self.inspect(original)
        candidate = self.inspect(modified)
        self.assertNotEqual(baseline[gate.EXPECTED[0]]["sha256"],
                            candidate[gate.EXPECTED[0]]["sha256"])

    def test_missing_boundary_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "boundary"):
            self.inspect([(name, b"export default {};") for name in gate.EXPECTED],
                         "multipart/form-data")

    def test_empty_module_is_rejected(self):
        parts = [(name, b"" if name == gate.EXPECTED[0] else b"export default {};")
                 for name in gate.EXPECTED]
        with self.assertRaisesRegex(ValueError, "Empty multipart module"):
            self.inspect(parts)


if __name__ == "__main__":
    unittest.main()
