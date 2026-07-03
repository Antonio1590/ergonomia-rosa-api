from PIL import Image
import io

def analyze_image(image_bytes):

    image = Image.open(
        io.BytesIO(image_bytes)
    )

    return {

        "status": "ok",

        "width": image.width,

        "height": image.height,

        "cuello": 18,

        "espalda": 12,

        "piernas": 5,

        "rosa_score": 4,

        "riesgo": "MEDIO"

    }