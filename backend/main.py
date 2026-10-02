from pathlib import Path
import os
import re
import sqlite3
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR / 'frontend'
DB_DIR = BASE_DIR / 'database'
DB_PATH = DB_DIR / 'skillsved.db'
DB_DIR.mkdir(parents=True, exist_ok=True)

ADMIN_API_KEY = os.getenv("SKILLSVED_ADMIN_API_KEY")

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
    program: str = Field(default='', max_length=120)
    city: str = Field(default='', max_length=80)
    expectation: str = Field(default='', max_length=100)

@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'Skillsved API'}


def verify_admin_key(x_admin_key: str | None = Header(default=None)):
    if not ADMIN_API_KEY:
        raise HTTPException(
            status_code=503,
            detail='Admin access is not configured.'
        )

    if x_admin_key != ADMIN_API_KEY:
        raise HTTPException(
            status_code=401,
            detail='Invalid admin credentials.'
        )

    return True

@app.post('/api/contact', status_code=201)
def contact(payload: ContactRequest):
    name = payload.name.strip()
    email = str(payload.email).strip().lower()
    phone = payload.phone.strip()
    profile = payload.profile.strip()
    message = payload.message.strip()
    program = payload.program.strip()
    city = payload.city.strip()
    expectation = payload.expectation.strip()

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

    allowed_programs = {
        'Data Analytics with GenAI & Agentic AI'
    }

    allowed_expectations = {
        'Salary Growth',
        'Upskilling',
        'Job Switch',
        'Start a Career in Data & AI',
        'Learning / Knowledge',
        'Other'
    }

    if program not in allowed_programs:
        raise HTTPException(422, 'Please select a valid program.')

    if len(city) < 2:
        raise HTTPException(422, 'Please enter a valid city.')

    if expectation not in allowed_expectations:
        raise HTTPException(422, 'Please select a valid expectation.')

    created_at = datetime.now(timezone.utc).isoformat()

    try:
        with sqlite3.connect(DB_PATH) as conn:
            cur = conn.execute(
                '''
                INSERT INTO enquiries
                (
                    name,
                    email,
                    phone,
                    profile,
                    message,
                    created_at,
                    program,
                    city,
                    expectation
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    name,
                    email,
                    phone,
                    profile,
                    message,
                    created_at,
                    program,
                    city,
                    expectation
                )
            )
            conn.commit()
            enquiry_id = cur.lastrowid

    except sqlite3.Error:
        raise HTTPException(
            status_code=500,
            detail='Unable to save your enquiry. Please try again.'
        )

    return {
        'status': 'success',
        'message': 'Enquiry received.',
        'id': enquiry_id
    }

@app.get('/api/admin/enquiries')
def get_enquiries(_: bool = Depends(verify_admin_key)):
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row

            rows = conn.execute(
                '''
                SELECT
    id,
    name,
    email,
    phone,
    program,
    profile,
    city,
    expectation,
    message,
    created_at
FROM enquiries
                ORDER BY id DESC
                '''
            ).fetchall()

    except sqlite3.Error:
        raise HTTPException(
            status_code=500,
            detail='Unable to load enquiries.'
        )

    return {
        'status': 'success',
        'count': len(rows),
        'enquiries': [dict(row) for row in rows]
    }

@app.get('/')
def home():
    return FileResponse(FRONTEND_DIR / 'index.html')

app.mount('/', StaticFiles(directory=FRONTEND_DIR, html=True), name='frontend')
