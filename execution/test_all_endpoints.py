import requests

print("Testing Next.js Server Actions & Pages...")

# Test 1: Fetch Events Discovery Page
r_events = requests.get("http://localhost:3000/events", timeout=5)
print(f"1. /events Status: {r_events.status_code}")

# Test 2: Fetch Event Detail Page
r_detail = requests.get("http://localhost:3000/events/rotaract-youth-leadership-conclave-2026", timeout=5)
print(f"2. /events/[slug] Status: {r_detail.status_code}")

# Test 3: Fetch Dashboard Page
r_dash = requests.get("http://localhost:3000/dashboard", timeout=5)
print(f"3. /dashboard Status: {r_dash.status_code}")

# Test 4: Fetch Admin Page
r_admin = requests.get("http://localhost:3000/admin", timeout=5)
print(f"4. /admin Status: {r_admin.status_code}")

# Test 5: Fetch Check-in Scanner Page
r_checkin = requests.get("http://localhost:3000/check-in", timeout=5)
print(f"5. /check-in Status: {r_checkin.status_code}")

print("\nAll endpoints tested!")
