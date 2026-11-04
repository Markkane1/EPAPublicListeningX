import os
import json
import base64
import urllib.request
import urllib.parse
import urllib.error
import ssl
from datetime import datetime, timezone, timedelta
import random

DEFAULT_ENDPOINT = "https://api.twitter.com/2/tweets/search/recent"
DEFAULT_OAUTH_TOKEN_URL = "https://api.twitter.com/oauth2/token"

class XApiError(Exception):
    def __init__(self, message, status_code=None, raw_body=None):
        super().__init__(message)
        self.status_code = status_code
        self.raw_body = raw_body

def get_bearer_token_from_credentials(api_key: str, api_secret: str) -> str:
    """Exchanges an API key and API secret for an App-Only Bearer Token via OAuth2."""
    if not api_key or not api_secret:
        raise XApiError("API Key and Secret must be non-empty.")

    creds = f"{api_key.strip()}:{api_secret.strip()}"
    b64_creds = base64.b64encode(creds.encode("utf-8")).decode("utf-8")

    headers = {
        "Authorization": f"Basic {b64_creds}",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "EPA-Air-Quality-Scrapper/2.0"
    }
    body = "grant_type=client_credentials".encode("utf-8")
    req = urllib.request.Request(DEFAULT_OAUTH_TOKEN_URL, data=body, headers=headers, method="POST")

    try:
        with _safe_urlopen(req, timeout=20) as resp:
            raw_data = resp.read().decode("utf-8")
            token_data = json.loads(raw_data)
            bearer_token = token_data.get("access_token")
            if not bearer_token:
                raise XApiError("OAuth2 token exchange returned no access_token.")
            return bearer_token
    except XApiError:
        raise
    except Exception as e:
        raise XApiError(f"OAuth2 token exchange failed: {str(e)}")


_OFFICIAL_X_API_HOSTS = frozenset({"api.twitter.com", "api.x.com"})

def is_official_x_api_url(url) -> bool:
    """True only for https URLs whose host is an official X API host."""
    if not url or not isinstance(url, str):
        return False
    parsed = urllib.parse.urlparse(url.strip())
    host = (parsed.hostname or "").lower()
    return parsed.scheme == "https" and host in _OFFICIAL_X_API_HOSTS

def _get_ssl_context():
    """Creates a verifying SSL context. Certificate failures are not bypassed."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()

def _safe_urlopen(req, timeout=20):
    """Executes urlopen with certificate verification. Failures propagate."""
    ctx = _get_ssl_context()
    return urllib.request.urlopen(req, context=ctx, timeout=timeout)

def search_recent_tweets(query: str, bearer_token: str, max_results: int = 25, endpoint_url: str = None) -> dict:
    """
    Calls X API v2 Recent Search endpoint.
    Reference: https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-recent
    """
    if not bearer_token:
        raise XApiError("No Bearer Token provided. Please enter your X API Bearer Token in Settings.", status_code=401)

    url = endpoint_url.strip() if endpoint_url else DEFAULT_ENDPOINT
    if not is_official_x_api_url(url):
        raise XApiError("X API endpoint must be https://api.twitter.com or https://api.x.com.")

    params = {
        "query": query,
        "max_results": str(max(10, min(100, int(max_results)))),
        "tweet.fields": "created_at,public_metrics,author_id,entities,attachments,lang",
        "expansions": "author_id,attachments.media_keys",
        "user.fields": "name,username,profile_image_url,verified,description",
        "media.fields": "url,preview_image_url,type"
    }

    full_url = f"{url}?{urllib.parse.urlencode(params)}"
    headers = {
        "Authorization": f"Bearer {bearer_token.strip()}",
        "User-Agent": "EPA-Air-Quality-Scrapper/2.0",
        "Accept": "application/json"
    }

    req = urllib.request.Request(full_url, headers=headers, method="GET")

    try:
        with _safe_urlopen(req, timeout=20) as resp:
            raw_data = resp.read().decode("utf-8")
            return json.loads(raw_data)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        msg = f"X API HTTP Error {e.code}"
        try:
            err_json = json.loads(err_body)
            if "errors" in err_json and len(err_json["errors"]) > 0:
                msg = f"{e.code} - {err_json['errors'][0].get('message', err_body)}"
            elif "detail" in err_json:
                msg = f"{e.code} - {err_json['detail']}"
            elif "title" in err_json:
                msg = f"{e.code} - {err_json['title']}"
        except Exception:
            msg = f"{e.code} - {err_body}"

        if e.code == 401:
            msg = "401 Unauthorized: Invalid X API Bearer Token. Please verify credentials."
        elif e.code == 403:
            msg = "403 Forbidden: X API access restricted. Ensure your Twitter project has access to Recent Search."
        elif e.code == 429:
            reset_time = e.headers.get("x-rate-limit-reset", "")
            msg = f"429 Too Many Requests: X API Rate limit exceeded. (Reset timestamp: {reset_time})"

        raise XApiError(msg, status_code=e.code, raw_body=err_body)
    except urllib.error.URLError as e:
        raise XApiError(f"Network error connecting to X API: {e.reason}")
    except Exception as e:
        raise XApiError(f"Unexpected error querying X API: {str(e)}")

def test_connection(bearer_token: str, endpoint_url: str = None) -> dict:
    """Verifies X API credentials with a minimal test query."""
    if not bearer_token or not bearer_token.strip():
        return {
            "success": False,
            "message": "Bearer Token is empty. Please provide a valid X API token."
        }

    try:
        res = search_recent_tweets("Lahore AQI", bearer_token=bearer_token, max_results=10, endpoint_url=endpoint_url)
        count = res.get("meta", {}).get("result_count", len(res.get("data", [])))
        return {
            "success": True,
            "message": f"Connection to X API v2 verified successfully! Retrieved test response with {count} posts.",
            "meta": res.get("meta", {})
        }
    except XApiError as e:
        return {
            "success": False,
            "status_code": e.status_code,
            "message": str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Connection failed: {str(e)}"
        }

def transform_x_response(api_response: dict) -> list:
    """
    Transforms X API v2 JSON structure:
    {
      "data": [...],
      "includes": { "users": [...], "media": [...] },
      "meta": {...}
    }
    into a list of raw post dictionaries ready for the pipeline deduplication & enrichment engine.
    """
    tweets = api_response.get("data") or []
    if not isinstance(tweets, list):
        return []

    includes = api_response.get("includes") or {}
    users_raw = includes.get("users") or []
    media_raw = includes.get("media") or []

    user_map = {}
    for u in users_raw:
        uid = str(u.get("id"))
        user_map[uid] = u

    media_map = {}
    for m in media_raw:
        mkey = m.get("media_key")
        if mkey:
            media_map[mkey] = m

    standardized_posts = []
    for t in tweets:
        tid = str(t.get("id"))
        author_id = str(t.get("author_id", ""))
        user = user_map.get(author_id, {})

        author_name = user.get("name") or "X User"
        author_username = user.get("username") or author_id or "user"
        author_avatar = user.get("profile_image_url") or "https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png"
        author_verified = bool(user.get("verified", False))
        author_desc = user.get("description") or ""

        metrics = t.get("public_metrics") or {}
        likes = int(metrics.get("like_count", 0))
        retweets = int(metrics.get("retweet_count", 0))
        replies = int(metrics.get("reply_count", 0))
        quotes = int(metrics.get("quote_count", 0))
        views = metrics.get("impression_count")

        media_urls = []
        media_types = []
        attachments = t.get("attachments") or {}
        media_keys = attachments.get("media_keys") or []
        for mkey in media_keys:
            med = media_map.get(mkey)
            if med:
                u = med.get("url") or med.get("preview_image_url")
                if u:
                    media_urls.append(u)
                if med.get("type"):
                    media_types.append(med["type"])

        entities = t.get("entities") or {}
        urls_in_entities = entities.get("urls") or []
        for ue in urls_in_entities:
            images = ue.get("images") or []
            for img in images:
                if img.get("url") and img.get("url") not in media_urls:
                    media_urls.append(img.get("url"))

        post_url = f"https://x.com/{author_username}/status/{tid}"

        post = {
            "id": tid,
            "clean_id": tid,
            "type": "Post",
            "postUrl": post_url,
            "text": t.get("text", ""),
            "createdAt": t.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "language": t.get("lang"),
            "likes": likes,
            "retweets": retweets,
            "replies": replies,
            "quotes": quotes,
            "bookmarks": 0,
            "views": views,
            "authorName": author_name,
            "authorUsername": author_username,
            "authorFollowers": None,
            "authorFollowing": None,
            "authorDescription": author_desc,
            "authorVerified": author_verified,
            "authorAvatar": author_avatar,
            "authorBanner": None,
            "mediaUrls": media_urls,
            "mediaTypes": ",".join(media_types) if media_types else ("photo" if media_urls else None),
            "source": "x_api"
        }
        standardized_posts.append(post)

    return standardized_posts

def generate_mock_live_search(query: str, count: int = 10, existing_ids: list = None) -> dict:
    """
    Generates realistic dynamic mock response formatted strictly as X API v2 payload.
    Emulates a real-world surveillance stream comprising:
    - High-quality verified air quality reports from Punjab cities
    - Indian domestic discourse posts (to test negative filter enforcement)
    - Off-topic chatter (cricket sports, fast food)
    - Duplicate posts (to test deduplication against existing DB)
    """
    base_id = random.randint(2118000000000000000, 2119000000000000000)
    now = datetime.now(timezone.utc)

    mock_authors = [
        {"name": "Lahore Smog Monitor", "username": "lahoresmogwatch", "verified": True, "avatar": "https://pbs.twimg.com/profile_images/1858161494233427968/VLu2kJ6J_bigger.jpg", "desc": "Official citizens clean air watch for Lahore & Punjab"},
        {"name": "Pak Environmentalists", "username": "pakenviro_pk", "verified": False, "avatar": "https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png", "desc": "Climate and air quality advocacy group Pakistan"},
        {"name": "Dr. Hamza Environmentalist", "username": "drhamza_env", "verified": True, "avatar": "https://pbs.twimg.com/profile_images/1858161494233427968/VLu2kJ6J_bigger.jpg", "desc": "Pulmonology and environmental health researcher, Multan"},
        {"name": "Punjab News Daily", "username": "punjabnewsdaily", "verified": True, "avatar": "https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png", "desc": "Breaking environmental headlines across Punjab"},
        {"name": "Gujranwala Updates", "username": "gwa_updates", "verified": False, "avatar": "https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png", "desc": "Local affairs and industrial pollution updates Gujranwala"},
        {"name": "Delhi Pollution Watch", "username": "delhipollution", "verified": True, "avatar": "https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png", "desc": "Real-time air pollution updates for Delhi NCR and surrounding regions"},
        {"name": "Cricket Fans PK", "username": "cricket_punjab", "verified": False, "avatar": "https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png", "desc": "All news about cricket tournaments in Lahore stadium"}
    ]

    mock_images = [
        "https://pbs.twimg.com/media/HWHoW1ta8AAwm3R?format=jpg&name=900x900",
        "https://pbs.twimg.com/media/GcgK3uQXwAAtb-Y?format=jpg&name=small",
        "https://pbs.twimg.com/media/GcgoFmQW4AA644O?format=jpg&name=small"
    ]

    tweets = []
    users = []
    media = []

    for i in range(count):
        author_idx = i % len(mock_authors)
        author = mock_authors[author_idx]
        uid = f"100{i+10}"
        
        # Test duplicate ID if existing_ids provided on i == 3
        if i == 3 and existing_ids and len(existing_ids) > 0:
            tid = str(existing_ids[0])
        else:
            tid = str(base_id + i)

        aqi = random.choice([430, 510, 580, 620, 310, 245, 180, 490, 525, 390])
        city = random.choice(["Lahore", "Gujranwala", "Faisalabad", "Multan", "Attock"])
        created_time = (now - timedelta(minutes=i * 18 + random.randint(1, 10))).isoformat()

        # Realistic distribution:
        # i % 5 == 1: Indian domestic context (should be filtered into noise)
        # i % 5 == 2: Off-topic sports/cricket noise (should be filtered into noise)
        # other: Valid Punjab air quality post (should pass and be enriched)
        if i % 5 == 1:
            text = f"CAQM review meeting in Delhi today: Severe AQI 485 recorded in Noida and Gurugram as stubble burning parali fires peak across Haryana and Punjab border. #DelhiAirPollution #CAQM"
        elif i % 5 == 2:
            text = f"Breaking: PCB media announces schedule for Champions Trophy cricket tournament in Lahore. Pitch preparations underway at stadium. #CricketNews"
        else:
            text_options = [
                f"URGENT: Hazardous AQI {aqi} recorded in {city} this afternoon. Particulate PM2.5 levels are 35x WHO limits. Please wear N95 masks! #smog #{city}",
                f"EPA Anti-smog squad inspected 14 industrial units in {city} today, sealing 3 non-compliant steel mills and issuing heavy fines. #CleanAir #PunjabEPA",
                f"Air quality in {city} is catastrophic today with AQI reaching {aqi}. Hospitals reporting surge in respiratory and eye irritation patients. #SmogEmergency",
                f"Satellite images show intense stubble burning clusters across Punjab borders. AQI standing at {aqi} in {city}. When will this seasonal nightmare end?",
                f"Green lockdown enforced in several zones of {city} as AQI crosses {aqi}. Schools shifted online for primary grades. #LahoreSmog"
            ]
            text = text_options[i % len(text_options)]

        has_med = (i % 2 == 0)
        attachments = {}
        if has_med:
            mkey = f"3_{tid}"
            attachments["media_keys"] = [mkey]
            media.append({
                "media_key": mkey,
                "type": "photo",
                "url": mock_images[i % len(mock_images)]
            })

        tweets.append({
            "id": tid,
            "text": text,
            "author_id": uid,
            "created_at": created_time,
            "lang": "en",
            "public_metrics": {
                "like_count": random.randint(5, 250),
                "retweet_count": random.randint(1, 75),
                "reply_count": random.randint(0, 30),
                "quote_count": random.randint(0, 15),
                "impression_count": random.randint(300, 8500)
            },
            "attachments": attachments
        })

        if not any(u["id"] == uid for u in users):
            users.append({
                "id": uid,
                "name": author["name"],
                "username": author["username"],
                "profile_image_url": author["avatar"],
                "verified": author["verified"],
                "description": author["desc"]
            })

    return {
        "data": tweets,
        "includes": {
            "users": users,
            "media": media
        },
        "meta": {
            "result_count": len(tweets),
            "newest_id": tweets[0]["id"] if tweets else "",
            "oldest_id": tweets[-1]["id"] if tweets else ""
        }
    }
