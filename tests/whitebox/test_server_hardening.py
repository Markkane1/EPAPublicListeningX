import urllib.request
import urllib.error
import json
import pytest
from serve import MAX_REQUEST_BODY_BYTES

class TestServerHardening:
    def test_security_headers_emitted(self, ephemeral_server, auth_tokens):
        base_url, port = ephemeral_server
        admin_token = auth_tokens["admin"]
        req = urllib.request.Request(
            f"{base_url}/permissions",
            headers={"Authorization": f"Bearer {admin_token}"},
            method="GET"
        )

        with urllib.request.urlopen(req) as resp:
            headers = dict(resp.headers)
            assert headers.get("X-Content-Type-Options") == "nosniff"
            assert headers.get("X-Frame-Options") == "DENY"
            assert "mode=block" in headers.get("X-XSS-Protection", "")
            assert "strict-origin" in headers.get("Referrer-Policy", "")
            assert "default-src 'self'" in headers.get("Content-Security-Policy", "")

    def test_cors_preflight_options(self, ephemeral_server):
        base_url, port = ephemeral_server
        req = urllib.request.Request(
            f"{base_url}/posts",
            headers={"Origin": f"http://localhost:{port}"},
            method="OPTIONS"
        )
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            headers = dict(resp.headers)
            assert "Access-Control-Allow-Origin" in headers
            assert "GET, POST, OPTIONS, PUT, DELETE" in headers.get("Access-Control-Allow-Methods", "")

    def test_request_body_size_cap_413(self, ephemeral_server):
        import http.client
        base_url, port = ephemeral_server
        # Oversized body > MAX_REQUEST_BODY_BYTES (16MB)
        oversized_len = MAX_REQUEST_BODY_BYTES + 1024
        oversized_body = b'{"text":"' + b'A' * oversized_len + b'"}'

        req = urllib.request.Request(
            f"{base_url}/auth/login",
            data=oversized_body,
            headers={
                "Content-Type": "application/json",
                "Content-Length": str(len(oversized_body))
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req) as resp:
                assert False, f"Expected 413 or connection reset, got status {resp.status}"
        except urllib.error.HTTPError as exc:
            assert exc.code in (400, 413)
        except (ConnectionResetError, ConnectionAbortedError, http.client.RemoteDisconnected):
            # On Windows TCP stack, rejecting 16MB stream before EOF triggers RST
            pass

        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
        conn.putrequest("POST", "/api/auth/login")
        conn.putheader("Content-Type", "application/json")
        conn.putheader("Content-Length", str(MAX_REQUEST_BODY_BYTES + 1))
        conn.endheaders()
        resp = conn.getresponse()
        assert resp.status == 413
        resp.read()
        conn.close()

    def test_malformed_json_body_rejected_400(self, ephemeral_server):
        base_url, port = ephemeral_server
        bad_json = b"{'this is not valid json': True,}"

        req = urllib.request.Request(
            f"{base_url}/auth/login",
            data=bad_json,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with pytest.raises(urllib.error.HTTPError) as exc_info:
            urllib.request.urlopen(req)
        assert exc_info.value.code == 400

    def test_nonexistent_endpoint_404(self, ephemeral_server):
        base_url, port = ephemeral_server
        req = urllib.request.Request(f"{base_url}/nonexistent/endpoint", method="GET")

        with pytest.raises(urllib.error.HTTPError) as exc_info:
            urllib.request.urlopen(req)
        assert exc_info.value.code == 404
