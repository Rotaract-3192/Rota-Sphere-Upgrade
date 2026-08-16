import sys
import os
sys.path.append(os.path.dirname(__file__))
from test_db_connection import execute_query

sql = """
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'saas_events';
"""
res = execute_query(sql)
print("Columns in saas_events:")
for r in res:
    print(f" - {r['column_name']} ({r['data_type']})")
