TEAM TASK MANAGER - README
==========================

WHAT THIS APP DOES:
-------------------
A web application where teams can create projects, assign tasks, 
and track progress with role-based access (Admin/Member).


TECH STACK:
-----------
- Frontend: HTML, CSS, JavaScript (no framework - simple!)
- Backend: Node.js + Express
- Database: PostgreSQL (Neon - free cloud DB)
- Deployment: Railway
- Auth: JWT (JSON Web Tokens)


FOLDER STRUCTURE:
-----------------
team-task-manager/
  backend/
    server.js           <- Main server file (start here!)
    db.js               <- Database connection & table creation
    .env.example        <- Copy this to .env and fill values
    middleware/
      auth.js           <- Checks if user is logged in
    routes/
      auth.js           <- /api/auth/signup and /api/auth/login
      projects.js       <- /api/projects (create, view, delete)
      tasks.js          <- /api/tasks (create, view, update, delete)
  frontend/
    index.html          <- Login & Signup page
    dashboard.html      <- Dashboard with stats
    projects.html       <- Projects list page
    tasks.html          <- Tasks list page
    style.css           <- All CSS styles


HOW TO RUN LOCALLY:
-------------------

STEP 1: Set up the Database
  - Go to https://neon.tech and create a free account
  - Create a new database
  - Copy the connection string

STEP 2: Set up Backend
  - Open terminal in the backend/ folder
  - Run: npm install
  - Copy .env.example to .env
  - Fill in your DATABASE_URL and JWT_SECRET in .env
  - Run: npm start
  - You should see: "Server running on port 5000"

STEP 3: Open Frontend
  - Open frontend/index.html in your browser
  - OR use VS Code Live Server extension


API ENDPOINTS:
--------------
POST   /api/auth/signup         - Create account
POST   /api/auth/login          - Login

GET    /api/projects            - Get all projects
POST   /api/projects            - Create project (Admin only)
DELETE /api/projects/:id        - Delete project (Admin only)
POST   /api/projects/:id/members - Add member to project

GET    /api/tasks               - Get tasks
POST   /api/tasks               - Create task (Admin only)
GET    /api/tasks/dashboard     - Get stats for dashboard
PATCH  /api/tasks/:id/status    - Update task status
DELETE /api/tasks/:id           - Delete task (Admin only)


HOW TO DEPLOY ON RAILWAY:
--------------------------
1. Push your code to GitHub
2. Go to https://railway.app and sign up
3. Create New Project -> Deploy from GitHub
4. Select your backend folder
5. Add Environment Variables:
   - DATABASE_URL = your Neon database URL
   - JWT_SECRET = any long random string
   - PORT = 5000
6. Railway will give you a live URL like: https://yourapp.railway.app
7. Change API_URL in all frontend HTML files to that URL
8. Deploy frontend on Vercel (https://vercel.com) for free


ROLES:
------
ADMIN  - Can create projects, create tasks, assign tasks, delete
MEMBER - Can view their assigned tasks and update task status


AUTHOR: Your Name
DATE: 2026
