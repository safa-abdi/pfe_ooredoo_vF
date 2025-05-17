from http.client import HTTPException
from typing import Any, Dict
from fastapi import FastAPI, UploadFile, File
import pytesseract
import cv2
import re
import json
import numpy as np
from speedtest.service import extract_speed_values_from_image
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = FastAPI()

def remove_empty_borders(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image
        
    x, y, w, h = cv2.boundingRect(contours[0])
    return image[y:y+h, x:x+w]

def preprocess_image_for_ooredoo(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    gray = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                cv2.THRESH_BINARY, 11, 2)
    
    return gray

def extract_ooredoo_speedtest_data(text: str) -> Dict[str, Any]:

    text = re.sub(r'\s+', ' ', text).strip()
    
    data = {
        "operator": "Ooredoo",
        "has_ads": "publicités" in text.lower(),
        "is_5g": "5G" in text,
        "test_id": None,
        "location": None,
        "promo_code": None
    }
    
    test_id_match = re.search(r'Identifiant du test\s*(\d+)', text)
    if test_id_match:
        data["test_id"] = test_id_match.group(1)
    
    promo_code_match = re.search(r'([A-Z0-9]{8,12})\s*Identifiant', text)
    if promo_code_match:
        data["promo_code"] = promo_code_match.group(1)
    
    location_match = re.search(r'OOREDOO 5G\s*(.*?)\s*\*{2}', text)
    if location_match:
        data["location"] = location_match.group(1).strip()
    
    return data

def extract_signal_metrics(text: str) -> Dict[str, Any]:
    metrics = {}
    neighbors_5g = []
    neighbors_4g = []

    text = re.sub(r"[’‘`´']", "'", text)
    text = re.sub(r"\bL\b", "", text)
    text = re.sub(r"[^\w\s=.\-+%dBmG]", " ", text)

    pattern = r"""
        (SINR[- ]?[5S]G|               
         SINR[- ]?4G|                  
         RSR[QO][- ]?[5S]G|           
         RSR[QO][- ]?4G|              
         RSSI[- ]?[5S]G|RSSI[- ]?4G|
         RSRP[- ]?[5S]G|RSRP[- ]?4G)
        \s*[='I]?\s*
        (-?\d+\.?\d*)                  
        \s*
        (dBm?|dB)
    """

    matches = re.findall(pattern, text, re.VERBOSE)

    def normalize_metric(metric: str) -> str:
        metric = metric.upper()
        metric = metric.replace("RSRO", "RSRQ")  
        metric = metric.replace("SG", "5G")       
        metric = re.sub(r'(?<=-)[S](?=G)', '5', metric)
        metric = re.sub(r'(SINR|RSRQ|RSSI|RSRP)[- ]?(4G|5G)', r'\1-\2', metric)
        return metric

    for metric, value, unit in matches:
        corrected_metric = normalize_metric(metric)
        metrics[corrected_metric] = f"{value}{unit}"

    # Extraction infos cellules voisines
    neighbor_lines = re.findall(r"Informations sur les cellules voisines 5G\s+(.*?)\s+Informations sur les cellules voisines 4G", text, re.DOTALL)
    if neighbor_lines:
        lines_5g = neighbor_lines[0].strip().splitlines()
        for line in lines_5g:
            values = re.findall(r"-?\d+\.?\d*", line)
            if len(values) >= 5:
                band, pci, rsrp, rsrq, sinr = values[:5]
                neighbors_5g.append({
                    "pci": pci,
                })

    neighbor_lines_4g = re.findall(r"Informations sur les cellules voisines 4G\s+(.*)", text, re.DOTALL)
    if neighbor_lines_4g:
        lines_4g = neighbor_lines_4g[0].strip().splitlines()
        for line in lines_4g:
            values = re.findall(r"-?\d+\.?\d*", line)
            if len(values) >= 5:
                band, pci, rsrp, rsrq, sinr = values[:5]
                neighbors_4g.append({
                    "pci": pci,
                })

    metrics['neighbors_5G'] = neighbors_5g
    metrics['neighbors_4G'] = neighbors_4g

    return metrics
def process_image(image_bytes: bytes) -> Dict[str, Any]:
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

        text = pytesseract.image_to_string(gray, lang="fra+eng")
        print(text)
        
        signal_metrics = extract_signal_metrics(text)
        
        return {
            "success": True,
            "signal_metrics": signal_metrics,
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/process-ooredoo-image/")
async def process_coredoo_image(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")

    try:
        contents = await file.read()
        result = process_image(contents)

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Erreur de traitement"))

        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/extract-text/")
async def extract_text(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)[1]
        text = pytesseract.image_to_string(gray, lang="eng")

        match = re.search(r'Position actuelle.*?(\d+°\s*[NSEWO])', text, re.DOTALL)
        position = match.group(1) if match else None

        output = {
            "position": position,
            "success": position is not None
        }
        return output

    except Exception as e:
        return {"error": str(e)}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)