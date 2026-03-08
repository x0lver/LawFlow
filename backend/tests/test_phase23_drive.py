"""Phase 23 — Google Drive File Storage & case-files API tests"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://justice-flow-3.preview.emergentagent.com').rstrip('/')

# ── Helper: get valid JWT token ─────────────────────────────────────────────
def get_token():
    r = requests.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": "9876543210"})
    if r.status_code != 200:
        return None
    r2 = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
    if r2.status_code != 200:
        return None
    return r2.json().get("token")


class TestHealth:
    """Health check"""
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok" or data.get("success") is True


class TestCaseFilesAuth:
    """Case-files auth protection"""

    def test_get_case_files_no_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/case-files?caseId=test")
        assert r.status_code == 401

    def test_post_case_file_no_auth_returns_401(self):
        r = requests.post(f"{BASE_URL}/api/case-files", json={
            "caseId": "test", "fileName": "test.pdf",
            "fileType": "PDF", "isSynced": False
        })
        assert r.status_code == 401


class TestCaseFilesCRUD:
    """Case-files CRUD with valid token"""

    @pytest.fixture(scope="class")
    def token(self):
        t = get_token()
        if not t:
            pytest.skip("Could not get auth token")
        return t

    @pytest.fixture(scope="class")
    def headers(self, token):
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def test_create_case_file(self, headers):
        r = requests.post(f"{BASE_URL}/api/case-files", headers=headers, json={
            "caseId": "TEST_case123",
            "fileName": "TEST_document.pdf",
            "fileType": "PDF",
            "size": "102400",
            "isSynced": False,
            "type": "DOCUMENT",
        })
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        file_data = data.get("data", {})
        assert file_data.get("fileName") == "TEST_document.pdf"
        assert file_data.get("id")
        # Store for cleanup
        TestCaseFilesCRUD._created_id = file_data["id"]

    def test_list_case_files(self, headers):
        r = requests.get(f"{BASE_URL}/api/case-files?caseId=TEST_case123", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        assert isinstance(data.get("data"), list)

    def test_mark_file_synced(self, headers):
        file_id = getattr(TestCaseFilesCRUD, '_created_id', None)
        if not file_id:
            pytest.skip("No file created")
        r = requests.patch(f"{BASE_URL}/api/case-files/{file_id}/sync", headers=headers, json={
            "googleDriveFileId": "drive_abc123",
            "googleDriveUrl": "https://drive.google.com/file/d/drive_abc123/view",
        })
        assert r.status_code == 200
        assert r.json().get("success") is True

    def test_delete_case_file(self, headers):
        file_id = getattr(TestCaseFilesCRUD, '_created_id', None)
        if not file_id:
            pytest.skip("No file created")
        r = requests.delete(f"{BASE_URL}/api/case-files/{file_id}", headers=headers)
        assert r.status_code == 200
        assert r.json().get("success") is True

    def test_get_deleted_file_returns_empty(self, headers):
        """After delete, listing for TEST case should return empty or not contain deleted item"""
        r = requests.get(f"{BASE_URL}/api/case-files?caseId=TEST_case123", headers=headers)
        assert r.status_code == 200
        data = r.json().get("data", [])
        ids = [d.get("id") for d in data]
        assert getattr(TestCaseFilesCRUD, '_created_id', None) not in ids
