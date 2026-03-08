"""
Phase 18B - Create test data for testing PDF print buttons
Creates: 1 client + 1 case + 1 hearing
"""
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    print("ERROR: EXPO_PUBLIC_BACKEND_URL not set")
    exit(1)

def test_create_test_data_for_print_buttons():
    """Create test client, case and hearing to test print buttons"""
    
    # Step 1: Login to get auth token
    print("\n1. Login with test credentials...")
    login_resp = requests.post(f"{BASE_URL}/api/auth/request-otp", json={
        "phone": "9876543210"
    })
    assert login_resp.status_code == 200, f"Request OTP failed: {login_resp.text}"
    print("   ✓ OTP requested")
    
    verify_resp = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
        "phone": "9876543210",
        "otp": "123456"
    })
    assert verify_resp.status_code == 200, f"Verify OTP failed: {verify_resp.text}"
    data = verify_resp.json()
    token = data.get('token')
    advocate_id = data.get('user', {}).get('id')
    assert token, "No auth token returned"
    print(f"   ✓ Logged in, advocate_id: {advocate_id}")
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Step 2: Create test client
    print("\n2. Creating test client...")
    client_payload = {
        "name": "TEST_Phase18B_Client",
        "phone": "9900000018",
        "email": "test18b@lawflow.test",
        "clientType": "INDIVIDUAL",
        "city": "Mumbai",
        "whatsappOptIn": True,
        "smsOptIn": True,
    }
    client_resp = requests.post(f"{BASE_URL}/api/clients", json=client_payload, headers=headers)
    assert client_resp.status_code in [200, 201], f"Create client failed: {client_resp.text}"
    client = client_resp.json()
    client_id = client.get('id') or client.get('_id')
    assert client_id, "No client ID returned"
    print(f"   ✓ Client created: {client['name']} (ID: {client_id})")
    
    # Step 3: Create test case
    print("\n3. Creating test case...")
    case_payload = {
        "caseNumber": "TEST/018B/2026",
        "title": "Test Case for Print Button Verification",
        "courtName": "District Court Mumbai",
        "courtCity": "Mumbai",
        "caseType": "CIVIL",
        "status": "ACTIVE",
        "priority": "MEDIUM",
        "clientId": client_id,
        "clientName": "TEST_Phase18B_Client",
        "plaintiffPetitioner": "TEST_Phase18B_Client",
        "defendant": "State of Maharashtra",
        "filingDate": 1709654400000,  # March 2024
        "nextHearingDate": 1741276800000,  # March 2025
    }
    case_resp = requests.post(f"{BASE_URL}/api/cases", json=case_payload, headers=headers)
    assert case_resp.status_code in [200, 201], f"Create case failed: {case_resp.text}"
    case = case_resp.json()
    case_id = case.get('id') or case.get('_id')
    assert case_id, "No case ID returned"
    print(f"   ✓ Case created: {case['caseNumber']} (ID: {case_id})")
    
    # Step 4: Create test hearing
    print("\n4. Creating test hearing...")
    hearing_payload = {
        "caseId": case_id,
        "hearingDate": 1741276800000,  # March 2025
        "hearingTime": "10:30 AM",
        "courtRoom": "Court Room 3",
        "purpose": "Arguments on Application",
        "outcome": "ADJOURNED",
        "notes": "Test hearing for Phase 18B print button verification",
    }
    hearing_resp = requests.post(f"{BASE_URL}/api/hearings", json=hearing_payload, headers=headers)
    assert hearing_resp.status_code in [200, 201], f"Create hearing failed: {hearing_resp.text}"
    hearing = hearing_resp.json()
    hearing_id = hearing.get('id') or hearing.get('_id')
    print(f"   ✓ Hearing created (ID: {hearing_id})")
    
    print("\n✅ TEST DATA CREATED SUCCESSFULLY")
    print("=" * 60)
    print(f"Client: {client['name']} (phone: {client['phone']})")
    print(f"Case: {case['caseNumber']}")
    print(f"Hearing: {hearing_payload['hearingTime']} on {hearing_payload['purpose']}")
    print("=" * 60)
    print("\nYou can now test:")
    print("  - Case Detail print button (testID='print-case-btn')")
    print("  - Client Detail print button (testID='print-client-btn')")
    print("  - Hearing History print button (testID='print-hearing-history-btn')")

if __name__ == "__main__":
    test_create_test_data_for_print_buttons()
