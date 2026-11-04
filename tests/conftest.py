import os
import sys
import tempfile
import shutil
import threading
import time
import socketserver
import pytest

TEST_TURNSTILE_TOKEN = "unit-test-turnstile-ok"
TEST_ADMIN_PASSWORD = "UnitTestAdmin#2026"
TEST_ANALYST_PASSWORD = "UnitTestAnalyst#2026"
TEST_AUDITOR_PASSWORD = "UnitTestAuditor#2026"
TEST_VIEWER_PASSWORD = "UnitTestViewer#2026"
os.environ["EPA_TURNSTILE_TEST_TOKEN"] = TEST_TURNSTILE_TOKEN

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend import database
from backend import service
from serve import SPAServerHandler

@pytest.fixture(scope="session")
def project_root():
    return ROOT_DIR

@pytest.fixture
def temp_db(monkeypatch):
    """
    Creates an isolated SQLite test database for each test, initializes
    the RBAC schema with known default test credentials, and restores
    the original DB_PATH on teardown.
    """
    test_dir = os.path.join(ROOT_DIR, ".test_data")
    os.makedirs(test_dir, exist_ok=True)
    temp_file = tempfile.NamedTemporaryFile(dir=test_dir, delete=False, suffix=".db")
    test_db_path = temp_file.name
    temp_file.close()

    monkeypatch.setitem(database.DEFAULT_USERS_DATA[0], "password", TEST_ADMIN_PASSWORD)
    monkeypatch.setitem(database.DEFAULT_USERS_DATA[1], "password", TEST_ANALYST_PASSWORD)
    monkeypatch.setitem(database.DEFAULT_USERS_DATA[2], "password", TEST_AUDITOR_PASSWORD)
    monkeypatch.setitem(database.DEFAULT_USERS_DATA[3], "password", TEST_VIEWER_PASSWORD)

    orig_db_path = database.DB_PATH
    monkeypatch.setattr(database, "DB_PATH", test_db_path)
    database.init_db()

    yield test_db_path

    monkeypatch.setattr(database, "DB_PATH", orig_db_path)
    try:
        if os.path.exists(test_db_path):
            os.remove(test_db_path)
        for ext in ["-wal", "-shm"]:
            if os.path.exists(test_db_path + ext):
                os.remove(test_db_path + ext)
    except Exception:
        pass

@pytest.fixture
def seeded_db(temp_db):
    """
    Initializes isolated DB and seeds a small set of clean air quality posts.
    """
    sample_posts = [
        {
            "id": "post_1001",
            "text": "AQI in Lahore reaches 450 hazardous levels today. Please wear masks! #LahoreSmog",
            "authorUsername": "lahore_citizen",
            "authorName": "Lahore Observer",
            "authorVerified": False,
            "authorAvatar": "https://pbs.twimg.com/avatar1.jpg",
            "authorBio": "Environmental enthusiast in Lahore Pakistan",
            "createdAt": "2026-11-01T10:00:00Z",
            "likes": 50,
            "retweets": 12,
            "replies": 5,
            "impressions": 1200,
            "url": "https://x.com/lahore_citizen/status/post_1001",
            "media": ["https://pbs.twimg.com/media/smog1.jpg"],
            "city": "Lahore",
            "topic": "AQI Measurement",
            "aqi": 450,
            "severity": "Hazardous",
            "sentiment": "Critical / Alarmed",
            "sentimentScore": -0.75,
            "isNoise": False,
            "isVerified": True
        },
        {
            "id": "post_1002",
            "text": "Punjab EPA crackdown on illegal industrial kilns in Gujranwala shows positive improvement.",
            "authorUsername": "punjab_updates",
            "authorName": "Punjab Monitor",
            "authorVerified": True,
            "authorAvatar": "https://pbs.twimg.com/avatar2.jpg",
            "authorBio": "Independent environmental reporting in Punjab",
            "createdAt": "2026-11-02T12:00:00Z",
            "likes": 120,
            "retweets": 34,
            "replies": 10,
            "impressions": 4500,
            "url": "https://x.com/punjab_updates/status/post_1002",
            "media": [],
            "city": "Gujranwala",
            "topic": "Government Action",
            "aqi": 180,
            "severity": "Unhealthy",
            "sentiment": "Positive / Solution-Oriented",
            "sentimentScore": 0.45,
            "isNoise": False,
            "isVerified": True
        },
        {
            "id": "post_1003",
            "text": "Faisalabad air quality index is 310. Dense fog and stubble burning smoke reported.",
            "authorUsername": "faisalabad_news",
            "authorName": "FSD News Alert",
            "authorVerified": False,
            "authorAvatar": "https://pbs.twimg.com/avatar3.jpg",
            "authorBio": "News desk Faisalabad",
            "createdAt": "2026-11-03T08:30:00Z",
            "likes": 30,
            "retweets": 8,
            "replies": 2,
            "impressions": 900,
            "url": "https://x.com/faisalabad_news/status/post_1003",
            "media": [],
            "city": "Faisalabad",
            "topic": "Stubble Burning",
            "aqi": 310,
            "severity": "Hazardous",
            "sentiment": "Concerned",
            "sentimentScore": -0.35,
            "isNoise": False,
            "isVerified": True
        }
    ]
    database.save_posts_batch(sample_posts)
    return temp_db

@pytest.fixture
def auth_tokens(temp_db):
    """
    Returns valid authenticated sessions for all 4 default roles.
    """
    res_admin = service.auth_login_service("admin", TEST_ADMIN_PASSWORD, turnstile_token=TEST_TURNSTILE_TOKEN)
    res_analyst = service.auth_login_service("analyst", TEST_ANALYST_PASSWORD, turnstile_token=TEST_TURNSTILE_TOKEN)
    res_auditor = service.auth_login_service("auditor", TEST_AUDITOR_PASSWORD, turnstile_token=TEST_TURNSTILE_TOKEN)
    res_viewer = service.auth_login_service("viewer", TEST_VIEWER_PASSWORD, turnstile_token=TEST_TURNSTILE_TOKEN)

    return {
        "admin": res_admin["token"],
        "analyst": res_analyst["token"],
        "auditor": res_auditor["token"],
        "viewer": res_viewer["token"]
    }

@pytest.fixture
def ephemeral_server(temp_db):
    """
    Spins up SPAServerHandler on an OS-assigned dynamic port (port=0)
    in a background thread. Yields (base_url, port).
    Automatically shuts down and terminates on fixture teardown.
    """
    server = socketserver.ThreadingTCPServer(("127.0.0.1", 0), SPAServerHandler)
    server.daemon_threads = True
    assigned_port = server.server_address[1]

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.15)  # allow socket binding

    base_url = f"http://127.0.0.1:{assigned_port}/api"
    yield base_url, assigned_port

    server.shutdown()
    server.server_close()
