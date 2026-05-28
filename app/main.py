from fastapi import FastAPI

from app.routes.posture import router as posture_router

app = FastAPI(
    title="ROSA Expert API"
)

app.include_router(
    posture_router
)

@app.get("/")

async def root():

    return {
        "message": "ROSA Expert API funcionando"
    }