# 🍅 Phytosanitary Monitor

### Sistema de Diagnóstico Fitosanitario del jitomate

Sistema de análisis visual automatizado para la identificación de anomalias en cultivos de jitomate mediante **inteligencia artificial, visión por computadora y captura de imágenes**.

El proyecto integra una interfaz web desarrollada con **React**, un sistema de análisis mediante un modelo entrenado y almacenamiento de resultados mediante **SQLite**. La captura de imágenes puede realizarse de forma experimental, mediante una cámara **ESP32-CAM**.

---

## 📋 Descripción

Phytosanitary Monitor es una aplicación orientada al monitoreo visual de cultivos de jitomate.

El sistema permite capturar imágenes del jitomate, enviarlas al sistema de análisis y visualizar los resultados obtenidos. Además, cuenta con un historial de análisis y almacenamiento de las imágenes procesadas.

El proyecto busca facilitar la identificación de posibles enfermedades en los frutos del jitomate mediante herramientas de inteligencia artificial y visión por computadora.

---

## ✨ Características


- 📡 Soporte para transmisión mediante ESP32-CAM.
- 🤖 Análisis de imágenes mediante inteligencia artificial.
- 🔎 Identificación visual de anomalias.
- 🖼️ Visualización de imágenes originales y procesadas.
- 📥 Descarga de imágenes capturadas.
- 🗂️ Historial de análisis realizados.
- 💾 Almacenamiento de resultados mediante SQLite.
- 📱 Interfaz responsiva para computadora, tablet y dispositivos móviles.

---

## 🛠️ Tecnologías utilizadas

### Frontend
- React
- JavaScript
- HTML5
- CSS3

### Backend y análisis
- Python
- Modelo de inteligencia artificial
- YOLO
- OpenCV
- NumPy

### Base de datos
- SQLite

### Hardware
- FreeNove ESP32-CAM
- OV2640

### Herramientas
- Git
- GitHub
- Visual Studio Code
- Arduino IDE

---

## 🏗️ Arquitectura del sistema

```text
             📷 ESP32-CAM 
                         │
                         ▼
                  🌐 Interfaz React
                         │
                         ▼
                   🔌 API Backend
                         │
                         ▼
                  🤖 Modelo YOLO
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
      🖼️ Imagen procesada      📊 Resultados
                                    │
                                    ▼
                              🗄️ SQLite
```
---

# 🚀 Instalación

## 📌 Requisitos

Antes de ejecutar el proyecto se requiere:

- Node.js 14 o superior
- Python 3.10 o superior
- Navegador moderno
- Conexión WiFi local
- FreeNove ESP32-CAM con módulo OV2640 
- Modelo entrenado `best.pt`

---

## 💻 Configuración del Frontend

Desde la carpeta principal del proyecto:

```bash
cd deteccion-foliar
npm install
```

Después ejecuta:

```bash
npm start
```

La aplicación estará disponible en:

```text
http://localhost:3000
```

---

# 🤖 Configuración del Backend

El backend se encuentra dentro de la carpeta:

```text
backend/
```

Instala las dependencias:

```bash
cd backend
python -m pip install -r requirements.txt
```

Verifica la instalación de Python:

```bash
python --version
```

---

## 🧠 Modelo de inteligencia artificial

El modelo entrenado debe colocarse en:

```text
backend/models/best.pt
```

El archivo `best.pt` es utilizado por el backend para realizar el análisis de las imágenes recibidas.

---

## ▶️ Iniciar el Backend

Desde la carpeta `backend/`:

```bash
python app.py
```

Para comprobar que el backend está funcionando, visita:

```text
http://localhost:5000/health
```

La respuesta esperada debe indicar:

```json
{
  "status": "ok",
  "modelPresent": true
}
```

---

# 🔌 API

El sistema cuenta con los siguientes endpoints principales:

### `GET /health`

Comprueba el estado del backend y la disponibilidad del modelo.

### `POST /analyze`

Recibe una imagen desde la aplicación React y ejecuta el análisis mediante el modelo entrenado.

El proceso incluye:

- recepción de la imagen;
- procesamiento mediante el modelo;
- generación de la imagen con detecciones;
- almacenamiento de los resultados.

### `GET /analyses`

Obtiene el historial de análisis realizados.

### `GET /media/<archivo>`

Permite acceder a las imágenes almacenadas.

---

# 💾 Almacenamiento

Los resultados se almacenan dentro de:

```text
backend/storage/
```

La base de datos se encuentra en:

```text
backend/storage/detecciones.db
```

Las imágenes se almacenan en:

```text
backend/storage/images/
```

La base de datos conserva información como:

- nombre de los archivos;
- fecha del análisis;
- detecciones obtenidas.

Las imágenes se almacenan como archivos independientes para evitar que la base de datos aumente innecesariamente de tamaño.

---

# 📷 Fuentes de captura

### ESP32-CAM

Permite utilizar una transmisión MJPEG proveniente de la cámara.

La dirección del stream tiene el siguiente formato:

```text
http://IP_DEL_ESP32:81/stream
```

Por ejemplo:

```text
http://192.168.4.1:81/stream
```
---

# ⚙️ Configuración del ESP32-CAM

Para utilizar el ESP32-CAM:

1. Configurar el dispositivo mediante Arduino IDE.
2. Cargar el programa correspondiente al ESP32-CAM.
3. Conectarlo a la red WiFi.
4. Obtener la dirección IP asignada.
5. Introducir la dirección del stream en la aplicación.
6. Verificar que el indicador de conexión muestre **EN VIVO**.


---

# 📁 Estructura del proyecto

```text
Phytosanitary-monitor/
│
├── deteccion-foliar/
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.js
│   │   │
│   │   └── components/
│   │       └── CameraStream.jsx
│   │
│   ├── package.json
│   └── README.md
│
└── backend/
    ├── models/
    │   └── best.pt
    │
    ├── storage/
    │   ├── detecciones.db
    │   └── images/
    │
    ├── requirements.txt
    └── app.py
```
---

# 🔄 Orden recomendado para ejecutar el proyecto

Para utilizar el sistema correctamente:

### 1. Iniciar el backend

```bash
cd backend
python app.py
```

### 2. Comprobar el estado del backend

Abrir:

```text
http://localhost:5000/health
```

### 3. Verificar el modelo

Confirmar que exista:

```text
backend/models/best.pt
```

### 4. Iniciar React

```bash
cd deteccion-foliar
npm start
```

### 5. Abrir la aplicación

```text
http://localhost:3000
```
### 6. Capturar y analizar

La imagen se envía al backend para su procesamiento y posteriormente se muestran los resultados en la interfaz.

---

# 🛠️ Solución de problemas

| Problema | Posible solución |
|---|---|
| No se conecta el ESP32-CAM | Verificar que el dispositivo esté conectado a la misma red WiFi y que la IP sea correcta. |
| El stream es lento | Ajustar la calidad JPEG configurada en el ESP32-CAM. |
| El backend no responde | Verificar que `python app.py` se encuentre ejecutándose. |
| El modelo no aparece | Confirmar que `best.pt` se encuentre en `backend/models/`. |
| No funciona la cámara del teléfono | Revisar los permisos de cámara del navegador. |
| No aparecen los análisis | Comprobar la conexión con el backend y el endpoint `/analyze`. |

---

<p align="center">
  🍅 Phytosanitary Monitor
  <br>
  Sistema de monitoreo y análisis de anomalias en los jitomates
</p>
