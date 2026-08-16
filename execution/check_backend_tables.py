import requests
from requests.auth import HTTPBasicAuth
import json

HOST = "db.rotaract3192.org"
BASIC_USER = "rotaract-admin"
BASIC_PASS = "Y9#M2!qR7@Lp8Xv$5NtW"
basic_auth = HTTPBasicAuth(BASIC_USER, BASIC_PASS)

print("Checking backend database tables via Studio API on https://db.rotaract3192.org...")

# Check table list from Studio pg-meta API or internal endpoints
endpoints = [
    "/api/pg-meta/default/tables?included_schemas=public",
    "/api/platform/projects/default/tables",
    "/api/projects/default/tables",
    "/api/pg-meta/default/query",
]

for ep in endpoints:
    try:
        r = requests.get(f"https://{HOST}{ep}", auth=basic_auth, timeout=5)
        print(f"{ep} -> HTTP {r.status_code}")
        if r.status_code == 200:
            tables = r.json()
            if isinstance(tables, list):
                print(f"Found {len(tables)} tables in database:")
                for t in tables:
                    name = t.get("name") if isinstance(t, dict) else str(t)
                    print(f"  • {name}")
            else:
                print(json.dumps(tables, indent=2)[:400])
            break
    except Exception as e:
        print(f"{ep} error: {e}")
