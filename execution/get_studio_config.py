import requests
from requests.auth import HTTPBasicAuth
import json

HOST = "db.rotaract3192.org"
BASIC_USER = "rotaract-admin"
BASIC_PASS = "Y9#M2!qR7@Lp8Xv$5NtW"
basic_auth = HTTPBasicAuth(BASIC_USER, BASIC_PASS)

print("Fetching Studio platform config from https://db.rotaract3192.org/api/platform/projects/default/config...")
try:
    r = requests.get(f"https://{HOST}/api/platform/projects/default/config", auth=basic_auth, timeout=10)
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
