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

print("1. Creating order for attendee in saas_orders...")
order_sql = """
INSERT INTO saas_orders (
  order_number,
  event_id,
  organization_id,
  customer_user_id,
  customer_name,
  customer_email,
  subtotal_amount,
  total_amount,
  status
) VALUES (
  'ORD-TEST-998811',
  '83b8fc2a-748d-4b15-ad25-def43dd6c54a',
  '328ed943-f625-4fec-82a0-0c92dd7ec592',
  'user_thejaswinps',
  'Thejaswin P S',
  'thejaswinps@gmail.com',
  499.00,
  499.00,
  'PAID'
)
ON CONFLICT (order_number) DO UPDATE SET status = 'PAID'
RETURNING id, order_number;
"""
st, res = run_query(order_sql)
print(f"Order Insert Status: {st}, Response: {res}")
order_id = json.loads(res)[0]["id"]

print("\n2. Issuing confirmed entry pass with QR token in saas_tickets...")
ticket_sql = f"""
INSERT INTO saas_tickets (
  ticket_code,
  order_id,
  event_id,
  ticket_tier_id,
  owner_user_id,
  attendee_name,
  attendee_email,
  qr_token,
  status
) VALUES (
  'TKT-CONF-7788',
  '{order_id}',
  '83b8fc2a-748d-4b15-ad25-def43dd6c54a',
  '62243d26-9295-4f5f-a386-a2abfeb8a26e',
  'user_thejaswinps',
  'Thejaswin P S',
  'thejaswinps@gmail.com',
  'RS-7A9B3E2F8C1D4E5A6B7C8D9E0F1A2B3C',
  'CONFIRMED'
)
ON CONFLICT (qr_token) DO UPDATE SET status = 'CONFIRMED'
RETURNING id, ticket_code, qr_token, status;
"""
st, res = run_query(ticket_sql)
print(f"Ticket Issue Status: {st}, Response: {res}")

print("\n3. Testing Check-in Validation on scanner endpoint...")
checkin_sql = """
UPDATE saas_tickets
SET status = 'USED', checked_in_at = NOW(), checked_in_gate = 'Main Gate'
WHERE qr_token = 'RS-7A9B3E2F8C1D4E5A6B7C8D9E0F1A2B3C' AND status = 'CONFIRMED'
RETURNING id, attendee_name, status, checked_in_at;
"""
st, res = run_query(checkin_sql)
print(f"Check-in Status: {st}, Response: {res}")
