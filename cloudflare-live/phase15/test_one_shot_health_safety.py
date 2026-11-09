"""Regression tests for isolated health probe URL restrictions (no network)."""
import importlib.util
import pathlib
import unittest
from unittest.mock import patch

SOURCE = pathlib.Path(__file__).with_name("one_shot_integration_health.py")
spec = importlib.util.spec_from_file_location("health_probe", SOURCE)
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

class UrlSafetyTests(unittest.TestCase):
    def test_rejects_untrusted_hosts_without_network(self):
        bad = [
            "https://candidatory-miniapp-integration.evil.com/api/health",
            "https://evil-candidatory-miniapp-integration.workers.dev/api/health",
            "https://candidatory-miniapp-integration.workers.dev.evil.com/api/health",
            "http://candidatory-miniapp-integration.account.workers.dev/api/health",
            "https://candidatory-miniapp-integration.account.workers.dev:444/api/health",
            "https://user:pass@candidatory-miniapp-integration.account.workers.dev/api/health",
            "https://candidatory-miniapp-integration.account.workers.dev/api/health?x=1",
        ]
        with patch.object(probe.urllib.request, "build_opener", side_effect=AssertionError("network attempted")):
            for url in bad:
                with self.subTest(url=url), self.assertRaises(ValueError):
                    probe.check(url)

    def test_redirects_are_disabled(self):
        handler = probe.NoRedirect()
        self.assertIsNone(handler.redirect_request(None, None, 302, "Found", {}, "https://evil.com/"))

if __name__ == "__main__":
    unittest.main()
