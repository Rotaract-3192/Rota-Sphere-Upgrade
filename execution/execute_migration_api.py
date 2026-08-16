import requests
from requests.auth import HTTPBasicAuth
import json

HOST = "db.rotaract3192.org"
BASIC_USER = "rotaract-admin"
BASIC_PASS = "Y9#M2!qR7@Lp8Xv$5NtW"
basic_auth = HTTPBasicAuth(BASIC_USER, BASIC_PASS)

print("1. Fetching all existing public tables from database...")
r = requests.get(f"https://{HOST}/api/platform/pg-meta/default/tables?included_schemas=public", auth=basic_auth, timeout=10)
if r.status_code == 200:
    tables = r.json()
    print(f"Total tables found: {len(tables)}")
    table_names = [t.get("name") for t in tables]
    for name in sorted(table_names):
        print(f"  • {name}")
else:
    print(f"Failed to fetch tables: {r.status_code} {r.text}")

print("\n2. Executing SaaS Migration via pg-meta query API...")
with open("supabase/migrations/0006_saas_multi_tenant_schema.sql", "r", encoding="utf-8") as f:
    sql_content = f.read()

# PostgREST query execution
query_resp = requests.post(
    f"https://{HOST}/api/platform/pg-meta/default/query",
    auth=basic_auth,
    headers={"Content-Type": "application/json"},
    json={"query": sql_content},
    timeout=30
)

print(f"Migration Query Status: {query_resp.status_code}")
if query_resp.status_code in [200, 201]:
    print("🎉 SUCCESS! SaaS database schema migration applied successfully!")
else:
    print(f"Query Response: {query_resp.text}")

print("\n3. Verifying updated tables list...")
r_after = requests.get(f"https://{HOST}/api/platform/pg-meta/default/tables?included_schemas=public", auth=basic_auth, timeout=10)
if r_after.status_code == 200:
    updated_tables = [t.get("name") for t in r_after.json()]
    print(f"Total tables now: {len(updated_tables)}")
    saas_tables = ["organizations", "organization_members", "saas_events", "saas_ticket_tiers", "saas_orders", "saas_tickets", "check_in_logs", "ticket_transfers", "platform_audit_logs", "platform_feature_flags"]
    for st in saas_tables:
        exists = "✅ EXISTS" if st in updated_tables else "❌ MISSING"
        print(f"  {exists}: {st}")
