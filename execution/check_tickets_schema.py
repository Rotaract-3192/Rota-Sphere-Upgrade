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

cols_sql = """
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'saas_tickets';
"""
cols = run_sql(cols_sql)
print("\nsaas_tickets columns:")
for c in cols:
    print(f" - {c['column_name']} ({c['data_type']})")

# Also check rotasphere_tickets or tickets
print("\nCheck all ticket-related tables:")
tables = run_sql("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%ticket%';")
print(tables)
