# app.py - This is the MAIN file. Run this to start the server!
# Command: python app.py

from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

from db import create_tables
from routes.auth import auth_bp
from routes.projects import projects_bp
from routes.tasks import tasks_bp

load_dotenv()  # Load .env file

# ─────────────────────────────────────────
# Create the Flask app
# ─────────────────────────────────────────
app = Flask(__name__)

# Allow frontend to talk to backend (CORS)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ─────────────────────────────────────────
# Register all route groups (Blueprints)
# ─────────────────────────────────────────
app.register_blueprint(auth_bp,     url_prefix="/api/auth")      # /api/auth/signup, /api/auth/login
app.register_blueprint(projects_bp, url_prefix="/api/projects")  # /api/projects
app.register_blueprint(tasks_bp,    url_prefix="/api/tasks")     # /api/tasks

# ─────────────────────────────────────────
# Health check route
# ─────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({"message": "✅ Team Task Manager API is running!"})


# ─────────────────────────────────────────
# Start the server
# ─────────────────────────────────────────
if __name__ == "__main__":
    print("🚀 Starting Team Task Manager API...")
    create_tables()  # Create database tables on startup
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
