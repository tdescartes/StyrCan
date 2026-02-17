
import psycopg2
from psycopg2 import sql

def fix_permissions():
    try:
        # Connect as superuser (postgres)
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="postgres_password",
            host="localhost",
            port="5433"
        )
        conn.autocommit = True
        cur = conn.cursor()

        # Connect to the target database
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'pulse_db'")
        if not cur.fetchone():
            print("Database pulse_db does not exist yet. Creating it...")
            cur.execute("CREATE DATABASE pulse_db")
        
        conn.close()

        # Connect to pulse_db as pulse user (who is the owner/superuser in the container)
        conn = psycopg2.connect(
            dbname="pulse_db",
            user="pulse",
            password="pulse_password",
            host="localhost",
            port="5433" # Using 5433 as per .env
        )
        conn.autocommit = True
        cur = conn.cursor()

        # Create user if it doesn't exist
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = 'pulse'")
        if not cur.fetchone():
            print("User pulse does not exist. Creating it...")
            cur.execute("CREATE USER pulse WITH PASSWORD 'pulse_password'")

        # Grant permissions
        commands = [
            "GRANT ALL PRIVILEGES ON DATABASE pulse_db TO pulse",
            "GRANT ALL PRIVILEGES ON SCHEMA public TO pulse",
            "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pulse",
            "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pulse",
            "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pulse",
            "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pulse",
        ]

        for cmd in commands:
            print(f"Executing: {cmd}")
            cur.execute(cmd)

        # Specifically for RDS/Managed DBs, but good practice here too
        cur.execute("ALTER SCHEMA public OWNER TO pulse")
        
        print("Permissions fixed successfully!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_permissions()
