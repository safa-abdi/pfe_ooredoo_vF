import cv2
import pytesseract
import numpy as np
import re
from typing import Dict, Any
from utils.image_utils import remove_empty_borders, preprocess_image_for_ooredoo

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

    neighbor_lines = re.findall(r"Informations sur les cellules voisines 5G\s+(.*?)\s+Informations sur les cellules voisines 4G", text, re.DOTALL)
    if neighbor_lines:
        lines_5g = neighbor_lines[0].strip().splitlines()
        for line in lines_5g:
            values = re.findall(r"-?\d+\.?\d*", line)
            if len(values) >= 5:
                neighbors_5g.append({"pci": values[1]})

    neighbor_lines_4g = re.findall(r"Informations sur les cellules voisines 4G\s+(.*)", text, re.DOTALL)
    if neighbor_lines_4g:
        lines_4g = neighbor_lines_4g[0].strip().splitlines()
        for line in lines_4g:
            values = re.findall(r"-?\d+\.?\d*", line)
            if len(values) >= 5:
                neighbors_4g.append({"pci": values[1]})

    metrics['neighbors_5G'] = neighbors_5g
    metrics['neighbors_4G'] = neighbors_4g

    return metrics

def process_ooredoo_image(image_bytes: bytes) -> Dict[str, Any]:
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img = remove_empty_borders(img)
        processed_img = preprocess_image_for_ooredoo(img)
        
        text = pytesseract.image_to_string(processed_img, lang="fra+eng")
        print(text)
        
        signal_metrics = extract_signal_metrics(text)
        ooredoo_data = extract_ooredoo_speedtest_data(text)
        
        return {
            "success": True,
            "signal_metrics": signal_metrics,
            "ooredoo_data": ooredoo_data
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }