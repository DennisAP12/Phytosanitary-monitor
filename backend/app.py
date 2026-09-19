import base64
import io
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
from PIL import Image

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


BACKEND_DIR = Path(__file__).resolve().parent
MODEL_PATH = BACKEND_DIR / "models" / "best.pt"
STORAGE_DIR = BACKEND_DIR / "storage" / "images"
DATABASE_PATH = BACKEND_DIR / "storage" / "detecciones.db"

STORAGE_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB
CORS(app)
model = None
CLASS_NAMES = {
    0: "sano",
    1: "verde",
    2: "infectado",
}


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_image TEXT NOT NULL,
                processed_image TEXT NOT NULL,
                detections TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


def get_model():
    global model

    if model is not None:
        return model

    if YOLO is None:
        raise RuntimeError(
            "Falta instalar ultralytics. Ejecuta: pip install -r requirements.txt"
        )

    if not MODEL_PATH.exists():
        raise RuntimeError(f"No se encontró el modelo en {MODEL_PATH}")

    model = YOLO(str(MODEL_PATH))
    if hasattr(model, "model") and hasattr(model.model, "names"):
        model.model.names = CLASS_NAMES
    return model


def decode_image(data_url):
    if "," in data_url:
        _, encoded_data = data_url.split(",", 1)
    else:
        encoded_data = data_url

    image_bytes = base64.b64decode(encoded_data)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return image, image_bytes


def save_image(image, filename):
    path = STORAGE_DIR / filename
    image.save(path, format="JPEG", quality=92)
    return path


def serialize_analysis(row):
    return {
        "id": row["id"],
        "originalImage": f"/media/{row['original_image']}",
        "processedImage": f"/media/{row['processed_image']}",
        "detections": json.loads(row["detections"]),
        "createdAt": row["created_at"],
    }


initialize_database()


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "modelPresent": MODEL_PATH.exists(),
        "database": str(DATABASE_PATH),
    })


@app.post("/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    image_data = data.get("image")

    if not image_data:
        return jsonify({"error": "No se recibió ninguna imagen"}), 400

    try:
        image, _ = decode_image(image_data)

        max_dimension = 1280
        width, height = image.size
        if max(width, height) > max_dimension:
            scale = max_dimension / max(width, height)
            image = image.resize(
                (max(1, int(width * scale)), max(1, int(height * scale))),
                Image.Resampling.LANCZOS,
            )

        detector = get_model()
        conf_threshold = float(data.get("confidence", 0.04))
        results = detector.predict(source=image, conf=conf_threshold, imgsz=640, verbose=False)
        result = results[0]

        detections = []
        for box in result.boxes:
            class_id = int(box.cls[0])
            fallback_name = (
                detector.names.get(class_id, f"Clase {class_id}")
                if hasattr(detector, "names") and isinstance(detector.names, dict)
                else f"Clase {class_id}"
            )
            class_name = CLASS_NAMES.get(class_id, fallback_name)

            detections.append({
                "class": class_name,
                "classId": class_id,
                "confidence": round(float(box.conf[0]), 3),
                "box": [round(float(value), 2) for value in box.xyxy[0].tolist()],
            })

        annotated_image = result.plot(line_width=2)
        success, encoded_image = cv2.imencode(".jpg", annotated_image)
        if not success:
            raise RuntimeError("No se pudo generar la imagen procesada")

        timestamp = datetime.now(timezone.utc)
        filename_prefix = timestamp.strftime("%Y%m%d_%H%M%S_%f")
        original_filename = f"{filename_prefix}_original.jpg"
        processed_filename = f"{filename_prefix}_processed.jpg"

        save_image(image, original_filename)
        processed_path = STORAGE_DIR / processed_filename
        processed_path.write_bytes(encoded_image.tobytes())

        created_at = timestamp.isoformat()
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO analyses
                    (original_image, processed_image, detections, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (
                    original_filename,
                    processed_filename,
                    json.dumps(detections),
                    created_at,
                ),
            )
            analysis_id = cursor.lastrowid
            connection.commit()

        base_url = request.host_url.rstrip("/")

        return jsonify({
            "id": analysis_id,
            "processedImage": f"{base_url}/media/{processed_filename}",
            "originalImage": f"{base_url}/media/{original_filename}",
            "analysis": {
                "status": "OK",
                "detections": detections,
                "count": len(detections),
            },
        })
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.get("/analyses")
def analyses():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM analyses ORDER BY id DESC"
        ).fetchall()

    return jsonify([serialize_analysis(row) for row in rows])


@app.get("/media/<path:filename>")
def media(filename):
    return send_from_directory(STORAGE_DIR, filename)


@app.get("/api/esp32/capture")
def proxy_esp32_capture():
    import urllib.request
    candidate_urls = [
        "http://192.168.4.1/capture",
        "http://192.168.4.1:81/capture",
        "http://localhost:81/capture",
    ]
    for url in candidate_urls:
        try:
            with urllib.request.urlopen(url, timeout=3) as resp:
                data = resp.read()
                return Response(data, mimetype="image/jpeg")
        except Exception:
            continue
    return jsonify({"error": "La ESP32-CAM no respondió"}), 502



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
