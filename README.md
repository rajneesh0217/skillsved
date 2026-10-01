# Skillsved Website V1

## Required assets
Copy your existing files to these exact paths:
- `frontend/assets/images/skillsved-logo.png`
- `frontend/assets/videos/skillsved-hero-data-ai.mp4`

## Run on Windows PowerShell
```powershell
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```
Open `http://127.0.0.1:8000`.

API docs: `http://127.0.0.1:8000/docs`

The contact form saves enquiries to `database/skillsved.db` automatically.

Student Login points to `https://login.skillsved.com`; authentication/student portal is intentionally a separate future module.
