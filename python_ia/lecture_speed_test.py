from fastapi import FastAPI, UploadFile, File, HTTPException
import cv2
import pytesseract
import numpy as np
import re
from typing import Dict, Any

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = FastAPI()

def extract_speed_values_from_image(image: np.ndarray) -> Dict[str, Any]:
    height, width, _ = image.shape
    top_crop = image[0:int(height * 0.4), :]

    gray = cv2.cvtColor(top_crop, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    _, binary = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    #-------
    custom_config = r'--oem 3 --psm 6 -l fra+eng'
    text = pytesseract.image_to_string(binary, config=custom_config)

    print("Texte brut OCR:\n", text)

    values = {
        "descendant": None,
        "ascendant": None,
        "ping": None
    }

    lines = [line.strip() for line in text.split('\n') if line.strip() != '']

    for i, line in enumerate(lines):
        line_lower = line.lower()

        if "ping" in line_lower:
            match = re.search(r"(\d+)", line)
            if match:
                values["ping"] = int(match.group(1))

        if "descendant" in line_lower:
            if i + 1 < len(lines):
                numbers = re.findall(r"(\d+[.,]\d+)", lines[i + 1])
                if len(numbers) >= 1:
                    values["descendant"] = float(numbers[0].replace(',', '.'))

        if "ascendant" in line_lower:
            if i + 1 < len(lines):
                numbers = re.findall(r"(\d+[.,]\d+)", lines[i + 1])
                if len(numbers) >= 2:
                    values["ascendant"] = float(numbers[1].replace(',', '.'))
                elif len(numbers) == 1:
                    values["ascendant"] = float(numbers[0].replace(',', '.'))

    return values


@app.post("/extract-speedtest/")
async def extract_speedtest(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")

    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Impossible de décoder l'image")

        results = extract_speed_values_from_image(image)

        return {
            "success": True,
            "descendant": results["descendant"],
            "ascendant": results["ascendant"],
            "ping": results["ping"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
