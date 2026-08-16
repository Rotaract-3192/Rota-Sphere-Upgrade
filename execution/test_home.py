import requests

r = requests.get("http://localhost:3000/")
print(f"Status: {r.status_code}")
assert "DISTRICT 3192" in r.text
print("Homepage verified!")
