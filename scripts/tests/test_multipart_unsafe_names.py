"""Offline regression tests for unsafe multipart names; no Production calls."""
import importlib.util
import tempfile
import unittest
from email.message import EmailMessage
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("gate", ROOT / "scripts/verify_production_multipart.py")
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class UnsafePartNames(unittest.TestCase):
    def test_reject_dot_names_and_controls(self):
        for name in (".", "..", "bad\x7fname", "bad\tname"):
            with self.subTest(name=repr(name)):
                msg = EmailMessage()
                msg.set_type("multipart/form-data")
                part = EmailMessage()
                part.set_content("nonempty")
                part.add_header("Content-Disposition", "form-data", name=name)
                msg.attach(part)
                with tempfile.TemporaryDirectory() as d:
                    p = Path(d) / "response.bin"
                    p.write_bytes(msg.as_bytes())
                    with self.assertRaises(ValueError):
                        gate.inventory(str(p), None)


if __name__ == "__main__":
    unittest.main()
