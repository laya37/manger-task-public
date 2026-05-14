# db.py - Connects to PostgreSQL and creates all tables

import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()  # Load values from .env file

# ─────────────────────────────────────────
# Get a database connection
# ─────────────────────────────────────────
def get_connection():
    conn = psycopg2.connect(
        os.getenv("DATABASE_URL"),
        sslmode="require"  # Required for cloud databases like Neon
    )
    return conn


# ─────────────────────────────────────────
# Run a query and return results
# ─────────────────────────────────────────
def query(sql, params=None, fetch=True):
    conn = get_connection()
    # DictCursor lets us access rows like dictionaries (row["name"])
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(sql, params or ())
    
    result = None
    if fetch:
        result = cur.fetchall()  # Get all rows
    
    conn.commit()  # Save changes
    cur.close()
    conn.close()
    return result


# ─────────────────────────────────────────
# Create all tables when app starts
# ─────────────────────────────────────────
def create_tables():
    sql = """
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'member',
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- Projects table
        CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- Project Members (which users are in which project)
        CREATE TABLE IF NOT EXISTS project_members (
            id SERIAL PRIMARY KEY,
            project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(project_id, user_id)
        );

        -- Tasks table
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'todo',
            priority VARCHAR(20) DEFAULT 'medium',
            due_date DATE,
            project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
            assigned_to INTEGER REFERENCES users(id),
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW()
        );
    """
    try:
        query(sql, fetch=False)
        print("✅ All tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
