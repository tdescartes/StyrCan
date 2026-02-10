"""Test company settings update endpoint."""
import requests
import json

BASE_URL = "http://localhost:8000"

# First, let's try to login to get a token
print("1. Testing login...")
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "email": "tuyishime.descartes@outlook.com",
        "password": "Integrity@1234"
    }
)

print(f"Login status: {login_response.status_code}")
if login_response.status_code == 200:
    data = login_response.json()
    token = data["access_token"]
    print(f"Login successful! Token: {token[:20]}...")
    
    # Get current company settings
    print("\n2. Getting current company settings...")
    headers = {"Authorization": f"Bearer {token}"}
    get_response = requests.get(
        f"{BASE_URL}/api/settings/company",
        headers=headers
    )
    print(f"Get company status: {get_response.status_code}")
    print(f"Response: {get_response.text}")
    
    if get_response.status_code == 200:
        company_data = get_response.json()
        print(f"Current company: {json.dumps(company_data, indent=2)}")
        
        # Update company settings
        print("\n3. Updating company settings...")
        update_data = {
            "name": company_data["name"],
            "phone": "123-456-7890",
            "address": "123 Test Street"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/settings/company",
            headers=headers,
            json=update_data
        )
        print(f"Update status: {update_response.status_code}")
        print(f"Response: {update_response.text}")
else:
    print(f"Login failed: {login_response.text}")
