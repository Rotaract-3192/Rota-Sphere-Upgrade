import requests
import json

HOST = "db.rotaract3192.org"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

print("1. Testing Kong API Gateway on http://db.rotaract3192.org:8000/rest/v1/...")
try:
    r = requests.get(f"http://{HOST}:8000/rest/v1/", headers=headers, timeout=5)
    print(f"Kong HTTP status: {r.status_code}")
    print(f"Kong HTTP tables: {list(r.json().get('definitions', {}).keys()) if r.status_code == 200 else r.text[:200]}")
except Exception as e:
    print(f"Kong HTTP error: {e}")

print("\n2. Testing Kong API Gateway on https://db.rotaract3192.org:8443/rest/v1/...")
try:
    r = requests.get(f"https://{HOST}:8443/rest/v1/", headers=headers, verify=False, timeout=5)
    print(f"Kong HTTPS status: {r.status_code}")
except Exception as e:
    print(f"Kong HTTPS error: {e}")

print("\n3. Testing querying existing tables on http://db.rotaract3192.org:8000/rest/v1/rotasphere_events...")
try:
    r = requests.get(f"http://{HOST}:8000/rest/v1/rotasphere_events?select=*&limit=1", headers=headers, timeout=5)
    print(f"rotasphere_events status: {r.status_code}")
except Exception as e:
    print(f"rotasphere_events error: {e}")
