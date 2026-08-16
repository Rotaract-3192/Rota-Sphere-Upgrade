import requests
from requests.auth import HTTPBasicAuth

HOST = "db.rotaract3192.org"
BASIC_USER = "rotaract-admin"
BASIC_PASS = "Y9#M2!qR7@Lp8Xv$5NtW"
basic_auth = HTTPBasicAuth(BASIC_USER, BASIC_PASS)

r = requests.get(f"https://{HOST}/api/platform/pg-meta/default/tables?included_schemas=public", auth=basic_auth, timeout=10)
if r.status_code == 200:
    tables = [t.get("name") for t in r.json()]
    print(f"Total public tables in database: {len(tables)}")
    
    saas_tables = [
        "organizations",
        "organization_members",
        "event_categories",
        "saas_events",
        "event_speakers",
        "event_schedules",
        "event_sponsors",
        "event_custom_questions",
        "saas_ticket_tiers",
        "ticket_inventory_holds",
        "saas_coupons",
        "saas_orders",
        "saas_tickets",
        "check_in_logs",
        "ticket_transfers",
        "saas_refunds",
        "event_waitlists",
        "platform_audit_logs",
        "platform_settings",
        "platform_feature_flags"
    ]
    
    for st in saas_tables:
        status = "OK (EXISTS)" if st in tables else "MISSING"
        print(f"  [{status}] {st}")
else:
    print(f"Error fetching tables: {r.status_code}")
