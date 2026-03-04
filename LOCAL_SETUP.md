# Taron Technology ERP System - Local Setup Guide

## Prerequisites
- Node.js (v18+)
- Python (3.11+)
- MongoDB (local or Atlas)
- VS Code

## Project Structure
```
taron-erp/
├── backend/
│   ├── server.py          # FastAPI backend
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React app
│   │   ├── pages/         # All page components
│   │   ├── components/    # UI components
│   │   └── context/       # Auth context
│   ├── package.json       # Node dependencies
│   └── .env               # Frontend environment variables
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Update .env file
# Make sure MONGO_URL points to your MongoDB instance
```

**backend/.env:**
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="taron_erp"
CORS_ORIGINS="*"
JWT_SECRET="taron_technology_jwt_secret_key_2024_secure"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**Start backend:**
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install
# OR
npm install

# Update .env file
```

**frontend/.env:**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

**Start frontend:**
```bash
yarn start
# OR
npm start
```

### 3. First Time Setup

1. Open browser: http://localhost:3000
2. Click "Create Owner Account" link
3. Fill in owner details and create account
4. Login with the owner credentials

## Default Test Credentials
After setup, you can create test users with these roles:
- **Owner**: Full access
- **Finance Manager**: Finance module access
- **HR**: Employee & attendance management
- **Team Leader**: Task & project management
- **Employee**: View own tasks
- **Document Manager**: Document management

## API Endpoints

### Auth
- POST /api/auth/setup-owner - First time owner setup
- POST /api/auth/login - Login
- POST /api/auth/register - Register new user (Owner/HR only)
- GET /api/auth/me - Get current user

### Users
- GET /api/users - List all users
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Deactivate user

### Tasks
- GET /api/tasks - List tasks
- POST /api/tasks - Create task
- PUT /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task

### Projects
- GET /api/projects - List projects
- POST /api/projects - Create project
- PUT /api/projects/:id - Update project
- DELETE /api/projects/:id - Delete project

### Finance
- GET /api/expenses - List expenses
- POST /api/expenses - Add expense
- GET /api/income - List income
- POST /api/income - Add income
- GET /api/finance/summary - Get finance summary

### And more for:
- /api/clients
- /api/attendance
- /api/purchase-requests
- /api/documents
- /api/safety-protocols
- /api/messages
- /api/daily-reports
- /api/dashboard/stats

## Troubleshooting

### MongoDB Connection Error
Make sure MongoDB is running:
```bash
# On Mac
brew services start mongodb-community

# On Ubuntu
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### CORS Issues
Update CORS_ORIGINS in backend/.env to include your frontend URL

### Port Already in Use
```bash
# Find process using port
lsof -i :8001  # or :3000

# Kill process
kill -9 <PID>
```
