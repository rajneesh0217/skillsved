from fastapi import FastAPI

app = FastAPI(
    title="Skillsved API",
    description="Backend API for the Skillsved platform",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "status": "success",
        "message": "Skillsved backend is running"
    }