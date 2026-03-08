"""
Phase 21 - Full LawFlow Backend API Tests

Test coverage:
- Health check
- Auth: send-otp, verify-otp
- Cases CRUD
- Clients CRUD
- Calendar hearings
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not set")

PHONE = "9876543210"
OTP = "123456"

@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for test user"""
    # Send OTP
    r1 = requests.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": PHONE})
    assert r1.status_code == 200, f"send-otp failed: {r1.text}"
    # Verify OTP
    r2 = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": PHONE, "otp": OTP})
    assert r2.status_code == 200, f"verify-otp failed: {r2.text}"
    data = r2.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"No token in response: {data}"
    return token

@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# Health Check
def test_health_check():
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    print(f"Health: {r.json()}")

# Auth Tests
def test_send_otp():
    r = requests.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": PHONE})
    assert r.status_code == 200
    data = r.json()
    print(f"Send OTP response: {data}")

def test_verify_otp():
    r = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": PHONE, "otp": OTP})
    assert r.status_code == 200
    data = r.json()
    assert "token" in data or "access_token" in data
    print(f"Verify OTP: token present={bool(data.get('token') or data.get('access_token'))}")

def test_get_profile(headers):
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    assert r.status_code == 200
    data = r.json()
    # Response is wrapped: {"success": True, "data": {...}}
    advocate = data.get("data") or data
    assert "phone" in advocate or "name" in advocate
    print(f"Profile: {advocate}")

# Cases Tests
def test_get_cases(headers):
    r = requests.get(f"{BASE_URL}/api/cases", headers=headers)
    assert r.status_code == 200
    data = r.json()
    # Response may be wrapped: {"success": True, "data": [...]}
    cases = data.get("data") if isinstance(data, dict) else data
    assert isinstance(cases, list)
    print(f"Cases count: {len(cases)}")

def test_create_and_delete_case(headers):
    payload = {
        "title": "TEST_Case_Phase21",
        "caseNumber": "TEST/2025/001",
        "caseType": "Civil",
        "courtName": "High Court",
        "clientName": "Test Client",
        "status": "Active"
    }
    r = requests.post(f"{BASE_URL}/api/cases", json=payload, headers=headers)
    assert r.status_code in [200, 201], f"Create case failed: {r.text}"
    data = r.json()
    case_data = data.get("data") if isinstance(data, dict) and "data" in data else data
    case_id = case_data.get("id") or case_data.get("_id")
    assert case_id
    print(f"Created case: {case_id}")
    # Delete
    rd = requests.delete(f"{BASE_URL}/api/cases/{case_id}", headers=headers)
    assert rd.status_code == 200
    print(f"Deleted case: {case_id}")

# Clients Tests
def test_get_clients(headers):
    r = requests.get(f"{BASE_URL}/api/clients", headers=headers)
    assert r.status_code == 200
    data = r.json()
    clients = data.get("data") if isinstance(data, dict) else data
    assert isinstance(clients, list)
    print(f"Clients count: {len(clients)}")

def test_create_and_delete_client(headers):
    payload = {
        "name": "TEST_Client_Phase21",
        "phone": "9999999999",
        "email": "testclient@example.com"
    }
    r = requests.post(f"{BASE_URL}/api/clients", json=payload, headers=headers)
    assert r.status_code in [200, 201], f"Create client failed: {r.text}"
    data = r.json()
    client_data = data.get("data") if isinstance(data, dict) and "data" in data else data
    client_id = client_data.get("id") or client_data.get("_id")
    assert client_id, f"No client_id in: {data}"
    print(f"Created client: {client_id}")
    # Delete
    rd = requests.delete(f"{BASE_URL}/api/clients/{client_id}", headers=headers)
    assert rd.status_code in [200, 204]
    print(f"Deleted client: {client_id}")

# Dashboard/Hearings
def test_get_hearings(headers):
    r = requests.get(f"{BASE_URL}/api/hearings", headers=headers)
    assert r.status_code == 200
    data = r.json()
    hearings = data.get("data") if isinstance(data, dict) else data
    assert isinstance(hearings, list)
    print(f"Hearings count: {len(hearings)}")
