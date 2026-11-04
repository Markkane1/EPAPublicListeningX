import subprocess
import shutil
import pytest

class TestSecurityUtils:
    def test_node_security_unit_tests(self, project_root):
        """
        Executes JavaScript unit test suite for dashboard/src/utils/security.js
        via Node test runner.
        """
        node_bin = shutil.which("node")
        if not node_bin:
            pytest.skip("Node.js runtime not found on PATH.")

        cmd = [node_bin, "--test", "tests/unit/test_js_security.mjs"]
        proc = subprocess.run(cmd, cwd=project_root, capture_output=True, text=True)
        assert proc.returncode == 0, f"Node security tests failed:\n{proc.stdout}\n{proc.stderr}"
        assert "pass 12" in proc.stdout or "# pass 12" in proc.stdout or "ok" in proc.stdout
