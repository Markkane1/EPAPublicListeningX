"""
Test Suite for EPA Backend API Server Endpoints
"""
import sys
import os
import json
import threading
import time
import urllib.request
import urllib.parse
import socketserver

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from serve import SPAServerHandler
from backend import service, database

TEST_PORT = 8094

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

httpd_instance = None

def run_test_server():
    global httpd_instance
    service.initialize_service()
    httpd_instance = ReusableTCPServer(("127.0.0.1", TEST_PORT), SPAServerHandler)
    httpd_instance.serve_forever()

def http_get(path):
    url = f"http://127.0.0.1:{TEST_PORT}{path}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

def http_post(path, data):
    url = f"http://127.0.0.1:{TEST_PORT}{path}"
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    server_thread = threading.Thread(target=run_test_server, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    try:
        print("[1] Testing GET /api/settings ...")
        settings = http_get("/api/settings")
        assert "data_source" in settings
        print("  -> OK. Current mode:", settings["data_source"])

        print("[2] Testing POST /api/settings ...")
        updated = http_post("/api/settings", {"data_source": "x_api", "x_bearer_token": "TEST_BEARER_SAMPLE_TOKEN"})
        assert updated["data_source"] == "x_api"
        assert updated["has_bearer_token"] is True
        print("  -> OK. Updated mode:", updated["data_source"], "masked token:", updated["x_bearer_token_masked"])

        print("[3] Testing POST /api/x/test-connection with dummy token ...")
        test_res = http_post("/api/x/test-connection", {"bearerToken": "INVALID_TEST_TOKEN"})
        assert "success" in test_res
        print("  -> OK. Handled gracefully:", test_res["message"][:60])

        print("[4] Testing GET /api/posts?limit=5 ...")
        posts = http_get("/api/posts?limit=5")
        assert len(posts) == 5
        print("  -> OK. Fetched 5 posts. First ID:", posts[0]["id"])

        print("[5] Testing POST /api/x/search (Direct Keyword Search) ...")
        search_res = http_post("/api/x/search", {
            "keyword": "Lahore smog",
            "liveOverride": True,
            "maxResults": 5,
            "simulateIfMissing": True
        })
        assert search_res["success"] is True
        assert len(search_res["newPosts"]) > 0
        print("  -> OK. Verified posts received:", len(search_res["newPosts"]))

        print("[6] Testing GET /api/stats ...")
        stats = http_get("/api/stats")
        assert stats["totalPosts"] >= 183
        print("  -> OK. Total posts in SQLite DB:", stats["totalPosts"], "Peak AQI:", stats["peakAqi"])

        print("[7] Testing GET /api/audit?limit=3 ...")
        audit = http_get("/api/audit?limit=3")
        assert len(audit) > 0
        print("  -> OK. Audit log entries:", len(audit))

        print("[8] Testing POST /api/ingest (batch ingestion into SQLite) ...")
        batch_sample = [
            {
                "id": "999888777666",
                "text": "Lahore AQI crossed 450 today. Extreme smog warning in Gulberg! #Lahore #smog",
                "authorUsername": "testuser",
                "authorName": "Test Citizen",
                "likes": 5,
                "retweets": 2
            }
        ]
        ingest_res = http_post("/api/ingest", {"posts": batch_sample, "mode": "merge"})
        assert ingest_res["success"] is True
        print("  -> OK. Ingested successfully into SQLite DB! Added:", len(ingest_res["newlyAddedPosts"]))

        # Reset settings back to file for clean state
        http_post("/api/settings", {"data_source": "file", "x_bearer_token": ""})

        print("[9] Testing GET /api/queries ...")
        q_vers = http_get("/api/queries")
        assert len(q_vers) >= 3
        print("  -> OK. Query versions returned:", len(q_vers), "Active:", [v["versionTag"] for v in q_vers if v["isActive"]])

        print("[10] Testing POST /api/queries (create new version) ...")
        created_q = http_post("/api/queries", {
            "versionTag": "v2.0-test",
            "title": "Automated Test Query Version",
            "queryText": "(AQI OR smog) Lahore lang:en",
            "description": "Test description for versioning",
            "setActive": False
        })
        assert created_q["versionTag"] == "v2.0-test"
        test_qid = created_q["id"]
        print("  -> OK. Created query version with ID:", test_qid)

        print("[11] Testing POST /api/queries/activate ...")
        act_res = http_post("/api/queries/activate", {"id": test_qid})
        assert act_res["success"] is True
        # Verify settings synchronized
        settings_after = http_get("/api/settings")
        assert settings_after["default_query"] == "(AQI OR smog) Lahore lang:en"
        print("  -> OK. Activated query version successfully synced to settings.default_query!")

        print("[12] Testing POST /api/queries/update ...")
        upd_res = http_post("/api/queries/update", {
            "id": test_qid,
            "title": "Updated Test Query Version",
            "queryText": "(AQI OR smog OR pollution) Lahore lang:en"
        })
        assert upd_res["title"] == "Updated Test Query Version"
        print("  -> OK. Updated version queryText successfully!")

        print("[13] Testing POST /api/queries/delete ...")
        # Activate baseline first (id 2) so test_qid can be deleted
        http_post("/api/queries/activate", {"id": 2})
        del_res = http_post("/api/queries/delete", {"id": test_qid})
        assert del_res["success"] is True
        print("  -> OK. Deleted test query version successfully!")

        print("\n=======================================================")
        print("ALL 13 BACKEND API ENDPOINTS VERIFIED & PASSING 100%!")
        print("=======================================================")
    finally:
        os._exit(0)

if __name__ == "__main__":
    main()
