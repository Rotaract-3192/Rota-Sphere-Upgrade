import requests
from requests.auth import HTTPBasicAuth

SUPABASE_URL = "https://db.rotaract3192.org"
BASIC_USER = "rotaract-admin"
BASIC_PASS = "Y9#M2!qR7@Lp8Xv$5NtW"

SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

basic_auth = HTTPBasicAuth(BASIC_USER, BASIC_PASS)

print("1. Testing root endpoint with Basic Auth...")
try:
    r = requests.get(f"{SUPABASE_URL}/", auth=basic_auth, timeout=10)
    print(f"Root status: {r.status_code}")
    print(f"Root text preview: {r.text[:200]}")
except Exception as e:
    print(f"Root error: {e}")

print("\n2. Testing /rest/v1/ with Basic Auth...")
try:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/", auth=basic_auth, headers=headers, timeout=10)
    print(f"/rest/v1/ status: {r.status_code}")
    print(f"/rest/v1/ text preview: {r.text[:200]}")
except Exception as e:
    print(f"/rest/v1/ error: {e}")

print("\n3. Testing Studio / Dashboard endpoint with Basic Auth...")
try:
    r = requests.get(f"{SUPABASE_URL}/project/default", auth=basic_auth, timeout=10)
    print(f"Studio status: {r.status_code}")
except Exception as e:
    print(f"Studio error: {e}")
