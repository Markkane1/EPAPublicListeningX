import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _read(relative):
    path = os.path.join(ROOT, relative)
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def test_dashboard_app_has_no_static_post_seed():
    text = _read(os.path.join("dashboard", "src", "App.jsx"))
    assert "cleaned_epa_posts.json" not in text
    assert "initial_noise_posts" not in text


def test_dashboard_view_has_no_placeholder_aqi():
    text = _read(os.path.join("dashboard", "src", "views", "DashboardView", "index.jsx"))
    assert "crossing 600" not in text
    assert "361.1" not in text


def test_navbar_has_no_hazardous_placeholder():
    text = _read(os.path.join("dashboard", "src", "examples", "Navbars", "DashboardNavbar", "index.jsx"))
    assert "Hazardous AQI 606" not in text


def test_login_view_labels_inputs():
    text = _read(os.path.join("dashboard", "src", "views", "LoginView", "index.jsx"))
    assert 'component="label"' in text or "<label" in text
    assert 'htmlFor="login-username"' in text
    assert 'htmlFor="login-password"' in text
    assert 'id="login-username"' in text
    assert 'id="login-password"' in text


def test_navbar_sign_out_is_a_button():
    text = _read(os.path.join("dashboard", "src", "examples", "Navbars", "DashboardNavbar", "index.jsx"))
    lowered = text.lower()
    index = lowered.find("sign out")
    assert index != -1
    window = text[max(0, index - 500): index + 500]
    assert "<button" in window.lower() or 'component="button"' in window


def test_dashboard_css_respects_reduced_motion():
    src = os.path.join(ROOT, "dashboard", "src")
    found = False
    for dirpath, _dirnames, filenames in os.walk(src):
        for name in filenames:
            if not name.endswith(".css"):
                continue
            with open(os.path.join(dirpath, name), encoding="utf-8") as handle:
                if "@media (prefers-reduced-motion: reduce)" in handle.read():
                    found = True
                    break
        if found:
            break
    assert found


def test_portal_lightbox_is_not_shifted_offscreen():
    text = _read(os.path.join("portal", "styles.css"))
    assert "top: -2.5rem" not in text


def test_portal_script_has_no_placeholder_aqi():
    text = _read(os.path.join("portal", "app.js"))
    assert ": 606" not in text
    assert ": 361.1" not in text


def test_portal_html_has_no_placeholder_aqi():
    text = _read(os.path.join("portal", "index.html"))
    assert ">606<" not in text
    assert ">361.1<" not in text


def test_sentiment_engine_switch_requires_settings_manage():
    text = _read(os.path.join("dashboard", "src", "views", "SettingsView", "index.jsx"))
    assert "settings.manage" in text
    assert "onClick={() => handleSwitchEngine(" not in text
    assert "canManageSettings ? () => handleSwitchEngine('vader')" in text
    assert "canManageSettings ? () => handleSwitchEngine('transformer')" in text
    start = text.find("const handleSwitchEngine")
    end = text.find("const handleReanalyzeAll")
    body = text[start:end]
    await_at = body.find("await setSentimentEngine")
    assert start != -1 and await_at != -1
    assert "setSentimentEngineState(eng)" not in body[:await_at]


def test_mutation_controls_are_permission_gated():
    app = _read(os.path.join("dashboard", "src", "App.jsx"))
    search = _read(os.path.join("dashboard", "src", "views", "SearchView", "index.jsx"))
    noise = _read(os.path.join("dashboard", "src", "views", "NoiseView", "index.jsx"))
    settings = _read(os.path.join("dashboard", "src", "views", "SettingsView", "index.jsx"))
    assert "posts.ingest" in app
    assert "posts.exclude" in app
    assert "posts.search_x" in search
    assert "noise.manage" in noise
    assert "settings.manage" in settings


def test_failed_noise_restore_is_not_success():
    text = _read(os.path.join("dashboard", "src", "views", "NoiseView", "index.jsx"))
    guard = text.find("res.success === false")
    success = text.find("type: 'success'", guard)
    restored = text.find("onPostRestored", guard)
    error = text.find("type: 'error'", guard)
    assert guard != -1
    assert success != -1 and success > guard
    assert restored != -1 and restored > guard
    assert error != -1 and error > success


def test_portal_lightbox_controls_stay_inside_the_viewport():
    text = _read(os.path.join("portal", "styles.css"))
    assert "left: -3.5rem" not in text
    assert "right: -3.5rem" not in text


def test_login_bundle_does_not_register_chartjs():
    main = _read(os.path.join("dashboard", "src", "main.jsx"))
    analytics = _read(os.path.join("dashboard", "src", "views", "AnalyticsView", "index.jsx"))
    assert "chart.js" not in main
    assert "ChartJS.register" in analytics


def test_app_does_not_prefetch_the_archive():
    app = _read(os.path.join("dashboard", "src", "App.jsx"))
    api = _read(os.path.join("dashboard", "src", "services", "api.js"))
    assert "getAllStoredPosts" not in app
    assert "getAllStoredPosts" not in api
    assert "getPosts(" not in app
    assert "getNoisePosts(" not in app
    assert "getAuditLogs(" not in app
    assert "getSettings" in app
    assert "getStats" in app
    assert "lazy(" in app
    assert "Suspense" in app


def test_posts_view_pages_latest_chunk():
    text = _read(os.path.join("dashboard", "src", "views", "PostsView", "index.jsx"))
    api = _read(os.path.join("dashboard", "src", "services", "api.js"))
    assert "POSTS_CHUNK_SIZE = 100" in api
    assert "POSTS_PAGE_SIZE = 12" in api
    assert "POSTS_CHUNK_SIZE" in text
    assert "POSTS_PAGE_SIZE" in text
    assert "getStats" in text
    assert "getPosts" in text


def test_audit_view_fetches_its_own_page():
    text = _read(os.path.join("dashboard", "src", "views", "AuditView", "index.jsx"))
    assert "getAuditLogs" in text
    assert "auditStatusCounts" in text
    assert "auditLog:" not in text


def test_noise_view_uses_list_envelope():
    text = _read(os.path.join("dashboard", "src", "views", "NoiseView", "index.jsx"))
    assert "getNoisePosts" in text
    assert "POSTS_CHUNK_SIZE" in text
    assert "noisePosts:" not in text
    assert "propNoisePosts" not in text


def test_ingest_modal_previews_file_only():
    text = _read(os.path.join("dashboard", "src", "components", "IngestModal", "index.jsx"))
    assert "currentPosts" not in text
    assert "processRawPosts(" in text
    assert "[]" in text
    assert "live archive" in text.lower() or "on confirm" in text.lower()


def test_search_db_tabs_are_server_queries():
    text = _read(os.path.join("dashboard", "src", "views", "SearchView", "index.jsx"))
    assert "verified: 1" in text or "verified = 1" in text
    assert "media = 'media'" in text or 'media: "media"' in text or "media: 'media'" in text
    assert "sortBy = 'engagement'" in text or "sortBy: 'engagement'" in text
