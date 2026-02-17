
import psycopg2

def check_tables():
    try:
        conn = psycopg2.connect(
            dbname="pulse_db",
            user="pulse",
            password="pulse_password",
            host="localhost",
            port="5433"
        )
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = cur.fetchall()
        print("Tables found:")
        for table in tables:
            print(f"- {table[0]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tables()
