import cv2
import pytesseract
import numpy as np
import re
from typing import Dict, Any

def extract_text_from_image(image_bytes: bytes) -> Dict[str, Any]:
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)[1]
        text = pytesseract.image_to_string(gray, lang="eng")

        match = re.search(r'Position actuelle.*?(\d+°\s*[NSEWO])', text, re.DOTALL)
        position = match.group(1) if match else None

        return {
            "position": position,
            "success": position is not None
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }