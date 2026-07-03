from fastapi import FastAPI
from app.routes.posture import router

app = FastAPI()

app.include_router(router)

@app.get("/")
def root():
    return {
        "message": "ROSA Expert API funcionando"
    }