from fastapi import APIRouter, UploadFile, File
from PIL import Image
import io
import cv2
import numpy as np

from app.services.mediapipe_service import detect_pose

router = APIRouter()


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    contents = await file.read()

    image = Image.open(
        io.BytesIO(contents)
    )

    width, height = image.size

    image_np = np.array(image)

    image_cv = cv2.cvtColor(
        image_np,
        cv2.COLOR_RGB2BGR
    )

    result = detect_pose(
        image_cv
    )

    if result is None:

        return {

            "success": False,

            "message": "No se detectó ninguna persona.",

            "width": width,

            "height": height

        }

    return {

        "success": True,

        "width": width,

        "height": height,

        "filename": file.filename,

        "angles": result["angles"],

        "rosa": result["rosa"],

        "landmarks": result["landmarks"]

    }