
import psycopg2
from psycopg2 import sql

def fix_permissions():
    try:
        # Try both ports 5432 and 5433
        ports = ["5433", "5432"]
        conn = None
        current_port = None
        
        for port in ports:
            try:
                print(f"Attempting to connect to port {port}...")
                conn = psycopg2.connect(
                    dbname="pulse_db",
                    user="pulse",
                    password="pulse_password",
                    host="localhost",
                    port=port
                )
                current_port = port
                print(f"Connected successfully to port {port}")
                break
            except Exception as e:
                print(f"Failed to connect to port {port}: {e}")
        
        if not conn:
            print("Could not connect to any port.")
            return

        conn.autocommit = True
        cur = conn.cursor()

        # Grant permissions
        commands = [
            "GRANT ALL PRIVILEGES ON SCHEMA public TO pulse",
            "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pulse",
            "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pulse",
            "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pulse",
            "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pulse",
        ]

        for cmd in commands:
            try:
                print(f"Executing: {cmd}")
                cur.execute(cmd)
            except Exception as e:
                print(f"Command failed: {cmd}. Error: {e}")

        # Try to change owner of public schema
        try:
            print("Attempting to change owner of schema public to pulse...")
            cur.execute("ALTER SCHEMA public OWNER TO pulse")
        except Exception as e:
            print(f"Failed to change owner: {e}")
        
        print(f"Permissions fix attempted on port {current_port}!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_permissions()
