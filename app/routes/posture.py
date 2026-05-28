from fastapi import APIRouter, UploadFile, File
from app.services.mediapipe_service import analyze_posture

import shutil


router = APIRouter()


@router.post("/analyze")

async def analyze_image(
    file: UploadFile = File(...)
):

    temp_file = f"temp_{file.filename}"

    with open(temp_file, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    result = analyze_posture(
        temp_file
    )

    return result