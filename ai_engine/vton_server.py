import os
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64

app = Flask(__name__)
CORS(app)

def process_vton(person_img, garment_img):
    h, w = person_img.shape[:2]
    
    # 1. Simple Body Segmentation using GrabCut
    # We define a box in the middle where the person usually is
    mask = np.zeros(person_img.shape[:2], np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    
    # Box: [start_x, start_y, width, height]
    # We assume the person is in the center 60% of the image
    rect = (int(w*0.2), int(h*0.1), int(w*0.6), int(h*0.8))
    
    try:
        cv2.grabCut(person_img, mask, rect, bgdModel, fgdModel, 3, cv2.GC_INIT_WITH_RECT)
        mask2 = np.where((mask==2)|(mask==0), 0, 1).astype('uint8')
    except:
        mask2 = np.ones((h, w), np.uint8)

    # 2. Setup Garment
    gh, gw = garment_img.shape[:2]
    # Scale garment to ~45% of person width
    target_w = int(w * 0.48)
    target_h = int(target_w * (gh / gw))
    
    resized_garment = cv2.resize(garment_img, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
    
    # 3. Placement (Chest Center)
    start_x = int(w/2 - target_w/2)
    start_y = int(h*0.35) # Chest level
    
    # Overlay logic
    result = person_img.copy()
    
    y1, y2 = max(0, start_y), min(h, start_y + target_h)
    x1, x2 = max(0, start_x), min(w, start_x + target_w)
    
    gy1, gy2 = max(0, -start_y), min(target_h, h - start_y)
    gx1, gx2 = max(0, -start_x), min(target_w, w - start_x)
    
    if x2 > x1 and y2 > y1:
        if resized_garment.shape[2] == 4:
            g_rgb = resized_garment[gy1:gy2, gx1:gx2, :3]
            g_alpha = resized_garment[gy1:gy2, gx1:gx2, 3] / 255.0
        else:
            g_rgb = resized_garment[gy1:gy2, gx1:gx2]
            g_alpha = np.ones((y2-y1, x2-x1))
            
        # Apply the garment with alpha blending
        for c in range(3):
            # Blend with person image
            result[y1:y2, x1:x2, c] = result[y1:y2, x1:x2, c] * (1 - g_alpha) + g_rgb[:, :, c] * g_alpha
            
    return result

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        person_b64 = data['person'].split(',')[1]
        garment_b64 = data['garment'].split(',')[1]
        
        person_bytes = base64.b64decode(person_b64)
        garment_bytes = base64.b64decode(garment_b64)
        
        person_img = cv2.imdecode(np.frombuffer(person_bytes, np.uint8), cv2.IMREAD_COLOR)
        garment_img = cv2.imdecode(np.frombuffer(garment_bytes, np.uint8), cv2.IMREAD_UNCHANGED)
        
        result_img = process_vton(person_img, garment_img)
        
        _, buffer = cv2.imencode('.jpg', result_img)
        result_b64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'status': 'success',
            'result': f"data:image/jpeg;base64,{result_b64}"
        })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    print("Local AI Engine (OpenCV GrabCut) starting on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, threaded=True)
