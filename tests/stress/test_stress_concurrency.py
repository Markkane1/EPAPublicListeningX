import threading
import time
import json
import urllib.request
import urllib.error
import pytest
from backend import database, service

class TestConcurrencyStress:
    def test_multithreaded_sqlite_concurrent_read_write(self, temp_db):
        """
        Stress SQLite WAL mode with 20 concurrent worker threads executing
        interleaved batch inserts, complex aggregations, audit logs, and queries.
        """
        errors = []
        num_threads = 20
        posts_per_thread = 15

        def worker(thread_idx):
            try:
                # 1. Batch insert posts
                posts = [
                    {
                        "id": f"stress_t{thread_idx}_p{p}",
                        "text": f"Concurrent thread {thread_idx} test post {p} smog levels in Lahore AQI 350",
                        "city": "Lahore",
                        "sentiment": "Critical / Alarmed",
                        "sentiment_score": -0.65,
                        "aqi": 350,
                        "likes": p * 3,
                        "retweets": p,
                        "replies": p,
                        "quotes": 0,
                        "created_at": "2026-11-04T12:00:00Z",
                        "author_username": f"user_{thread_idx}_{p}",
                        "author_name": f"Citizen {thread_idx}",
                        "source": "x",
                        "verified": False,
                        "sentiment_source": "lexicon"
                    }
                    for p in range(posts_per_thread)
                ]
                database.save_posts_batch(posts)

                # 2. Concurrently read posts with filters
                posts_res = database.get_all_posts(city="Lahore", limit=10, offset=0)
                assert isinstance(posts_res, list)

                # 3. Concurrently calculate stats
                stats = database.get_db_stats()
                assert stats["totalPosts"] >= posts_per_thread

                # 4. Concurrently query roles and permissions
                roles = database.get_roles_list_db()
                assert len(roles) >= 4

                # 5. Query audit logs via service
                logs = service.get_all_audit_logs_service(limit=10)
                assert isinstance(logs, list)

            except Exception as e:
                errors.append(f"Thread {thread_idx} encountered error: {type(e).__name__}: {str(e)}")

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(num_threads)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors, f"Concurrent workers encountered errors: {errors}"

        # Final verification: All 300 posts inserted across 20 threads exist in DB (plus any initial seeded)
        final_stats = database.get_db_stats()
        assert final_stats["totalPosts"] >= num_threads * posts_per_thread

    def test_multithreaded_http_api_concurrency(self, ephemeral_server, auth_tokens):
        """
        Send simultaneous concurrent requests from multiple threads to ephemeral_server.
        Verifies thread safety, socket pool handling, and response integrity.
        """
        base_url, _ = ephemeral_server
        token = auth_tokens["analyst"]
        concurrency = 12
        requests_per_thread = 5
        errors = []
        statuses = []

        def client_worker(worker_id):
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            endpoints = ["/posts?limit=5", "/stats", "/settings"]
            for r in range(requests_per_thread):
                ep = endpoints[r % len(endpoints)]
                req = urllib.request.Request(f"{base_url}{ep}", headers=headers, method="GET")
                try:
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        content = resp.read()
                        data = json.loads(content.decode("utf-8"))
                        statuses.append(resp.status)
                except urllib.error.HTTPError as e:
                    statuses.append(e.code)
                except Exception as ex:
                    errors.append(f"Worker {worker_id} request {r} failed on {ep}: {type(ex).__name__}: {str(ex)}")

        threads = [threading.Thread(target=client_worker, args=(i,)) for i in range(concurrency)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors, f"HTTP Concurrency encountered exceptions: {errors}"
        total_requests = concurrency * requests_per_thread
        assert len(statuses) == total_requests
        assert all(s == 200 for s in statuses), f"Non-200 status codes observed: {[s for s in statuses if s != 200]}"
