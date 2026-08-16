import requests
from requests.auth import HTTPBasicAuth

url = "https://rotaract-admin:Y9%23M2%21qR7%40Lp8Xv%245NtW@db.rotaract3192.org/api/platform/pg-meta/default/tables"

print(f"Testing URL with embedded credentials: {url[:35]}...")
try:
    r = requests.get(url, timeout=5)
    print(f"Status: {r.status_code}")
except Exception as e:
    print(f"Error: {e}")
