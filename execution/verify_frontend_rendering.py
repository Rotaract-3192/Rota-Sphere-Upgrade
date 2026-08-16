import requests

print("1. Testing Next.js Discovery API & Page http://localhost:3000/events...")
try:
    r = requests.get("http://localhost:3000/events", timeout=10)
    print(f"Discovery status: {r.status_code}")
    print(f"Has Event Title: {'Rotaract Youth Leadership Conclave 2026' in r.text}")
except Exception as e:
    print(f"Discovery error: {e}")

print("\n2. Testing Next.js Event Detail Page http://localhost:3000/events/rotaract-youth-leadership-conclave-2026...")
try:
    r = requests.get("http://localhost:3000/events/rotaract-youth-leadership-conclave-2026", timeout=10)
    print(f"Event Detail status: {r.status_code}")
    print(f"Has Speakers: {'Dr. Ananya Rao' in r.text}")
    print(f"Has Ticket Tier: {'Early Bird Delegate Pass' in r.text}")
except Exception as e:
    print(f"Detail error: {e}")
