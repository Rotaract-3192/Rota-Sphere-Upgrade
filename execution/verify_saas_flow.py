import requests
from requests.auth import HTTPBasicAuth
import json

HOST = "db.rotaract3192.org"
BASIC_USER = "rotaract-admin"
BASIC_PASS = "Y9#M2!qR7@Lp8Xv$5NtW"
basic_auth = HTTPBasicAuth(BASIC_USER, BASIC_PASS)

def run_query(sql):
    resp = requests.post(
        f"https://{HOST}/api/platform/pg-meta/default/query",
        auth=basic_auth,
        headers={"Content-Type": "application/json"},
        json={"query": sql},
        timeout=10
    )
    return resp.status_code, resp.text

print("1. Testing Organization insert...")
sql_org = """
INSERT INTO organizations (name, slug, support_email, city, kyc_status, is_verified)
VALUES ('District 3192 Hub', 'district-3192-hub', 'thejaswinps@gmail.com', 'Bengaluru', 'VERIFIED', TRUE)
ON CONFLICT (slug) DO UPDATE SET is_verified = TRUE
RETURNING id;
"""
st, res = run_query(sql_org)
print(f"Org Query Status: {st}, Response: {res[:200]}")

print("\n2. Testing Categories...")
st, res = run_query("SELECT id, name, slug FROM event_categories LIMIT 5;")
print(f"Categories Status: {st}, Response: {res}")

print("\n3. Testing Feature Flags...")
st, res = run_query("SELECT id, name, is_enabled FROM platform_feature_flags;")
print(f"Feature Flags Status: {st}, Response: {res}")

print("\n4. Testing Audit Logs table...")
st, res = run_query("SELECT COUNT(*) FROM platform_audit_logs;")
print(f"Audit Logs count status: {st}, Response: {res}")
