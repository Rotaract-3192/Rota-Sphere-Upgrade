import jwt
import requests
import time

JWT_SECRET = "9ea8ff2057430ac5ddf8a2bbd9be60ce5a577d45c64cacf41b7ba2c38eaa828b"
HOST = "db.rotaract3192.org"

# 1. Generate anon token
anon_payload = {
    "role": "anon",
    "iss": "supabase",
    "iat": int(time.time()),
    "exp": int(time.time()) + 60 * 60 * 24 * 365 * 10 # 10 years
}
anon_key = jwt.encode(anon_payload, JWT_SECRET, algorithm="HS256")

# 2. Generate service_role token
service_payload = {
    "role": "service_role",
    "iss": "supabase",
    "iat": int(time.time()),
    "exp": int(time.time()) + 60 * 60 * 24 * 365 * 10 # 10 years
}
service_role_key = jwt.encode(service_payload, JWT_SECRET, algorithm="HS256")

print(f"Generated anon_key:\n{anon_key}\n")
print(f"Generated service_role_key:\n{service_role_key}\n")

# 3. Test Kong Gateway with the generated service_role_key
headers = {
    "apikey": service_role_key,
    "Authorization": f"Bearer {service_role_key}",
    "Content-Type": "application/json"
}

print("Testing PostgREST query on http://db.rotaract3192.org:8000/rest/v1/...")
try:
    r = requests.get(f"http://{HOST}:8000/rest/v1/", headers=headers, timeout=5)
    print(f"REST root status: {r.status_code}")
    if r.status_code == 200:
        defs = r.json().get("definitions", {})
        print(f"Available tables in database ({len(defs)} tables):")
        for table in defs.keys():
            print(f" - {table}")
    else:
        print(f"REST response: {r.text}")
except Exception as e:
    print(f"Query error: {e}")
