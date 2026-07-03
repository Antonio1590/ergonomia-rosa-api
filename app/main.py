from fastapi import FastAPI
import mediapipe as mp

app = FastAPI()

@app.get("/")
def root():
    return {
        "mediapipe_version": getattr(mp, "__version__", "Sin versión"),
        "mediapipe_file": getattr(mp, "__file__", "Desconocido"),
        "has_solutions": hasattr(mp, "solutions"),
        "attributes": dir(mp)
    }