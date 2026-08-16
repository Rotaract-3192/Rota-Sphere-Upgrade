import requests
from requests.auth import HTTPBasicAuth

HOST = "db.rotaract3192.org"
BASIC_USER = "rotaract-admin"
BASIC_PASS = "Y9#M2!qR7@Lp8Xv$5NtW"
basic_auth = HTTPBasicAuth(BASIC_USER, BASIC_PASS)

routes = [
    "/api/platform/pg-meta/default/tables",
    "/api/platform/pg-meta/default/schemas",
    "/api/pg/default/tables",
    "/api/meta/default/tables",
    "/api/pg-meta/tables",
    "/api/database/tables",
    "/api/projects/default/tables",
    "/api/props/project/default/tables"
]

for r_url in routes:
    try:
        res = requests.get(f"https://{HOST}{r_url}", auth=basic_auth, timeout=3)
        if res.status_code != 404:
            print(f"{r_url} -> {res.status_code} ({res.text[:150]})")
    except Exception as e:
        pass
