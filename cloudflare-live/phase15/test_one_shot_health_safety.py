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


class ResponseSafetyTests(unittest.TestCase):
    URL = "https://candidatory-miniapp-integration.account.workers.dev/api/health"

    def _mock_response(self, status, body):
        from io import BytesIO
        class FakeResponse:
            def __init__(self):
                self.status = status
            def read(self, limit=-1):
                return BytesIO(body).read(limit)
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False
        return FakeResponse()

    def test_ready_only_for_valid_health_json(self):
        with patch.object(probe.urllib.request, "build_opener") as opener:
            opener.return_value.open.return_value = self._mock_response(200, b'{"status":"ready"}')
            self.assertEqual(probe.check(self.URL), {"ok": True, "status": 200, "reason": "READY"})
            self.assertEqual(opener.return_value.open.call_count, 1)

    def test_rejects_invalid_json_and_unexpected_health_body(self):
        for body, reason in [(b'not-json', "INVALID_JSON"), (b'{"status":"failed"}', "UNEXPECTED_HEALTH_BODY"), (b'[]', "UNEXPECTED_HEALTH_BODY")]:
            with self.subTest(reason=reason), patch.object(probe.urllib.request, "build_opener") as opener:
                opener.return_value.open.return_value = self._mock_response(200, body)
                result = probe.check(self.URL)
                self.assertFalse(result["ok"])
                self.assertEqual(result["reason"], reason)

    def test_503_db_error_is_not_reported_as_ready(self):
        from io import BytesIO
        error = probe.urllib.error.HTTPError(self.URL, 503, "Unavailable", {}, BytesIO(b'{"error":"DB_UNAVAILABLE","token":"synthetic-secret"}'))
        with patch.object(probe.urllib.request, "build_opener") as opener:
            opener.return_value.open.side_effect = error
            result = probe.check(self.URL)
        self.assertEqual(result, {"ok": False, "status": 503, "reason": "DB_UNAVAILABLE"})
        self.assertNotIn("synthetic-secret", str(result))

    def test_quota_error_and_network_failure_fail_closed(self):
        from io import BytesIO
        quota = probe.urllib.error.HTTPError(self.URL, 400, "Bad Request", {}, BytesIO(b'Cloudflare error 7500'))
        with patch.object(probe.urllib.request, "build_opener") as opener:
            opener.return_value.open.side_effect = quota
            self.assertEqual(probe.check(self.URL)["reason"], "D1_QUOTA_POSSIBLE")
        with patch.object(probe.urllib.request, "build_opener") as opener:
            opener.return_value.open.side_effect = probe.urllib.error.URLError("offline")
            self.assertEqual(probe.check(self.URL), {"ok": False, "status": None, "reason": "NETWORK_ERROR"})

if __name__ == "__main__":
    unittest.main()
