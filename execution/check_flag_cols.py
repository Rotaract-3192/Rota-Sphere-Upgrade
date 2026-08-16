import requests
import base64

auth_str = "rotaract-admin:Y9#M2!qR7@Lp8Xv$5NtW"
auth_header = "Basic " + base64.b64encode(auth_str.encode()).decode()

def run_sql(sql):
    url = "https://db.rotaract3192.org/api/platform/pg-meta/default/query"
    r = requests.post(url, json={"query": sql}, headers={"Authorization": auth_header, "Content-Type": "application/json"})
    if r.status_code != 200:
        print(f"Error {r.status_code}: {r.text}")
        return None
    return r.json()

print("platform_audit_logs cols:")
cols1 = run_sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='platform_audit_logs';")
for c in cols1:
    print(f" - {c['column_name']} ({c['data_type']})")

print("\nplatform_feature_flags cols:")
cols2 = run_sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='platform_feature_flags';")
for c in cols2:
    print(f" - {c['column_name']} ({c['data_type']})")

print("\nSample feature flags:")
print(run_sql("SELECT * FROM platform_feature_flags;"))
