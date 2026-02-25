"""Quick connectivity test before starting backend."""
import sys
import os

# Test 1: Read .env
print("=== Reading .env ===")
env_path = os.path.join(os.path.dirname(__file__), '.env')
with open(env_path) as f:
    for line in f:
        if line.strip() and not line.startswith('#'):
            print(line.rstrip())

# Test 2: psycopg2
print("\n=== Testing PostgreSQL ===")
try:
    import psycopg2
    conn = psycopg2.connect('postgresql://pulse:pulse_password@localhost:5433/pulse_db')
    cur = conn.cursor()
    cur.execute('SELECT current_user, version()')
    row = cur.fetchone()
    print(f"Connected! user={row[0]}, version={row[1][:40]}")
    conn.close()
    print("PostgreSQL OK on port 5433")
except Exception as e:
    print(f"PostgreSQL FAILED: {e}")
    # Try port 5432
    try:
        conn = psycopg2.connect('postgresql://pulse:pulse_password@localhost:5432/pulse_db')
        cur = conn.cursor()
        cur.execute('SELECT current_user, version()')
        row = cur.fetchone()
        print(f"Connected on port 5432! user={row[0]}")
        conn.close()
        print("PostgreSQL OK on port 5432")
    except Exception as e2:
        print(f"PostgreSQL port 5432 also FAILED: {e2}")

print("\n=== Done ===")
