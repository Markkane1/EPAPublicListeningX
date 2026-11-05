import urllib.request
import urllib.error
import json
import time
import threading
import pytest
import serve

def send_login_request(base_url, client_ip, username="test_user", password="WrongPassword123!"):
    headers = {
        "Content-Type": "application/json",
        "X-Forwarded-For": client_ip
    }
    body = json.dumps({"username": username, "password": password}).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/auth/login", data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            err_json = json.loads(content)
        except Exception:
            err_json = {"raw": content}
        return e.code, err_json

class TestRateLimiterStress:
    def test_unit_sliding_window_rate_limiter(self):
        """Test rate limiter unit logic in serve.py under synthetic clock ticks."""
        test_ip = "192.0.2.101"
        # Clear bucket for test_ip if any
        with serve._rate_lock:
            serve._rate_buckets.pop(test_ip, None)

        # Max allowed requests is serve.RATE_MAX_REQUESTS (default 30)
        for i in range(serve.RATE_MAX_REQUESTS):
            is_limited = serve._is_rate_limited(test_ip)
            assert not is_limited, f"Request {i+1} should not be rate limited"

        # The (RATE_MAX_REQUESTS + 1)th request should be rate limited
        assert serve._is_rate_limited(test_ip) is True
        assert serve._is_rate_limited(test_ip) is True

        # Another IP should not be affected (IP isolation)
        isolated_ip = "192.0.2.102"
        assert serve._is_rate_limited(isolated_ip) is False

    def test_unit_concurrent_threads_hitting_rate_limiter(self):
        """Test that rate limiter lock safely counts requests across concurrent threads."""
        test_ip = "192.0.2.200"
        with serve._rate_lock:
            serve._rate_buckets.pop(test_ip, None)

        results = []
        def worker():
            for _ in range(5):
                limited = serve._is_rate_limited(test_ip)
                results.append(limited)

        threads = [threading.Thread(target=worker) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Total 50 requests were attempted for this IP
        assert len(results) == 50
        # Exactly RATE_MAX_REQUESTS should have been False (allowed)
        allowed_count = sum(1 for r in results if r is False)
        blocked_count = sum(1 for r in results if r is True)
        assert allowed_count == serve.RATE_MAX_REQUESTS
        assert blocked_count == 50 - serve.RATE_MAX_REQUESTS

    def test_e2e_http_login_rate_limiting_triggers_429(self, ephemeral_server, monkeypatch):
        """Send rapid HTTP requests through ephemeral_server to verify HTTP 429 response."""
        base_url, _ = ephemeral_server
        monkeypatch.setenv("TRUSTED_PROXIES", "127.0.0.1")
        stress_ip = "198.51.100.88"
        with serve._rate_lock:
            serve._rate_buckets.pop(stress_ip, None)

        statuses = []
        for i in range(35):
            status, resp = send_login_request(base_url, stress_ip)
            statuses.append((status, resp))

        # First 30 requests should have bypassed rate limit (returning 401 unauthorized or 200)
        for i in range(30):
            status, resp = statuses[i]
            assert status != 429, f"Request {i+1} was unexpectedly rate limited: {resp}"

        # 31st through 35th requests should strictly return HTTP 429 RATE_LIMITED
        for i in range(30, 35):
            status, resp = statuses[i]
            assert status == 429, f"Request {i+1} should have been 429, got {status}: {resp}"
            assert resp.get("code") == "RATE_LIMITED"
