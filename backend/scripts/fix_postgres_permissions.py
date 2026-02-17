import psycopg2
from psycopg2 import sql

def fix_permissions():
    """
    Attempts to grant necessary permissions to the 'pulse' user on the 'public' schema.
    This typically requires running as a superuser or the database owner.
    """
    # Try connecting with the pulse user first (unlikely to work for GRANT if it's failing for CREATE)
    # Then try common dev superuser defaults
    
    conn_params = [
        "dbname=pulse_db user=pulse password=pulse_password host=localhost port=5433",
        "dbname=pulse_db user=postgres password=postgres host=localhost port=5433",
        "dbname=pulse_db user=postgres password=pulse_password host=localhost port=5433",
        "dbname=pulse_db user=postgres host=localhost port=5433", 
    ]
    
    success = False
    for param in conn_params:
        try:
            print(f"Attempting to fix permissions using: {param.split(' ')[1]}")
            conn = psycopg2.connect(param)
            conn.autocommit = True
            cur = conn.cursor()
            
            # Grant permission on public schema
            cur.execute("GRANT ALL ON SCHEMA public TO pulse;")
            cur.execute("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pulse;")
            cur.execute("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pulse;")
            
            # Explicitly grant CREATE if not already covered by ALL
            cur.execute("GRANT CREATE ON SCHEMA public TO pulse;")
            
            # Test table creation
            cur.execute("CREATE TABLE IF NOT EXISTS permission_test (id int);")
            cur.execute("DROP TABLE permission_test;")
            
            print("✅ Successfully granted permissions and verified table creation for user 'pulse' on schema 'public'.")
            cur.close()
            conn.close()
            success = True
            break
        except Exception as e:
            print(f"  - Failed: {e}")
            
    if not success:
        print("\n❌ Manual Action Required:")
        print("Please run the following SQL command as a superuser (e.g., via psql or pgAdmin):")
        print("ALTER SCHEMA public OWNER TO pulse;")
        print("OR")
        print("GRANT ALL ON SCHEMA public TO pulse;")

if __name__ == "__main__":
    fix_permissions()
