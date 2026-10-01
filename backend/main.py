from pathlib import Path
import re, sqlite3
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR / 'frontend'
DB_DIR = BASE_DIR / 'database'
DB_PATH = DB_DIR / 'skillsved.db'
DB_DIR.mkdir(parents=True, exist_ok=True)

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS enquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
            profile TEXT NOT NULL, message TEXT, created_at TEXT NOT NULL
        )''')
        conn.commit()
init_db()

app = FastAPI(title='Skillsved', description='Skillsved website and enquiry API', version='1.0.0')

class ContactRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone: str = Field(default='', max_length=20)
    profile: str = Field(min_length=2, max_length=50)
    message: str = Field(default='', max_length=500)

@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'Skillsved API'}

@app.post('/api/contact', status_code=201)
def contact(payload: ContactRequest):
    name = payload.name.strip()
    email = str(payload.email).strip().lower()
    phone = payload.phone.strip()
    profile = payload.profile.strip()
    message = payload.message.strip()

    if phone and not re.fullmatch(r'[0-9+\-\s()]{7,20}', phone):
        raise HTTPException(422, 'Please enter a valid phone number.')

    allowed = {
        'Student',
        'Fresher',
        'Working Professional',
        'Career Break',
        'Other'
    }

    if profile not in allowed:
        raise HTTPException(422, 'Please select a valid profile.')

    created_at = datetime.now(timezone.utc).isoformat()

    try:

   with sqlite3.connect(DB_PATH) as conn:
            cur = conn.execute(
                '''
                INSERT INTO enquiries
                (name, email, phone, profile, message, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ''',
                (name, email, phone, profile, message, created_at)
            )
            conn.commit()
            enquiry_id = cur.lastrowid

    except sqlite3.Error:
        raise HTTPException(
            status_code=500,
            detail="Unable to save your enquiry. Please try again."
        )

    return {
        'status': 'success',
        'message': 'Enquiry received.',
        'id': enquiry_id
    }
    
@app.get('/')
def home():
    return FileResponse(FRONTEND_DIR / 'index.html')

app.mount('/', StaticFiles(directory=FRONTEND_DIR, html=True), name='frontend')
