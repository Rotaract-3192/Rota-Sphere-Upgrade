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

tickets = run_sql("SELECT id, ticket_code, event_id, attendee_name, qr_token, status FROM saas_tickets LIMIT 10;")
print("saas_tickets rows:", tickets)
