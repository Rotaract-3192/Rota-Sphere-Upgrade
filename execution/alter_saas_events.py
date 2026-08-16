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

# 1. Add deleted_at column if not exists
alter_sql = """
ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
"""
print("Running ALTER TABLE...")
res = run_sql(alter_sql)
print("Result:", res)

# 2. Check columns
cols_sql = """
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'saas_events';
"""
cols = run_sql(cols_sql)
print("\nsaas_events columns:")
for c in cols:
    print(f" - {c['column_name']} ({c['data_type']})")
