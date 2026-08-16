import requests

routes = [
    ("/", 200),
    ("/events", 200),
    ("/events/rotaract-youth-leadership-conclave-2026", 200),
    ("/gallery", 200),
    ("/check-in", 200),
    ("/clubs", 200),
    ("/experiences", 200),
]

print("Verifying frontend routes...")
all_passed = True
for path, expected_status in routes:
    try:
        r = requests.get(f"http://localhost:3000{path}", timeout=5)
        status_match = "PASS" if r.status_code == expected_status else "FAIL"
        print(f"[{status_match}] {path} -> HTTP {r.status_code}")
        if r.status_code != expected_status:
            all_passed = False
    except Exception as e:
        print(f"[ERROR] {path} -> {e}")
        all_passed = False

if all_passed:
    print("\nAll frontend routes passed verification successfully!")
