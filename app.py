import os
import sys
import json
import random
import re
import smtplib
import datetime
from datetime import timedelta
from typing import Optional, List, Dict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- CONFIGURATION ---
load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Pour Vercel, on utilise /tmp si on doit vraiment écrire un fichier, 
# mais avec Neon/Postgres, SQLite n'est qu'un fallback local.
DB_PATH = os.path.join(BASE_DIR, "2heures17.db")
SECRET_KEY = os.getenv("SECRET_KEY", "une-cle-super-secrete-pour-la-nuit")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "landrytchonda@gmail.com")

# --- DATABASE SETUP ---
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    # SQLite needs check_same_thread: False
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Fix for common postgres:// vs postgresql:// issue in deployment platforms
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Optimisation pour PostgreSQL sur Vercel (pool_size, max_overflow)
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENUMS & SCHEMAS ---
class UserRole(str, re.Enum if hasattr(re, 'Enum') else object): # Fallback for enum
    pass

from enum import Enum
class UserRole(str, Enum):
    USER = "user"
    VOLUNTEER = "volunteer"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

class CrisisLevel(int, Enum):
    NORMAL = 0
    LOW = 1
    MODERATE = 2
    EMERGENCY = 3

class AlertType(str, Enum):
    EMERGENCY = "emergency"
    CRISIS_DETECTED = "crisis_detected"

class AlertStatus(str, Enum):
    PENDING = "pending"
    RESOLVED = "resolved"

class StandardResponse(BaseModel):
    status: str = "success"
    message: str
    data: Optional[dict] = None

class UserBase(BaseModel):
    pseudo: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    role: UserRole
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class MoodLogCreate(BaseModel):
    mood_score: int
    note: Optional[str] = None

class AlertCreate(BaseModel):
    type: str
    severity: CrisisLevel
    message: str

class UserRoleUpdate(BaseModel):
    role: UserRole

class RatingCreate(BaseModel):
    score: int
    comment: Optional[str] = None
    volunteer_id: Optional[int] = None

class MessageCreate(BaseModel):
    content: str
    room_id: str

# --- MODELS ---
class UserModel(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    pseudo = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(String(20), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    messages_sent = relationship("MessageModel", back_populates="sender", foreign_keys="MessageModel.sender_id")
    mood_logs = relationship("MoodLogModel", back_populates="user")
    alerts = relationship("AlertModel", back_populates="user")

class MessageModel(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    room_id = Column(String(100), index=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    sender = relationship("UserModel", back_populates="messages_sent", foreign_keys=[sender_id])

class AlertModel(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String(50))
    status = Column(String(20), default="pending")
    severity = Column(Integer)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("UserModel", back_populates="alerts")

class MoodLogModel(Base):
    __tablename__ = "mood_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mood_score = Column(Integer)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("UserModel", back_populates="mood_logs")

class RatingModel(Base):
    __tablename__ = "ratings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    score = Column(Integer)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class TestimonialModel(Base):
    __tablename__ = "testimonials"
    id = Column(Integer, primary_key=True, index=True)
    author = Column(String(50))
    content = Column(Text)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# --- HELPERS ---
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def detect_crisis(text: str) -> CrisisLevel:
    if not text: return CrisisLevel.NORMAL
    text = text.lower()
    emergencies = [r"je veux mourir", r"je vais me suicider", r"me donner la mort", r"en finir avec la vie", r"adieu tout le monde", r"plus envie de vivre", r"tout est fini pour moi"]
    moderates = [r"j'en peux plus", r"trop de souffrance", r"je suis au bout", r"tout s'écroule", r"je n'ai plus d'espoir", r"j'abandonne"]
    lows = [r"je suis triste", r"ça va pas", r"besoin d'aide", r"seul", r"pas le moral"]
    for p in emergencies: 
        if re.search(p, text): return CrisisLevel.EMERGENCY
    for p in moderates: 
        if re.search(p, text): return CrisisLevel.MODERATE
    for p in lows: 
        if re.search(p, text): return CrisisLevel.LOW
    return CrisisLevel.NORMAL

AI_RESPONSES = {
    "greeting": ["Bonjour, je suis l'IA de 2heures17. Je suis là pour t'écouter.", "Salut, comment se passe ta nuit ?", "Je suis présent si tu as besoin de parler."],
    "crisis": ["Je lis que tu traverses un moment très difficile. J'ai alerté nos bénévoles.", "S'il te plaît, reste avec moi. Tu es précieux.", "Ta vie a de la valeur. Nous sommes là."],
    "default": ["Je comprends. Peux-tu m'en dire plus ?", "Je t'écoute. N'hésite pas à vider ton sac.", "C'est important ce que tu partages."],
    "help": ["On va trouver une solution ensemble. Veux-tu essayer un exercice de respiration ?", "Il y a toujours de l'espoir."]
}

def get_ai_response(user_message: str, crisis_score: CrisisLevel) -> str:
    text = user_message.lower()
    if crisis_score >= CrisisLevel.MODERATE: return random.choice(AI_RESPONSES["crisis"])
    if any(w in text for w in ["bonjour", "salut", "coucou", "hello"]): return random.choice(AI_RESPONSES["greeting"])
    if any(w in text for w in ["aide", "aider", "secours", "sos"]): return random.choice(AI_RESPONSES["help"])
    return random.choice(AI_RESPONSES["default"])

def send_sos_email(user_pseudo: str, user_email: str, message: str):
    subject = f"🚨 ALERTE SOS CRITIQUE : {user_pseudo}"
    body = f"ALERTE SOS DÉCLENCHÉE SUR 2HEURES17\n\n- Pseudo : {user_pseudo}\n- Email : {user_email}\n\nMessage :\n{message}"
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"\n[SIMULATION EMAIL SOS]\nDest: {ADMIN_EMAIL}\nSubj: {subject}\n{body}\n")
        return True
    try:
        msg = MIMEMultipart()
        msg['From'], msg['To'], msg['Subject'] = SMTP_USER, ADMIN_EMAIL, subject
        msg.attach(MIMEText(body, 'plain'))
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Erreur Email: {e}")
        return False

# --- APP SETUP ---
# On ne crée les tables que si nécessaire (évite les erreurs sur Vercel si DB_URL est absente au build)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database init error (normal if build time): {e}")
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="2heures17 Unified API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.update({"X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "X-XSS-Protection": "1; mode=block"})
    return response

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class ConnectionManager:
    def __init__(self): self.active_connections: Dict[str, List[WebSocket]] = {}
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections: self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections: self.active_connections[room_id].remove(websocket)
    async def broadcast(self, message: str, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]: await connection.send_text(message)

manager = ConnectionManager()

# --- ROUTES ---
@app.post("/api/auth/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(UserModel).filter(UserModel.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = UserModel(pseudo=user.pseudo, email=user.email, hashed_password=get_password_hash(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    return {"access_token": create_access_token(data={"sub": user.email}), "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload: raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(UserModel).filter(UserModel.email == payload.get("sub")).first()
    if not user: raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/api/users/me", response_model=User)
def read_users_me(current_user: UserModel = Depends(get_current_user)): return current_user

@app.get("/api/messages/unread/count")
def get_unread_count(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.VOLUNTEER]:
        count = db.query(MessageModel).filter(MessageModel.is_read == False, MessageModel.sender_id != current_user.id).count()
        return {"unread_count": count}
    return {"unread_count": 0}

@app.post("/api/messages/mark-read")
def mark_messages_as_read(room_id: str, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(MessageModel).filter(MessageModel.room_id == room_id, MessageModel.sender_id != current_user.id).update({"is_read": True})
    db.commit()
    return {"status": "success"}

@app.post("/api/mood", response_model=StandardResponse)
def log_mood(mood: MoodLogCreate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(MoodLogModel(user_id=current_user.id, mood_score=mood.mood_score, note=mood.note))
    db.commit()
    return StandardResponse(message="Humeur enregistrée")

@app.post("/api/sos", response_model=StandardResponse)
def trigger_sos(alert: AlertCreate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(AlertModel(user_id=current_user.id, type=alert.type, severity=alert.severity.value, message=alert.message, status=AlertStatus.PENDING))
    db.commit()
    send_sos_email(current_user.pseudo, current_user.email, alert.message)
    return StandardResponse(message="Alerte SOS envoyée")

@app.get("/api/admin/users")
def get_all_users(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]: raise HTTPException(status_code=403)
    q = db.query(UserModel)
    return q.filter(UserModel.id != current_user.id).all() if current_user.role == UserRole.SUPERADMIN else q.filter(UserModel.role != UserRole.SUPERADMIN).all()

@app.patch("/api/admin/users/{user_id}/role", response_model=StandardResponse)
def update_user_role(user_id: int, role_update: UserRoleUpdate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]: raise HTTPException(status_code=403)
    target = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not target or (target.role == UserRole.SUPERADMIN and current_user.role != UserRole.SUPERADMIN): raise HTTPException(status_code=403)
    target.role = role_update.role
    db.commit()
    return StandardResponse(message=f"Rôle mis à jour")

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]: raise HTTPException(status_code=403)
    target = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not target or target.id == current_user.id or (target.role == UserRole.SUPERADMIN and current_user.role != UserRole.SUPERADMIN): raise HTTPException(status_code=403)
    db.delete(target); db.commit()
    return StandardResponse(message="Supprimé")

@app.get("/api/admin/stats")
def get_stats(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]: raise HTTPException(status_code=403)
    return {"total_users": db.query(UserModel).count(), "total_alerts": db.query(AlertModel).count(), "active_sessions": len(manager.active_connections)}

# --- HTTP CHAT FALLBACK ---
@app.get("/api/chat/messages/{room_id}")
def get_chat_messages(room_id: str, last_id: int = 0, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(MessageModel).filter(
        MessageModel.room_id == room_id,
        MessageModel.id > last_id
    ).order_by(MessageModel.id.asc()).limit(50).all()
    
    results = []
    for m in messages:
        sender = db.query(UserModel).filter(UserModel.id == m.sender_id).first()
        results.append({
            "id": m.id,
            "sender": sender.pseudo if sender else "Anonyme",
            "content": m.content,
            "timestamp": m.created_at.isoformat(),
            "crisis_score": 0 # Not stored in DB for every message to keep it simple
        })
    return results

@app.post("/api/chat/messages/{room_id}")
async def send_chat_message_http(room_id: str, msg: MessageCreate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Crisis detection
    score = detect_crisis(msg.content)
    
    # 2. Alert if necessary
    if score >= CrisisLevel.MODERATE:
        db.add(AlertModel(user_id=current_user.id, type="crisis_detected", severity=score.value, message=f"HTTP: {msg.content}"))
    
    # 3. Save message
    new_msg = MessageModel(content=msg.content, sender_id=current_user.id, room_id=room_id)
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # 4. AI Response if user is alone (simulated)
    ai_response = None
    # On simple HTTP, we always return an AI response if it's a normal user message
    if current_user.role == UserRole.USER:
        ai_content = get_ai_response(msg.content, score)
        ai_msg = MessageModel(content=ai_content, sender_id=None, room_id=room_id) # None sender = IA
        db.add(ai_msg)
        db.commit()
        ai_response = ai_content

    return {
        "status": "success",
        "message_id": new_msg.id,
        "ai_response": ai_response,
        "crisis_score": score
    }

@app.websocket("/ws/chat/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, db: Session = Depends(get_db)):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            content, sender = msg_data.get("content", ""), msg_data.get("sender", "Anonyme")
            score = detect_crisis(content)
            user = db.query(UserModel).filter(UserModel.pseudo == sender).first()
            if score >= CrisisLevel.MODERATE:
                db.add(AlertModel(user_id=user.id if user else None, type="crisis_detected", severity=score.value, message=f"IA: {content}"))
                db.commit()
                await manager.broadcast(json.dumps({"sender": "Système", "content": "⚠️ Alerte transmise.", "timestamp": datetime.datetime.now().isoformat(), "crisis_score": score}), room_id)
            db.add(MessageModel(content=content, sender_id=user.id if user else None, room_id=room_id))
            db.commit()
            await manager.broadcast(json.dumps({"sender": sender, "content": content, "timestamp": datetime.datetime.now().isoformat(), "crisis_score": score}), room_id)
            if len(manager.active_connections.get(room_id, [])) <= 1:
                import asyncio; await asyncio.sleep(1)
                ai_msg = {"sender": "IA", "content": get_ai_response(content, score), "timestamp": datetime.datetime.now().isoformat(), "crisis_score": 0}
                await manager.broadcast(json.dumps(ai_msg), room_id)
    except WebSocketDisconnect: manager.disconnect(websocket, room_id)
    except Exception: manager.disconnect(websocket, room_id)

# --- STATIC FILES ---
# On utilise BASE_DIR défini plus haut pour localiser les fichiers
app.mount("/js", StaticFiles(directory=os.path.join(BASE_DIR, "js")), name="js")
app.mount("/css", StaticFiles(directory=os.path.join(BASE_DIR, "css")), name="css")

@app.get("/")
async def read_index(): 
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/{file_path:path}")
async def serve_static_files(file_path: str):
    full_path = os.path.join(BASE_DIR, file_path)
    if os.path.isfile(full_path):
        return FileResponse(full_path)
    
    # Si c'est une route API non trouvée
    if file_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"status": "error", "message": "API Not Found"})
    
    # Sinon fallback sur 404.html
    return FileResponse(os.path.join(BASE_DIR, "404.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8008))
    print(f"🚀 Server running on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
