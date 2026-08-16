import psycopg2
import sys

HOST = "db.rotaract3192.org"
PORT = 5432
DBNAME = "postgres"

passwords_to_try = [
    "Y9#M2!qR7@Lp8Xv$5NtW",
    "postgres",
    "rotaract-admin",
    "9ea8ff2057430ac5ddf8a2bbd9be60ce5a577d45c64cacf41b7ba2c38eaa828b"
]

users_to_try = ["postgres", "rotaract-admin", "supabase_admin"]

print("Testing direct PostgreSQL connection to db.rotaract3192.org:5432...")

for user in users_to_try:
    for pwd in passwords_to_try:
        try:
            conn = psycopg2.connect(
                host=HOST,
                port=PORT,
                dbname=DBNAME,
                user=user,
                password=pwd,
                connect_timeout=3
            )
            print(f"SUCCESS! Connected with user '{user}' and password '{pwd[:4]}***'")
            
            cur = conn.cursor()
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
            tables = cur.fetchall()
            print(f"Existing public tables ({len(tables)}):")
            for t in tables:
                print(f" - {t[0]}")
            
            conn.close()
            sys.exit(0)
        except Exception as e:
            # print(f"Failed user={user}, pass={pwd[:4]}***: {e}")
            pass

print("Could not connect with tested credentials.")
