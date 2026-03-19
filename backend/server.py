from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import jwt
import bcrypt
import io
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SECRET_KEY = os.environ['JWT_SECRET']
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---- Auth Utilities ----

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Ungültiges oder abgelaufenes Token")

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(creds.credentials)
    user_id = payload.get("sub")
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Ungültiger Token")
    if not user:
        raise HTTPException(status_code=401, detail="Benutzer nicht gefunden")
    return user

async def get_admin_user(current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Nur Administratoren haben Zugriff")
    return current_user

def doc(d):
    if d is None:
        return None
    d["id"] = str(d["_id"])
    del d["_id"]
    return d


# ---- Models ----

class UserCreate(BaseModel):
    username: str
    password: str

class AdminUserCreate(BaseModel):
    username: str
    password: str
    role: str = "user"  # "admin", "user", "visitor"

class AdminUserUpdate(BaseModel):
    password: str

class EventCreate(BaseModel):
    name: str
    table_count: int = 10
    seats_per_table: int = 6

class EventUpdate(BaseModel):
    name: Optional[str] = None
    table_count: Optional[int] = None
    seats_per_table: Optional[int] = None

class GuestCreate(BaseModel):
    first_name: str
    last_name: str
    guest_type: str = "erwachsener"   # "erwachsener" | "kind"
    companion_of: Optional[str] = None  # guest_id of the main guest
    is_staff: bool = False
    notes: Optional[str] = None
    vehicle: Optional[str] = None
    license_plate: Optional[str] = None

class GuestUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    guest_type: Optional[str] = None
    companion_of: Optional[str] = None
    checked_in: Optional[bool] = None
    is_staff: Optional[bool] = None
    notes: Optional[str] = None
    vehicle: Optional[str] = None
    license_plate: Optional[str] = None


# ---- Menu Models ----

class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "essen"  # "essen" | "getraenke"
    price: Optional[float] = None
    allergens: Optional[str] = None

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    allergens: Optional[str] = None

class SeatingPlanSave(BaseModel):
    tables: List[List[Optional[str]]]


# ---- Startup: Create default admin ----

@app.on_event("startup")
async def create_default_admin():
    existing_admin = await db.users.find_one({"role": "admin"})
    if not existing_admin:
        await db.users.insert_one({
            "username": "admin",
            "hashed_password": hash_password("admin123"),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Standard-Admin erstellt: admin / admin123")


# ---- Auth Routes ----

@api_router.post("/auth/login")
async def login(data: UserCreate):
    user = await db.users.find_one({"username": data.username})
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(401, "Ungültige Zugangsdaten")
    token = create_token({"sub": str(user["_id"]), "username": user["username"], "role": user.get("role", "user")})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user.get("role", "user")
    }

@api_router.get("/auth/me")
async def me(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "role": current_user.get("role", "user")
    }


# ---- Admin Routes ----

@api_router.get("/admin/users")
async def admin_list_users(admin=Depends(get_admin_user)):
    users = await db.users.find({}).sort("created_at", 1).to_list(500)
    return [{"id": str(u["_id"]), "username": u["username"], "role": u.get("role", "user"), "created_at": u.get("created_at", "")} for u in users]

@api_router.post("/admin/users")
async def admin_create_user(data: AdminUserCreate, admin=Depends(get_admin_user)):
    existing = await db.users.find_one({"username": data.username})
    if existing:
        raise HTTPException(400, "Benutzername bereits vergeben")
    if len(data.password) < 4:
        raise HTTPException(400, "Passwort muss mindestens 4 Zeichen haben")
    valid_roles = ("admin", "user", "visitor")
    role = data.role if data.role in valid_roles else "user"
    result = await db.users.insert_one({
        "username": data.username,
        "hashed_password": hash_password(data.password),
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"id": str(result.inserted_id), "username": data.username, "role": role}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(get_admin_user)):
    if str(admin["_id"]) == user_id:
        raise HTTPException(400, "Sie können Ihren eigenen Account nicht löschen")
    try:
        await db.users.delete_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(404, "Benutzer nicht gefunden")
    return {"ok": True}

@api_router.put("/admin/users/{user_id}/password")
async def admin_update_password(user_id: str, data: AdminUserUpdate, admin=Depends(get_admin_user)):
    if len(data.password) < 4:
        raise HTTPException(400, "Passwort muss mindestens 4 Zeichen haben")
    try:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"hashed_password": hash_password(data.password)}}
        )
    except Exception:
        raise HTTPException(404, "Benutzer nicht gefunden")
    return {"ok": True}


# ---- Event Routes ----

@api_router.get("/events")
async def list_events(current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    events = await db.events.find({"user_id": user_id}).sort("created_at", -1).to_list(200)
    result = []
    for e in events:
        e = doc(e)
        e["guest_count"] = await db.guests.count_documents({"event_id": e["id"]})
        result.append(e)
    return result

@api_router.post("/events")
async def create_event(data: EventCreate, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    event_doc = {
        "user_id": user_id,
        "name": data.name,
        "table_count": data.table_count,
        "seats_per_table": data.seats_per_table,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.events.insert_one(event_doc)
    event_doc["id"] = str(result.inserted_id)
    del event_doc["_id"]
    event_doc["guest_count"] = 0
    return event_doc

@api_router.get("/events/{event_id}")
async def get_event(event_id: str, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id), "user_id": user_id})
    except Exception:
        raise HTTPException(404, "Event nicht gefunden")
    if not event:
        raise HTTPException(404, "Event nicht gefunden")
    return doc(event)

@api_router.put("/events/{event_id}")
async def update_event(event_id: str, data: EventUpdate, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    try:
        await db.events.update_one({"_id": ObjectId(event_id), "user_id": user_id}, {"$set": updates})
        event = await db.events.find_one({"_id": ObjectId(event_id)})
    except Exception:
        raise HTTPException(404, "Event nicht gefunden")
    if not event:
        raise HTTPException(404, "Event nicht gefunden")
    return doc(event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    try:
        await db.events.delete_one({"_id": ObjectId(event_id), "user_id": user_id})
        await db.guests.delete_many({"event_id": event_id})
        await db.seating_plans.delete_one({"event_id": event_id})
    except Exception:
        pass
    return {"ok": True}


# ---- Guest Routes ----

@api_router.get("/events/{event_id}/guests")
async def list_guests(event_id: str, current_user=Depends(get_current_user)):
    guests = await db.guests.find({"event_id": event_id}).sort("last_name", 1).to_list(2000)
    return [doc(g) for g in guests]

@api_router.post("/events/{event_id}/guests")
async def add_guest(event_id: str, data: GuestCreate, current_user=Depends(get_current_user)):
    guest_doc = {
        "event_id": event_id,
        "first_name": data.first_name.strip(),
        "last_name": data.last_name.strip(),
        "guest_type": data.guest_type,
        "companion_of": data.companion_of,
        "is_staff": data.is_staff,
        "notes": data.notes or "",
        "vehicle": data.vehicle or "",
        "license_plate": data.license_plate or "",
        "checked_in": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.guests.insert_one(guest_doc)
    guest_doc["id"] = str(result.inserted_id)
    del guest_doc["_id"]
    return guest_doc

@api_router.put("/events/{event_id}/guests/{guest_id}")
async def update_guest(event_id: str, guest_id: str, data: GuestUpdate, current_user=Depends(get_current_user)):
    updates = {}
    data_dict = data.model_dump()
    for k, v in data_dict.items():
        if v is not None:
            updates[k] = v
    # Allow explicitly setting companion_of to None
    if "companion_of" in data_dict:
        updates["companion_of"] = data.companion_of
    try:
        await db.guests.update_one({"_id": ObjectId(guest_id)}, {"$set": updates})
        guest = await db.guests.find_one({"_id": ObjectId(guest_id)})
    except Exception:
        raise HTTPException(404, "Gast nicht gefunden")
    return doc(guest)

@api_router.delete("/events/{event_id}/guests/{guest_id}")
async def delete_guest(event_id: str, guest_id: str, current_user=Depends(get_current_user)):
    try:
        await db.guests.delete_one({"_id": ObjectId(guest_id), "event_id": event_id})
        # Remove companion references
        await db.guests.update_many({"companion_of": guest_id}, {"$set": {"companion_of": None}})
        # Remove from seating plan
        plan = await db.seating_plans.find_one({"event_id": event_id})
        if plan:
            tables = plan.get("tables", [])
            changed = False
            for table in tables:
                for i, seat in enumerate(table):
                    if seat == guest_id:
                        table[i] = None
                        changed = True
            if changed:
                await db.seating_plans.update_one({"event_id": event_id}, {"$set": {"tables": tables}})
    except Exception:
        pass
    return {"ok": True}

@api_router.post("/events/{event_id}/guests/import")
async def import_guests(event_id: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):
    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except Exception:
        text = content.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    count = 0
    for row in reader:
        first_name = (row.get("Vorname") or row.get("vorname") or row.get("first_name") or "").strip()
        last_name = (row.get("Nachname") or row.get("nachname") or row.get("last_name") or "").strip()
        guest_type = (row.get("Typ") or row.get("typ") or row.get("type") or "erwachsener").strip().lower()
        is_staff_str = (row.get("Mitarbeiter") or row.get("mitarbeiter") or row.get("staff") or "").strip().lower()
        is_staff = is_staff_str in ("ja", "yes", "1", "true")
        notes = (row.get("Notizen") or row.get("notizen") or row.get("notes") or "").strip()
        vehicle = (row.get("Fahrzeug") or row.get("fahrzeug") or row.get("vehicle") or "").strip()
        license_plate = (row.get("Kennzeichen") or row.get("kennzeichen") or row.get("license_plate") or "").strip()
        if guest_type not in ("erwachsener", "kind"):
            guest_type = "erwachsener"
        if first_name or last_name:
            await db.guests.insert_one({
                "event_id": event_id,
                "first_name": first_name,
                "last_name": last_name,
                "guest_type": guest_type,
                "companion_of": None,
                "is_staff": is_staff,
                "notes": notes,
                "vehicle": vehicle,
                "license_plate": license_plate,
                "checked_in": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            count += 1
    return {"imported": count}


@api_router.put("/events/{event_id}/guests/{guest_id}/checkin")
async def toggle_checkin(event_id: str, guest_id: str, current_user=Depends(get_current_user)):
    try:
        guest = await db.guests.find_one({"_id": ObjectId(guest_id), "event_id": event_id})
        if not guest:
            raise HTTPException(404, "Gast nicht gefunden")
        new_status = not guest.get("checked_in", False)
        await db.guests.update_one({"_id": ObjectId(guest_id)}, {"$set": {"checked_in": new_status}})
        return {"checked_in": new_status}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(500, "Fehler beim Aktualisieren")


# ---- Seating Plan Routes ----

@api_router.get("/events/{event_id}/seating")
async def get_seating(event_id: str, current_user=Depends(get_current_user)):
    plan = await db.seating_plans.find_one({"event_id": event_id})
    if not plan:
        return {"event_id": event_id, "tables": []}
    return {"event_id": event_id, "tables": plan.get("tables", [])}

@api_router.put("/events/{event_id}/seating")
async def save_seating(event_id: str, data: SeatingPlanSave, current_user=Depends(get_current_user)):
    await db.seating_plans.update_one(
        {"event_id": event_id},
        {"$set": {"event_id": event_id, "tables": data.tables}},
        upsert=True
    )
    return {"ok": True}


# ---- Menu Routes ----

@api_router.get("/events/{event_id}/menu")
async def list_menu_items(event_id: str, current_user=Depends(get_current_user)):
    items = await db.menu_items.find({"event_id": event_id}).sort("category", 1).to_list(500)
    return [doc(item) for item in items]

@api_router.post("/events/{event_id}/menu")
async def add_menu_item(event_id: str, data: MenuItemCreate, current_user=Depends(get_current_user)):
    item_doc = {
        "event_id": event_id,
        "name": data.name.strip(),
        "description": data.description or "",
        "category": data.category,
        "price": data.price,
        "allergens": data.allergens or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.menu_items.insert_one(item_doc)
    item_doc["id"] = str(result.inserted_id)
    del item_doc["_id"]
    return item_doc

@api_router.put("/events/{event_id}/menu/{item_id}")
async def update_menu_item(event_id: str, item_id: str, data: MenuItemUpdate, current_user=Depends(get_current_user)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    try:
        await db.menu_items.update_one({"_id": ObjectId(item_id), "event_id": event_id}, {"$set": updates})
        item = await db.menu_items.find_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(404, "Menüeintrag nicht gefunden")
    return doc(item)

@api_router.delete("/events/{event_id}/menu/{item_id}")
async def delete_menu_item(event_id: str, item_id: str, current_user=Depends(get_current_user)):
    try:
        await db.menu_items.delete_one({"_id": ObjectId(item_id), "event_id": event_id})
    except Exception:
        pass
    return {"ok": True}


# ---- Visitor View Routes (Read-Only for visitors) ----

async def get_visitor_or_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    """Allow visitors, users, and admins to access"""
    payload = decode_token(creds.credentials)
    user_id = payload.get("sub")
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Ungültiger Token")
    if not user:
        raise HTTPException(status_code=401, detail="Benutzer nicht gefunden")
    return user

@api_router.get("/visitor/events")
async def visitor_list_events(current_user=Depends(get_visitor_or_user)):
    """List all events for visitor view - visitors see all events"""
    events = await db.events.find({}).sort("created_at", -1).to_list(200)
    result = []
    for e in events:
        e = doc(e)
        e["guest_count"] = await db.guests.count_documents({"event_id": e["id"]})
        result.append(e)
    return result

@api_router.get("/visitor/events/{event_id}")
async def visitor_get_event(event_id: str, current_user=Depends(get_visitor_or_user)):
    """Get event details for visitor view"""
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
    except Exception:
        raise HTTPException(404, "Event nicht gefunden")
    if not event:
        raise HTTPException(404, "Event nicht gefunden")
    return doc(event)

@api_router.get("/visitor/events/{event_id}/guests")
async def visitor_list_guests(event_id: str, current_user=Depends(get_visitor_or_user)):
    """List guests for visitor view (read-only)"""
    guests = await db.guests.find({"event_id": event_id}).sort("last_name", 1).to_list(2000)
    return [doc(g) for g in guests]

@api_router.get("/visitor/events/{event_id}/seating")
async def visitor_get_seating(event_id: str, current_user=Depends(get_visitor_or_user)):
    """Get seating plan for visitor view (read-only)"""
    plan = await db.seating_plans.find_one({"event_id": event_id})
    if not plan:
        return {"event_id": event_id, "tables": []}
    return {"event_id": event_id, "tables": plan.get("tables", [])}

@api_router.get("/visitor/events/{event_id}/menu")
async def visitor_get_menu(event_id: str, current_user=Depends(get_visitor_or_user)):
    """Get menu for visitor view (read-only)"""
    items = await db.menu_items.find({"event_id": event_id}).sort("category", 1).to_list(500)
    return [doc(item) for item in items]


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    client.close()
