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

print("1. Creating a live test event in saas_events...")
sql_event = """
INSERT INTO saas_events (
  organization_id,
  organizer_id,
  title,
  slug,
  summary,
  description,
  cover_image_url,
  event_type,
  venue_name,
  city,
  start_date,
  end_date,
  capacity,
  status,
  is_featured
) VALUES (
  '328ed943-f625-4fec-82a0-0c92dd7ec592',
  'user_thejaswinps',
  'Rotaract Youth Leadership Conclave 2026',
  'rotaract-youth-leadership-conclave-2026',
  'District 3192 Flagship Leadership Summit & Networking Gala',
  'Join 250+ passionate youth leaders, entrepreneurs, and changemakers across District 3192 for two days of transformative keynote sessions, masterclasses, and networking.',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
  'OFFLINE',
  'NIMHANS Convention Centre, Hosur Road',
  'Bengaluru',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '16 days',
  250,
  'PUBLISHED',
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET is_featured = TRUE
RETURNING id, title, slug;
"""

st, res = run_query(sql_event)
print(f"Event Insert Status: {st}, Response: {res}")
event_id = json.loads(res)[0]["id"]

print("\n2. Creating ticket tiers for the event...")
sql_tiers = f"""
INSERT INTO saas_ticket_tiers (
  event_id,
  name,
  description,
  tier_type,
  price,
  total_capacity,
  sold_count,
  reserved_count,
  sales_end,
  benefits
) VALUES
  ('{event_id}', 'Early Bird Delegate Pass', 'Full 2-day access including delegate kit and lunch', 'EARLY_BIRD', 499.00, 100, 0, 0, NOW() + INTERVAL '10 days', '["Access to all keynote sessions", "Delegate Kit & Badge", "Networking Lunch"]'::jsonb),
  ('{event_id}', 'VIP Access & Gala Pass', 'VIP seating, speaker lounge access, and Gala Dinner', 'VIP', 1299.00, 50, 0, 0, NOW() + INTERVAL '14 days', '["Front Row VIP Seating", "Speaker Lounge Access", "Gala Networking Dinner"]'::jsonb)
RETURNING id, name, price;
"""
st, res = run_query(sql_tiers)
print(f"Tiers Insert Status: {st}, Response: {res}")

print("\n3. Creating Featured Speakers...")
sql_speakers = f"""
INSERT INTO event_speakers (event_id, name, role_title, organization, avatar_url, bio, display_order)
VALUES
  ('{event_id}', 'Dr. Ananya Rao', 'District Governor', 'Rotary International Dist 3192', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80', 'Keynote speaker on Youth Leadership and Global Service.', 1),
  ('{event_id}', 'Rohan Sen', 'Founder & CEO', 'ImpactSphere Labs', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', 'Leading technologist and Rotaract Alum speaking on AI for Good.', 2)
RETURNING id, name;
"""
st, res = run_query(sql_speakers)
print(f"Speakers Insert Status: {st}, Response: {res}")
