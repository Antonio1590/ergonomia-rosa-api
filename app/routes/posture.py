from fastapi import APIRouter, UploadFile, File
from PIL import Image
import io

router = APIRouter()

@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    contents = await file.read()

    image = Image.open(
        io.BytesIO(contents)
    )

    width, height = image.size

    return {
        "success": True,
        "width": width,
        "height": height,
        "filename": file.filename,
        "rosa_score": 3,
        "risk_level": "Bajo",
        "neck_angle": 12,
        "trunk_angle": 8,
        "legs_angle": 90
    }