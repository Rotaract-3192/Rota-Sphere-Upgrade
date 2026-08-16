import requests
from requests.auth import HTTPBasicAuth
import json

HOST = "db.rotaract3192.org"
BASIC_USER = "rotaract-admin"
BASIC_PASS = "Y9#M2!qR7@Lp8Xv$5NtW"
basic_auth = HTTPBasicAuth(BASIC_USER, BASIC_PASS)

endpoints = [
    "/api/platform/projects/default/api-keys",
    "/api/projects/default/api-keys",
    "/api/props/project/default/settings",
    "/api/props/project/default/api",
    "/api/platform/projects/default/settings",
    "/api/platform/projects/default/env",
]

for ep in endpoints:
    try:
        r = requests.get(f"https://{HOST}{ep}", auth=basic_auth, timeout=5)
        print(f"Endpoint {ep}: status {r.status_code}")
        if r.status_code == 200:
            print(json.dumps(r.json(), indent=2)[:500])
    except Exception as e:
        print(f"Endpoint {ep} error: {e}")
