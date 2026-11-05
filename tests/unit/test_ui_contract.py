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
