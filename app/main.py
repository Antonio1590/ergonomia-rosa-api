from fastapi import FastAPI
from app.routes.posture import router as posture_router

app = FastAPI()

app.include_router(posture_router)

@app.get("/")
def root():
    return {
        "message": "ROSA Expert API funcionando"
    }