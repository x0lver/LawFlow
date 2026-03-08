"""
Phase 20 - Play Store Readiness Fixes - Backend API Tests

Test coverage:
- Fix 6: Firm creation (POST /api/firms) with valid auth token
- Fix 8: Case deletion (DELETE /api/cases/{id}) with valid auth token
- Fix 1: Profile update (PUT /api/auth/me) - ensure name update works for signup flow
- Health check to ensure backend is running
"""

import pytest
import requests
import os

# Use environment variable for base URL (public URL)
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not set in environment")

# Test credentials
TEST_PHONE = "+919876543210"
TEST_OTP = "123456"


@pytest.fixture(scope="module")
def auth_token():
    """
    Authenticate and return a valid JWT token for testing
    """
    # Request OTP
    resp = requests.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": TEST_PHONE})
    assert resp.status_code == 200, f"OTP request failed: {resp.status_code} {resp.text}"
    
    # Verify OTP
    resp = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": TEST_PHONE, "otp": TEST_OTP})
    assert resp.status_code == 200, f"OTP verify failed: {resp.status_code} {resp.text}"
    
    data = resp.json()
    assert data.get("success") is True, "OTP verification did not return success"
    assert "token" in data, "OTP verification did not return token"
    
    token = data["token"]
    print(f"✅ Authenticated successfully with token: {token[:20]}...")
    return token


class TestPhase20BackendAPIs:
    """
    Backend API tests for Phase 20 fixes
    """
    
    def test_health_check(self):
        """Verify API is running"""
        resp = requests.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
        data = resp.json()
        assert data.get("status") in ["healthy", "ok"], f"Unexpected health status: {data.get('status')}"
        print("✅ Health check passed")
    
    def test_firm_creation_requires_auth(self):
        """Fix 6: Verify firm creation returns 401/403 without token"""
        resp = requests.post(f"{BASE_URL}/api/firms", json={"name": "Test Firm No Auth"})
        assert resp.status_code in [401, 403], f"Expected 401/403 without auth, got {resp.status_code}"
        print("✅ Firm creation correctly requires authentication")
    
    def test_firm_creation_with_auth(self, auth_token):
        """Fix 6: Verify firm creation endpoint works with valid auth token (200 or 400 if already in firm)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        firm_name = f"Test Firm Phase20 {os.urandom(4).hex()}"
        
        resp = requests.post(f"{BASE_URL}/api/firms", json={"name": firm_name}, headers=headers)
        
        # Accept either 200 (firm created) or 400 (already part of a firm)
        assert resp.status_code in [200, 400], f"Unexpected status: {resp.status_code} {resp.text}"
        
        if resp.status_code == 200:
            data = resp.json()
            assert data.get("success") is True
            assert "data" in data
            firm_data = data["data"]
            assert firm_data.get("name") == firm_name
            assert "id" in firm_data
            print(f"✅ Firm created successfully: {firm_data.get('name')} (ID: {firm_data.get('id')})")
        else:
            # 400 - Already part of a firm (valid response)
            data = resp.json()
            assert "Already part of a firm" in data.get("detail", "")
            print(f"✅ Firm creation endpoint working (advocate already in a firm - expected 400)")
    
    def test_case_deletion_flow(self, auth_token):
        """Fix 8: Verify case deletion works - Create → Delete → Verify deleted"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Step 1: Create a test case
        case_payload = {
            "caseNumber": f"TEST/PHASE20/{os.urandom(4).hex()}",
            "title": "Test Case for Deletion Phase 20",
            "caseType": "CIVIL",
            "courtName": "Test Court",
            "courtCity": "Mumbai",
            "status": "ACTIVE",
            "priority": "MEDIUM",
            "registrationDate": 1709712000000,  # Fixed timestamp
            "isActive": True
        }
        
        resp = requests.post(f"{BASE_URL}/api/cases", json=case_payload, headers=headers)
        assert resp.status_code == 200, f"Case creation failed: {resp.status_code} {resp.text}"
        
        data = resp.json()
        assert data.get("success") is True
        case_data = data["data"]
        case_id = case_data.get("id")
        assert case_id, "Case ID not returned"
        
        print(f"✅ Test case created: {case_data.get('caseNumber')} (ID: {case_id})")
        
        # Step 2: Delete the case
        resp = requests.delete(f"{BASE_URL}/api/cases/{case_id}", headers=headers)
        assert resp.status_code == 200, f"Case deletion failed: {resp.status_code} {resp.text}"
        
        data = resp.json()
        assert data.get("success") is True
        print(f"✅ Case deleted successfully: {case_id}")
        
        # Step 3: Verify case is deleted (GET should return 404)
        resp = requests.get(f"{BASE_URL}/api/cases/{case_id}", headers=headers)
        assert resp.status_code == 404, f"Expected 404 for deleted case, got {resp.status_code}"
        print(f"✅ Verified case is deleted (404 returned)")
    
    def test_profile_update_for_signup(self, auth_token):
        """Fix 1: Verify profile update works (PUT /api/auth/me) - for signup flow"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Update profile with name, barId, barCouncil (signup flow)
        profile_update = {
            "name": f"Test Advocate Phase20 {os.urandom(2).hex()}",
            "enrollmentNumber": "MH/2024/99999",
            "barCouncil": "Bar Council of Maharashtra & Goa"
        }
        
        resp = requests.put(f"{BASE_URL}/api/auth/me", json=profile_update, headers=headers)
        assert resp.status_code == 200, f"Profile update failed: {resp.status_code} {resp.text}"
        
        data = resp.json()
        assert data.get("success") is True
        updated_profile = data["data"]
        assert updated_profile.get("name") == profile_update["name"]
        assert updated_profile.get("enrollmentNumber") == profile_update["enrollmentNumber"]
        
        print(f"✅ Profile updated successfully: {updated_profile.get('name')}")
        
        # Verify GET /api/auth/me returns updated data
        resp = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["data"]["name"] == profile_update["name"]
        print(f"✅ Profile update persisted correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
