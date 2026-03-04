from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.staticfiles import StaticFiles
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret_key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 1440))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Taron Technology ERP")
api_router = APIRouter(prefix="/api")

# ============== PYDANTIC MODELS ==============

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str  # owner, finance_manager, hr, team_leader, employee, document_manager
    phone: Optional[str] = None
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    is_active: bool = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Task Models
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: str  # user_id
    project_id: Optional[str] = None
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "pending"  # pending, in_progress, completed, on_hold
    due_date: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str
    assigned_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    assigned_to_name: Optional[str] = None
    assigned_by_name: Optional[str] = None

# Project Models
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    client_id: Optional[str] = None
    team_leader_id: str
    status: str = "active"  # active, completed, on_hold
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    progress: int = 0

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    client_name: Optional[str] = None
    team_leader_name: Optional[str] = None

# Client Models
class ClientBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    assigned_to: str  # team_leader_id

class ClientCreate(ClientBase):
    pass

class ClientResponse(ClientBase):
    id: str
    created_at: datetime
    assigned_to_name: Optional[str] = None

# Attendance Models
class AttendanceBase(BaseModel):
    user_id: str
    date: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    status: str = "present"  # present, absent, half_day, leave
    working_hours: Optional[float] = None
    notes: Optional[str] = None

class AttendanceCreate(BaseModel):
    user_id: str
    date: str
    status: str = "present"
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: str
    user_name: Optional[str] = None

# Purchase Request Models
class PurchaseRequestBase(BaseModel):
    title: str
    description: str
    amount: float
    category: str  # equipment, supplies, software, other
    urgency: str = "normal"  # low, normal, high, urgent

class PurchaseRequestCreate(PurchaseRequestBase):
    pass

class PurchaseRequestResponse(PurchaseRequestBase):
    id: str
    requested_by: str
    requested_by_name: Optional[str] = None
    status: str = "pending"  # pending, approved, denied
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    remarks: Optional[str] = None

# Document Models
class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str  # engineering, hr, finance, general
    tags: Optional[List[str]] = []

class DocumentResponse(DocumentBase):
    id: str
    filename: str
    file_path: str
    uploaded_by: str
    uploaded_by_name: Optional[str] = None
    created_at: datetime
    file_size: Optional[int] = None

# Finance Models
class ExpenseBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    category: str  # salary, utilities, equipment, marketing, other
    date: str
    is_gst_applicable: bool = False
    gst_amount: Optional[float] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: str
    created_by: str
    created_by_name: Optional[str] = None
    created_at: datetime

class IncomeBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    source: str  # project, service, other
    date: str
    client_id: Optional[str] = None
    is_gst_applicable: bool = False
    gst_amount: Optional[float] = None

class IncomeCreate(IncomeBase):
    pass

class IncomeResponse(IncomeBase):
    id: str
    created_by: str
    created_by_name: Optional[str] = None
    created_at: datetime

# Safety Protocol Models
class SafetyProtocolBase(BaseModel):
    title: str
    description: str
    category: str  # fire, electrical, general, emergency
    priority: str = "medium"

class SafetyProtocolCreate(SafetyProtocolBase):
    pass

class SafetyProtocolResponse(SafetyProtocolBase):
    id: str
    created_by: str
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

# Message Models
class MessageBase(BaseModel):
    subject: str
    content: str
    recipient_id: Optional[str] = None  # None for broadcast
    is_broadcast: bool = False

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: str
    sender_id: str
    sender_name: Optional[str] = None
    recipient_name: Optional[str] = None
    created_at: datetime
    is_read: bool = False

# Daily Report Models
class DailyReportBase(BaseModel):
    date: str
    tasks_completed: List[str] = []
    tasks_in_progress: List[str] = []
    issues: Optional[str] = None
    notes: Optional[str] = None

class DailyReportCreate(DailyReportBase):
    pass

class DailyReportResponse(DailyReportBase):
    id: str
    user_id: str
    user_name: Optional[str] = None
    created_at: datetime

# ============== HELPER FUNCTIONS ==============

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def get_users_lookup(user_ids: List[str]) -> dict:
    """Batch fetch users and return a lookup dictionary"""
    if not user_ids:
        return {}
    unique_ids = list(set(user_ids))
    users = await db.users.find({"id": {"$in": unique_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)
    return {u["id"]: u["name"] for u in users}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def check_role(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return current_user
    return role_checker

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, current_user: dict = Depends(check_role(["owner", "hr"]))):
    # Check if email exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["is_active"] = True
    
    await db.users.insert_one(user_dict)
    del user_dict["password"]
    user_dict.pop("_id", None)
    user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    return user_dict

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    user_response["created_at"] = datetime.fromisoformat(user_response["created_at"]) if isinstance(user_response["created_at"], str) else user_response["created_at"]
    
    return {"access_token": token, "user": user_response}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = {k: v for k, v in current_user.items() if k != "password"}
    user["created_at"] = datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    return user

@api_router.post("/auth/setup-owner", response_model=UserResponse)
async def setup_owner(user: UserCreate):
    """First-time setup to create owner account"""
    owner_exists = await db.users.find_one({"role": "owner"})
    if owner_exists:
        raise HTTPException(status_code=400, detail="Owner already exists")
    
    user_dict = user.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["is_active"] = True
    user_dict["role"] = "owner"
    
    await db.users.insert_one(user_dict)
    del user_dict["password"]
    user_dict.pop("_id", None)
    user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    return user_dict

# ============== USER MANAGEMENT ROUTES ==============

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(check_role(["owner", "hr"]))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for u in users:
        u["created_at"] = datetime.fromisoformat(u["created_at"]) if isinstance(u["created_at"], str) else u["created_at"]
    return users

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["created_at"] = datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    return user

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, updates: dict, current_user: dict = Depends(check_role(["owner", "hr"]))):
    if "password" in updates:
        updates["password"] = hash_password(updates["password"])
    await db.users.update_one({"id": user_id}, {"$set": updates})
    return {"message": "User updated"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(check_role(["owner"]))):
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    return {"message": "User deactivated"}

# ============== TASK ROUTES ==============

@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, current_user: dict = Depends(check_role(["owner", "team_leader"]))):
    task_dict = task.model_dump()
    task_dict["id"] = str(uuid.uuid4())
    task_dict["assigned_by"] = current_user["id"]
    task_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tasks.insert_one(task_dict)
    task_dict.pop("_id", None)
    task_dict["created_at"] = datetime.fromisoformat(task_dict["created_at"])
    
    # Get names
    assignee = await db.users.find_one({"id": task_dict["assigned_to"]}, {"_id": 0})
    task_dict["assigned_to_name"] = assignee["name"] if assignee else None
    task_dict["assigned_by_name"] = current_user["name"]
    
    return task_dict

@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    if role == "owner":
        tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    elif role == "team_leader":
        tasks = await db.tasks.find({"$or": [{"assigned_by": current_user["id"]}, {"assigned_to": current_user["id"]}]}, {"_id": 0}).to_list(1000)
    else:
        tasks = await db.tasks.find({"assigned_to": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    for t in tasks:
        t["created_at"] = datetime.fromisoformat(t["created_at"]) if isinstance(t["created_at"], str) else t["created_at"]
        if t.get("updated_at"):
            t["updated_at"] = datetime.fromisoformat(t["updated_at"]) if isinstance(t["updated_at"], str) else t["updated_at"]
        assignee = await db.users.find_one({"id": t["assigned_to"]}, {"_id": 0})
        assigner = await db.users.find_one({"id": t["assigned_by"]}, {"_id": 0})
        t["assigned_to_name"] = assignee["name"] if assignee else None
        t["assigned_by_name"] = assigner["name"] if assigner else None
    
    return tasks

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    role = current_user["role"]
    if role not in ["owner", "team_leader"] and task["assigned_to"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.tasks.update_one({"id": task_id}, {"$set": updates})
    return {"message": "Task updated"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(check_role(["owner", "team_leader"]))):
    await db.tasks.delete_one({"id": task_id})
    return {"message": "Task deleted"}

# ============== PROJECT ROUTES ==============

@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, current_user: dict = Depends(check_role(["owner", "team_leader"]))):
    project_dict = project.model_dump()
    project_dict["id"] = str(uuid.uuid4())
    project_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.projects.insert_one(project_dict)
    project_dict.pop("_id", None)
    project_dict["created_at"] = datetime.fromisoformat(project_dict["created_at"])
    
    if project_dict.get("client_id"):
        client = await db.clients.find_one({"id": project_dict["client_id"]}, {"_id": 0})
        project_dict["client_name"] = client["name"] if client else None
    
    team_leader = await db.users.find_one({"id": project_dict["team_leader_id"]}, {"_id": 0})
    project_dict["team_leader_name"] = team_leader["name"] if team_leader else None
    
    return project_dict

@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    if role in ["owner", "finance_manager"]:
        projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    elif role == "team_leader":
        projects = await db.projects.find({"team_leader_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    else:
        projects = []
    
    for p in projects:
        p["created_at"] = datetime.fromisoformat(p["created_at"]) if isinstance(p["created_at"], str) else p["created_at"]
        if p.get("client_id"):
            client = await db.clients.find_one({"id": p["client_id"]}, {"_id": 0})
            p["client_name"] = client["name"] if client else None
        team_leader = await db.users.find_one({"id": p["team_leader_id"]}, {"_id": 0})
        p["team_leader_name"] = team_leader["name"] if team_leader else None
    
    return projects

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, updates: dict, current_user: dict = Depends(check_role(["owner", "team_leader"]))):
    await db.projects.update_one({"id": project_id}, {"$set": updates})
    return {"message": "Project updated"}

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(check_role(["owner"]))):
    await db.projects.delete_one({"id": project_id})
    return {"message": "Project deleted"}

# ============== CLIENT ROUTES ==============

@api_router.post("/clients", response_model=ClientResponse)
async def create_client(client: ClientCreate, current_user: dict = Depends(check_role(["owner", "team_leader"]))):
    client_dict = client.model_dump()
    client_dict["id"] = str(uuid.uuid4())
    client_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.clients.insert_one(client_dict)
    client_dict.pop("_id", None)
    client_dict["created_at"] = datetime.fromisoformat(client_dict["created_at"])
    
    assignee = await db.users.find_one({"id": client_dict["assigned_to"]}, {"_id": 0})
    client_dict["assigned_to_name"] = assignee["name"] if assignee else None
    
    return client_dict

@api_router.get("/clients", response_model=List[ClientResponse])
async def get_clients(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    if role == "owner":
        clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    elif role == "team_leader":
        clients = await db.clients.find({"assigned_to": current_user["id"]}, {"_id": 0}).to_list(1000)
    else:
        clients = []
    
    for c in clients:
        c["created_at"] = datetime.fromisoformat(c["created_at"]) if isinstance(c["created_at"], str) else c["created_at"]
        assignee = await db.users.find_one({"id": c["assigned_to"]}, {"_id": 0})
        c["assigned_to_name"] = assignee["name"] if assignee else None
    
    return clients

@api_router.put("/clients/{client_id}")
async def update_client(client_id: str, updates: dict, current_user: dict = Depends(check_role(["owner", "team_leader"]))):
    await db.clients.update_one({"id": client_id}, {"$set": updates})
    return {"message": "Client updated"}

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: dict = Depends(check_role(["owner"]))):
    await db.clients.delete_one({"id": client_id})
    return {"message": "Client deleted"}

# ============== ATTENDANCE ROUTES ==============

@api_router.post("/attendance", response_model=AttendanceResponse)
async def create_attendance(attendance: AttendanceCreate, current_user: dict = Depends(check_role(["owner", "hr"]))):
    att_dict = attendance.model_dump()
    att_dict["id"] = str(uuid.uuid4())
    
    # Calculate working hours if both check_in and check_out provided
    if att_dict.get("check_in") and att_dict.get("check_out"):
        try:
            check_in = datetime.fromisoformat(att_dict["check_in"])
            check_out = datetime.fromisoformat(att_dict["check_out"])
            att_dict["working_hours"] = round((check_out - check_in).total_seconds() / 3600, 2)
        except:
            att_dict["working_hours"] = None
    
    await db.attendance.insert_one(att_dict)
    att_dict.pop("_id", None)
    
    user = await db.users.find_one({"id": att_dict["user_id"]}, {"_id": 0})
    att_dict["user_name"] = user["name"] if user else None
    
    return att_dict

@api_router.get("/attendance", response_model=List[AttendanceResponse])
async def get_attendance(date: Optional[str] = None, user_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    query = {}
    
    if date:
        query["date"] = date
    if user_id:
        query["user_id"] = user_id
    
    if role in ["owner", "hr"]:
        attendance = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    else:
        query["user_id"] = current_user["id"]
        attendance = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    
    for a in attendance:
        user = await db.users.find_one({"id": a["user_id"]}, {"_id": 0})
        a["user_name"] = user["name"] if user else None
    
    return attendance

@api_router.put("/attendance/{attendance_id}")
async def update_attendance(attendance_id: str, updates: dict, current_user: dict = Depends(check_role(["owner", "hr"]))):
    # Recalculate working hours if check times updated
    if "check_in" in updates or "check_out" in updates:
        existing = await db.attendance.find_one({"id": attendance_id}, {"_id": 0})
        check_in = updates.get("check_in", existing.get("check_in"))
        check_out = updates.get("check_out", existing.get("check_out"))
        if check_in and check_out:
            try:
                ci = datetime.fromisoformat(check_in)
                co = datetime.fromisoformat(check_out)
                updates["working_hours"] = round((co - ci).total_seconds() / 3600, 2)
            except:
                pass
    
    await db.attendance.update_one({"id": attendance_id}, {"$set": updates})
    return {"message": "Attendance updated"}

# ============== PURCHASE REQUEST ROUTES ==============

@api_router.post("/purchase-requests", response_model=PurchaseRequestResponse)
async def create_purchase_request(request: PurchaseRequestCreate, current_user: dict = Depends(get_current_user)):
    req_dict = request.model_dump()
    req_dict["id"] = str(uuid.uuid4())
    req_dict["requested_by"] = current_user["id"]
    req_dict["status"] = "pending"
    req_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.purchase_requests.insert_one(req_dict)
    req_dict.pop("_id", None)
    req_dict["created_at"] = datetime.fromisoformat(req_dict["created_at"])
    req_dict["requested_by_name"] = current_user["name"]
    
    return req_dict

@api_router.get("/purchase-requests", response_model=List[PurchaseRequestResponse])
async def get_purchase_requests(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    if role in ["owner", "hr", "finance_manager"]:
        requests = await db.purchase_requests.find({}, {"_id": 0}).to_list(1000)
    else:
        requests = await db.purchase_requests.find({"requested_by": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    for r in requests:
        r["created_at"] = datetime.fromisoformat(r["created_at"]) if isinstance(r["created_at"], str) else r["created_at"]
        if r.get("updated_at"):
            r["updated_at"] = datetime.fromisoformat(r["updated_at"]) if isinstance(r["updated_at"], str) else r["updated_at"]
        requester = await db.users.find_one({"id": r["requested_by"]}, {"_id": 0})
        r["requested_by_name"] = requester["name"] if requester else None
        if r.get("approved_by"):
            approver = await db.users.find_one({"id": r["approved_by"]}, {"_id": 0})
            r["approved_by_name"] = approver["name"] if approver else None
    
    return requests

@api_router.put("/purchase-requests/{request_id}/approve")
async def approve_purchase_request(request_id: str, remarks: Optional[str] = None, current_user: dict = Depends(check_role(["owner", "hr"]))):
    await db.purchase_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "approved",
            "approved_by": current_user["id"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "remarks": remarks
        }}
    )
    return {"message": "Request approved"}

@api_router.put("/purchase-requests/{request_id}/deny")
async def deny_purchase_request(request_id: str, remarks: Optional[str] = None, current_user: dict = Depends(check_role(["owner", "hr"]))):
    await db.purchase_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "denied",
            "approved_by": current_user["id"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "remarks": remarks
        }}
    )
    return {"message": "Request denied"}

# ============== DOCUMENT ROUTES ==============

@api_router.post("/documents", response_model=DocumentResponse)
async def upload_document(
    title: str,
    category: str,
    description: Optional[str] = None,
    tags: Optional[str] = None,
    file: UploadFile = File(...),
    current_user: dict = Depends(check_role(["owner", "hr", "document_manager"]))
):
    doc_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{doc_id}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    doc_dict = {
        "id": doc_id,
        "title": title,
        "description": description,
        "category": category,
        "tags": tags.split(",") if tags else [],
        "filename": file.filename,
        "file_path": str(file_path),
        "uploaded_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "file_size": os.path.getsize(file_path)
    }
    
    await db.documents.insert_one(doc_dict)
    doc_dict.pop("_id", None)
    doc_dict["created_at"] = datetime.fromisoformat(doc_dict["created_at"])
    doc_dict["uploaded_by_name"] = current_user["name"]
    
    return doc_dict

@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(category: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if category:
        query["category"] = category
    
    documents = await db.documents.find(query, {"_id": 0}).to_list(1000)
    
    for d in documents:
        d["created_at"] = datetime.fromisoformat(d["created_at"]) if isinstance(d["created_at"], str) else d["created_at"]
        uploader = await db.users.find_one({"id": d["uploaded_by"]}, {"_id": 0})
        d["uploaded_by_name"] = uploader["name"] if uploader else None
    
    return documents

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(check_role(["owner", "document_manager"]))):
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if doc and os.path.exists(doc["file_path"]):
        os.remove(doc["file_path"])
    await db.documents.delete_one({"id": document_id})
    return {"message": "Document deleted"}

# ============== FINANCE ROUTES ==============

@api_router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreate, current_user: dict = Depends(check_role(["owner", "finance_manager"]))):
    exp_dict = expense.model_dump()
    exp_dict["id"] = str(uuid.uuid4())
    exp_dict["created_by"] = current_user["id"]
    exp_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.expenses.insert_one(exp_dict)
    exp_dict.pop("_id", None)
    exp_dict["created_at"] = datetime.fromisoformat(exp_dict["created_at"])
    exp_dict["created_by_name"] = current_user["name"]
    
    return exp_dict

@api_router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(current_user: dict = Depends(check_role(["owner", "finance_manager"]))):
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    
    for e in expenses:
        e["created_at"] = datetime.fromisoformat(e["created_at"]) if isinstance(e["created_at"], str) else e["created_at"]
        creator = await db.users.find_one({"id": e["created_by"]}, {"_id": 0})
        e["created_by_name"] = creator["name"] if creator else None
    
    return expenses

@api_router.post("/income", response_model=IncomeResponse)
async def create_income(income: IncomeCreate, current_user: dict = Depends(check_role(["owner", "finance_manager"]))):
    inc_dict = income.model_dump()
    inc_dict["id"] = str(uuid.uuid4())
    inc_dict["created_by"] = current_user["id"]
    inc_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.income.insert_one(inc_dict)
    inc_dict.pop("_id", None)
    inc_dict["created_at"] = datetime.fromisoformat(inc_dict["created_at"])
    inc_dict["created_by_name"] = current_user["name"]
    
    return inc_dict

@api_router.get("/income", response_model=List[IncomeResponse])
async def get_income(current_user: dict = Depends(check_role(["owner", "finance_manager"]))):
    income = await db.income.find({}, {"_id": 0}).to_list(1000)
    
    for i in income:
        i["created_at"] = datetime.fromisoformat(i["created_at"]) if isinstance(i["created_at"], str) else i["created_at"]
        creator = await db.users.find_one({"id": i["created_by"]}, {"_id": 0})
        i["created_by_name"] = creator["name"] if creator else None
    
    return income

@api_router.get("/finance/summary")
async def get_finance_summary(current_user: dict = Depends(check_role(["owner", "finance_manager"]))):
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    income = await db.income.find({}, {"_id": 0}).to_list(1000)
    
    total_expenses = sum(e["amount"] for e in expenses)
    total_income = sum(i["amount"] for i in income)
    total_gst_expenses = sum(e.get("gst_amount", 0) or 0 for e in expenses)
    total_gst_income = sum(i.get("gst_amount", 0) or 0 for i in income)
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_profit": total_income - total_expenses,
        "gst_collected": total_gst_income,
        "gst_paid": total_gst_expenses,
        "gst_liability": total_gst_income - total_gst_expenses
    }

# ============== SAFETY PROTOCOL ROUTES ==============

@api_router.post("/safety-protocols", response_model=SafetyProtocolResponse)
async def create_safety_protocol(protocol: SafetyProtocolCreate, current_user: dict = Depends(check_role(["owner", "hr"]))):
    proto_dict = protocol.model_dump()
    proto_dict["id"] = str(uuid.uuid4())
    proto_dict["created_by"] = current_user["id"]
    proto_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.safety_protocols.insert_one(proto_dict)
    proto_dict.pop("_id", None)
    proto_dict["created_at"] = datetime.fromisoformat(proto_dict["created_at"])
    proto_dict["created_by_name"] = current_user["name"]
    
    return proto_dict

@api_router.get("/safety-protocols", response_model=List[SafetyProtocolResponse])
async def get_safety_protocols(current_user: dict = Depends(get_current_user)):
    protocols = await db.safety_protocols.find({}, {"_id": 0}).to_list(1000)
    
    for p in protocols:
        p["created_at"] = datetime.fromisoformat(p["created_at"]) if isinstance(p["created_at"], str) else p["created_at"]
        if p.get("updated_at"):
            p["updated_at"] = datetime.fromisoformat(p["updated_at"]) if isinstance(p["updated_at"], str) else p["updated_at"]
        creator = await db.users.find_one({"id": p["created_by"]}, {"_id": 0})
        p["created_by_name"] = creator["name"] if creator else None
    
    return protocols

@api_router.put("/safety-protocols/{protocol_id}")
async def update_safety_protocol(protocol_id: str, updates: dict, current_user: dict = Depends(check_role(["owner", "hr"]))):
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.safety_protocols.update_one({"id": protocol_id}, {"$set": updates})
    return {"message": "Protocol updated"}

@api_router.delete("/safety-protocols/{protocol_id}")
async def delete_safety_protocol(protocol_id: str, current_user: dict = Depends(check_role(["owner", "hr"]))):
    await db.safety_protocols.delete_one({"id": protocol_id})
    return {"message": "Protocol deleted"}

# ============== MESSAGE ROUTES ==============

@api_router.post("/messages", response_model=MessageResponse)
async def send_message(message: MessageCreate, current_user: dict = Depends(check_role(["owner", "hr"]))):
    msg_dict = message.model_dump()
    msg_dict["id"] = str(uuid.uuid4())
    msg_dict["sender_id"] = current_user["id"]
    msg_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    msg_dict["is_read"] = False
    
    await db.messages.insert_one(msg_dict)
    msg_dict.pop("_id", None)
    msg_dict["created_at"] = datetime.fromisoformat(msg_dict["created_at"])
    msg_dict["sender_name"] = current_user["name"]
    
    if msg_dict.get("recipient_id"):
        recipient = await db.users.find_one({"id": msg_dict["recipient_id"]}, {"_id": 0})
        msg_dict["recipient_name"] = recipient["name"] if recipient else None
    
    return msg_dict

@api_router.get("/messages", response_model=List[MessageResponse])
async def get_messages(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    if role in ["owner", "hr"]:
        messages = await db.messages.find({}, {"_id": 0}).to_list(1000)
    else:
        messages = await db.messages.find({
            "$or": [
                {"recipient_id": current_user["id"]},
                {"is_broadcast": True}
            ]
        }, {"_id": 0}).to_list(1000)
    
    for m in messages:
        m["created_at"] = datetime.fromisoformat(m["created_at"]) if isinstance(m["created_at"], str) else m["created_at"]
        sender = await db.users.find_one({"id": m["sender_id"]}, {"_id": 0})
        m["sender_name"] = sender["name"] if sender else None
        if m.get("recipient_id"):
            recipient = await db.users.find_one({"id": m["recipient_id"]}, {"_id": 0})
            m["recipient_name"] = recipient["name"] if recipient else None
    
    return messages

@api_router.put("/messages/{message_id}/read")
async def mark_message_read(message_id: str, current_user: dict = Depends(get_current_user)):
    await db.messages.update_one({"id": message_id}, {"$set": {"is_read": True}})
    return {"message": "Message marked as read"}

# ============== DAILY REPORT ROUTES ==============

@api_router.post("/daily-reports", response_model=DailyReportResponse)
async def create_daily_report(report: DailyReportCreate, current_user: dict = Depends(get_current_user)):
    report_dict = report.model_dump()
    report_dict["id"] = str(uuid.uuid4())
    report_dict["user_id"] = current_user["id"]
    report_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.daily_reports.insert_one(report_dict)
    report_dict.pop("_id", None)
    report_dict["created_at"] = datetime.fromisoformat(report_dict["created_at"])
    report_dict["user_name"] = current_user["name"]
    
    return report_dict

@api_router.get("/daily-reports", response_model=List[DailyReportResponse])
async def get_daily_reports(date: Optional[str] = None, user_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    query = {}
    
    if date:
        query["date"] = date
    
    if role == "owner":
        if user_id:
            query["user_id"] = user_id
    elif role == "team_leader":
        # Get team members' reports
        team_members = await db.tasks.distinct("assigned_to", {"assigned_by": current_user["id"]})
        team_members.append(current_user["id"])
        query["user_id"] = {"$in": team_members}
    else:
        query["user_id"] = current_user["id"]
    
    reports = await db.daily_reports.find(query, {"_id": 0}).to_list(1000)
    
    for r in reports:
        r["created_at"] = datetime.fromisoformat(r["created_at"]) if isinstance(r["created_at"], str) else r["created_at"]
        user = await db.users.find_one({"id": r["user_id"]}, {"_id": 0})
        r["user_name"] = user["name"] if user else None
    
    return reports

# ============== DASHBOARD STATS ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    stats = {}
    
    if role == "owner":
        stats["total_users"] = await db.users.count_documents({"is_active": True})
        stats["total_projects"] = await db.projects.count_documents({})
        stats["total_tasks"] = await db.tasks.count_documents({})
        stats["pending_tasks"] = await db.tasks.count_documents({"status": "pending"})
        stats["total_clients"] = await db.clients.count_documents({})
        stats["pending_requests"] = await db.purchase_requests.count_documents({"status": "pending"})
        
        # Finance summary
        expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
        income = await db.income.find({}, {"_id": 0}).to_list(1000)
        stats["total_income"] = sum(i["amount"] for i in income)
        stats["total_expenses"] = sum(e["amount"] for e in expenses)
        
    elif role == "finance_manager":
        expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
        income = await db.income.find({}, {"_id": 0}).to_list(1000)
        stats["total_income"] = sum(i["amount"] for i in income)
        stats["total_expenses"] = sum(e["amount"] for e in expenses)
        stats["pending_requests"] = await db.purchase_requests.count_documents({"status": "pending"})
        
    elif role == "hr":
        stats["total_employees"] = await db.users.count_documents({"is_active": True})
        stats["pending_requests"] = await db.purchase_requests.count_documents({"status": "pending"})
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        stats["today_attendance"] = await db.attendance.count_documents({"date": today, "status": "present"})
        stats["total_documents"] = await db.documents.count_documents({})
        
    elif role == "team_leader":
        stats["my_projects"] = await db.projects.count_documents({"team_leader_id": current_user["id"]})
        stats["my_tasks"] = await db.tasks.count_documents({"assigned_by": current_user["id"]})
        stats["pending_tasks"] = await db.tasks.count_documents({"assigned_by": current_user["id"], "status": "pending"})
        stats["my_clients"] = await db.clients.count_documents({"assigned_to": current_user["id"]})
        
    elif role == "employee":
        stats["my_tasks"] = await db.tasks.count_documents({"assigned_to": current_user["id"]})
        stats["pending_tasks"] = await db.tasks.count_documents({"assigned_to": current_user["id"], "status": "pending"})
        stats["completed_tasks"] = await db.tasks.count_documents({"assigned_to": current_user["id"], "status": "completed"})
        
    elif role == "document_manager":
        stats["total_documents"] = await db.documents.count_documents({})
        stats["engineering_docs"] = await db.documents.count_documents({"category": "engineering"})
        stats["hr_docs"] = await db.documents.count_documents({"category": "hr"})
    
    return stats

# ============== TEAM MEMBERS ROUTE ==============

@api_router.get("/team-members")
async def get_team_members(current_user: dict = Depends(get_current_user)):
    """Get users that can be assigned tasks (for team leaders)"""
    role = current_user["role"]
    if role in ["owner", "team_leader"]:
        users = await db.users.find({"is_active": True, "role": {"$in": ["employee", "team_leader"]}}, {"_id": 0, "password": 0}).to_list(1000)
        return users
    return []

# Include router
app.include_router(api_router)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
