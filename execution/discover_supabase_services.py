import requests
from requests.auth import HTTPBasicAuth
import socket

HOST = "db.rotaract3192.org"
BASIC_USER = "rotaract-admin"
BASIC_PASS = "Y9#M2!qR7@Lp8Xv$5NtW"
basic_auth = HTTPBasicAuth(BASIC_USER, BASIC_PASS)

print(f"Resolving {HOST}...")
try:
    ip = socket.gethostbyname(HOST)
    print(f"IP address: {ip}")
except Exception as e:
    print(f"DNS error: {e}")

# Check common Supabase ports
ports = [80, 443, 8000, 8443, 5432, 6543, 54321, 54322, 54323, 3000, 8080]
for p in ports:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2.0)
    result = sock.connect_ex((HOST, p))
    status = "OPEN" if result == 0 else "CLOSED/FILTERED"
    print(f"Port {p}: {status}")
    sock.close()

# Test Studio API paths
studio_paths = [
    "/api/pg-meta/default/query",
    "/api/projects/default/types/typescript",
    "/api/platform/projects/default/config",
    "/api/pg-meta/default/tables",
    "/api/pg-meta/default/schemas",
]

for path in studio_paths:
    try:
        r = requests.get(f"https://{HOST}{path}", auth=basic_auth, timeout=5)
        print(f"Studio API {path}: status {r.status_code}")
    except Exception as e:
        print(f"Studio API {path} error: {e}")
