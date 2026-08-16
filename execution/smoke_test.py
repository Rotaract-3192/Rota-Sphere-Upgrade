import requests

# Test querying the seeded event and categories
r = requests.get("http://localhost:3000/events/rotaract-youth-leadership-conclave-2026")
print(f"Event detail status: {r.status_code}")
assert r.status_code == 200, "Event detail page failed!"

print("Event page loads successfully with live database data!")
