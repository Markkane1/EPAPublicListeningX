import gzip
import json
import urllib.request

from tests.e2e.test_e2e_rbac_matrix import http_get, http_post
from tests.conftest import TEST_TURNSTILE_TOKEN, TEST_ADMIN_PASSWORD


def _http_get_raw(url, token=None, extra_headers=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req) as resp:
        body = resp.read()
        return resp.status, dict(resp.headers), body


class TestPostsListHttp:
    def test_posts_returns_envelope(self, ephemeral_server, auth_tokens, seeded_db):
        base_url, _ = ephemeral_server
        status, body = http_get(f"{base_url}/posts?limit=2&offset=0", token=auth_tokens["admin"])
        assert status == 200
        assert isinstance(body, dict)
        assert set(body) >= {"items", "total", "limit", "offset"}
        assert isinstance(body["items"], list)
        assert body["limit"] == 2
        assert body["offset"] == 0
        assert body["total"] >= len(body["items"])
        assert len(body["items"]) <= 2

    def test_posts_total_exceeds_page(self, ephemeral_server, auth_tokens, seeded_db):
        base_url, _ = ephemeral_server
        status, body = http_get(f"{base_url}/posts?limit=1", token=auth_tokens["admin"])
        assert status == 200
        assert body["total"] >= 3
        assert len(body["items"]) == 1

    def test_stats_includes_archive_fields(self, ephemeral_server, auth_tokens, seeded_db):
        base_url, _ = ephemeral_server
        status, body = http_get(f"{base_url}/stats", token=auth_tokens["admin"])
        assert status == 200
        assert body["archiveTotalPosts"] >= 3
        assert body["totalPosts"] == body["archiveTotalPosts"]
        assert "cityCounts" in body
        assert "sentimentCounts" in body
        assert "aqiBucketCounts" in body
        assert "dateCounts" in body
        assert "auditStatusCounts" in body

    def test_ingest_omits_full_table_dump(self, ephemeral_server, auth_tokens, seeded_db):
        base_url, _ = ephemeral_server
        status, body = http_post(
            f"{base_url}/ingest",
            data={
                "mode": "merge",
                "posts": [{
                    "id": "http_contract_post",
                    "text": "Lahore AQI 400 smog emergency contract ingest",
                    "authorUsername": "http_contract",
                    "authorName": "HTTP Contract",
                    "createdAt": "1998-01-01T10:00:00Z",
                    "likes": 1,
                    "city": "Lahore",
                }],
            },
            token=auth_tokens["admin"],
        )
        assert status == 200
        assert body.get("cleanPosts") in ([], None)
        assert "newlyAddedPosts" in body

    def test_gzip_json_when_accepted(self, ephemeral_server, auth_tokens, seeded_db):
        base_url, _ = ephemeral_server
        status, headers, raw = _http_get_raw(
            f"{base_url}/posts?limit=100",
            token=auth_tokens["admin"],
            extra_headers={"Accept-Encoding": "gzip"},
        )
        assert status == 200
        encoding = (headers.get("Content-Encoding") or headers.get("content-encoding") or "").lower()
        if encoding == "gzip":
            payload = json.loads(gzip.decompress(raw).decode("utf-8"))
        else:
            payload = json.loads(raw.decode("utf-8"))
            assert len(raw) < 1024
        assert "items" in payload

    def test_plain_json_without_accept_encoding(self, ephemeral_server, auth_tokens, seeded_db):
        base_url, _ = ephemeral_server
        status, headers, raw = _http_get_raw(
            f"{base_url}/posts?limit=2",
            token=auth_tokens["admin"],
        )
        assert status == 200
        encoding = (headers.get("Content-Encoding") or headers.get("content-encoding") or "")
        assert "gzip" not in encoding.lower()
        payload = json.loads(raw.decode("utf-8"))
        assert "items" in payload

    def test_audit_returns_envelope(self, ephemeral_server, auth_tokens, seeded_db):
        base_url, _ = ephemeral_server
        status, body = http_get(f"{base_url}/audit?limit=1&offset=0", token=auth_tokens["admin"])
        assert status == 200
        assert set(body) >= {"items", "total", "limit", "offset"}
        assert isinstance(body["items"], list)
        assert body["limit"] == 1
        assert body["total"] >= len(body["items"])
        assert len(body["items"]) <= 1
        if body["total"] > 1:
            assert len(body["items"]) == 1
            assert body["total"] != len(body["items"])

    def test_noise_returns_envelope(self, ephemeral_server, auth_tokens, seeded_db):
        base_url, _ = ephemeral_server
        status, body = http_get(f"{base_url}/noise?limit=1&offset=0", token=auth_tokens["admin"])
        assert status == 200
        assert set(body) >= {"items", "total", "limit", "offset"}
        assert isinstance(body["items"], list)
        assert body["limit"] == 1
        assert body["total"] >= len(body["items"])
        assert len(body["items"]) <= 1
