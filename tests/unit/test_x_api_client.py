import json
import ssl
import urllib.error
import pytest
from unittest.mock import MagicMock, patch

from backend import x_api_client
from backend.x_api_client import XApiError

class TestXApiClient:
    def test_get_bearer_token_empty_credentials(self):
        with pytest.raises(XApiError, match="must be non-empty"):
            x_api_client.get_bearer_token_from_credentials("", "secret")

        with pytest.raises(XApiError, match="must be non-empty"):
            x_api_client.get_bearer_token_from_credentials("key", "")

    @patch("backend.x_api_client._safe_urlopen")
    def test_get_bearer_token_success(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({"token_type": "bearer", "access_token": "AAAA_MOCK_TOKEN_123"}).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        token = x_api_client.get_bearer_token_from_credentials("test_key", "test_secret")
        assert token == "AAAA_MOCK_TOKEN_123"

    @patch("backend.x_api_client._safe_urlopen")
    def test_get_bearer_token_missing_access_token(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({"token_type": "bearer"}).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        with pytest.raises(XApiError, match="returned no access_token"):
            x_api_client.get_bearer_token_from_credentials("test_key", "test_secret")

    def test_search_recent_tweets_missing_token(self):
        with pytest.raises(XApiError, match="No Bearer Token provided") as exc_info:
            x_api_client.search_recent_tweets("Lahore AQI", bearer_token="")
        assert exc_info.value.status_code == 401

    @patch("backend.x_api_client._safe_urlopen")
    def test_search_recent_tweets_success(self, mock_urlopen):
        sample_api_response = {
            "data": [
                {
                    "id": "1858161494233427968",
                    "text": "Lahore AQI hits hazardous 450 today! #smog",
                    "author_id": "123456",
                    "created_at": "2026-11-03T12:00:00Z",
                    "public_metrics": {"like_count": 25, "retweet_count": 5}
                }
            ],
            "includes": {
                "users": [{"id": "123456", "name": "Lahore Watch", "username": "lahorewatch"}]
            },
            "meta": {"result_count": 1}
        }
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(sample_api_response).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        res = x_api_client.search_recent_tweets("Lahore AQI", bearer_token="VALID_TOKEN")
        assert "data" in res
        assert len(res["data"]) == 1
        assert res["meta"]["result_count"] == 1

    @patch("backend.x_api_client._safe_urlopen")
    def test_search_recent_tweets_rate_limit_429(self, mock_urlopen):
        err = urllib.error.HTTPError(
            url="https://api.twitter.com/2/tweets/search/recent",
            code=429,
            msg="Too Many Requests",
            hdrs={"x-rate-limit-reset": "1730720000"},
            fp=MagicMock(read=lambda: b'{"title": "Too Many Requests"}')
        )
        mock_urlopen.side_effect = err

        with pytest.raises(XApiError) as exc_info:
            x_api_client.search_recent_tweets("smog", bearer_token="VALID_TOKEN")
        assert exc_info.value.status_code == 429
        assert "Rate limit exceeded" in str(exc_info.value)

    def test_test_connection_empty_token(self):
        res = x_api_client.test_connection("")
        assert res["success"] is False
        assert "Bearer Token is empty" in res["message"]

    @patch("backend.x_api_client.search_recent_tweets")
    def test_test_connection_success(self, mock_search):
        mock_search.return_value = {
            "meta": {"result_count": 5},
            "data": [{"id": f"t_{i}"} for i in range(5)]
        }
        res = x_api_client.test_connection("VALID_TOKEN")
        assert res["success"] is True
        assert "verified successfully" in res["message"]

    def test_transform_x_response_mapping(self):
        raw_api_payload = {
            "data": [
                {
                    "id": "19001",
                    "text": "Severe smog in Faisalabad. Industrial emissions alert.",
                    "author_id": "usr_77",
                    "created_at": "2026-11-03T14:00:00Z",
                    "lang": "en",
                    "public_metrics": {
                        "like_count": 42,
                        "retweet_count": 11,
                        "reply_count": 3,
                        "quote_count": 1,
                        "impression_count": 890
                    },
                    "attachments": {
                        "media_keys": ["med_1"]
                    }
                }
            ],
            "includes": {
                "users": [
                    {
                        "id": "usr_77",
                        "name": "FSD Clean Air",
                        "username": "fsdair",
                        "profile_image_url": "https://pbs.twimg.com/avatar.jpg",
                        "verified": True,
                        "description": "Faisalabad air monitoring group"
                    }
                ],
                "media": [
                    {
                        "media_key": "med_1",
                        "type": "photo",
                        "url": "https://pbs.twimg.com/photo1.jpg"
                    }
                ]
            }
        }

        posts = x_api_client.transform_x_response(raw_api_payload)
        assert len(posts) == 1
        p = posts[0]
        assert p["id"] == "19001"
        assert p["authorUsername"] == "fsdair"
        assert p["authorName"] == "FSD Clean Air"
        assert p["authorVerified"] is True
        assert p["likes"] == 42
        assert p["retweets"] == 11
        assert p["replies"] == 3
        assert p["views"] == 890
        assert p["mediaUrls"] == ["https://pbs.twimg.com/photo1.jpg"]
        assert p["postUrl"] == "https://x.com/fsdair/status/19001"
        assert p["source"] == "x_api"

    def test_transform_x_response_empty(self):
        assert x_api_client.transform_x_response({}) == []
        assert x_api_client.transform_x_response({"data": None}) == []

    def test_generate_mock_live_search(self):
        mock_data = x_api_client.generate_mock_live_search("smog", count=8, existing_ids=["prev_id_999"])
        assert "data" in mock_data
        assert "includes" in mock_data
        assert "meta" in mock_data
        assert len(mock_data["data"]) == 8
        assert mock_data["meta"]["result_count"] == 8
        # Verify duplicate injection
        assert mock_data["data"][3]["id"] == "prev_id_999"

    def test_ssl_context_verifies_certificates(self):
        ctx = x_api_client._get_ssl_context()
        assert ctx.verify_mode == ssl.CERT_REQUIRED
        assert ctx.check_hostname is True
