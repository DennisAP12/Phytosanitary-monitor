# Sistema de Diagnóstico Fitosanitario del Jitomate

Sistema web para el análisis visual de anomalias en cultivos de tomate mediante inteligencia artificial y visión por computadora.

La aplicación permite capturar imágenes  de tomate, enviarlas a un servicio de procesamiento y visualizar los resultados obtenidos mediante un modelo de detección basado en YOLO.

---

## Descripción

El proyecto tiene como objetivo apoyar la identificación visual de anomalías en frutos de tomate mediante un sistema de análisis automatizado.

La aplicación está compuesta por un frontend desarrollado con React y un backend desarrollado con Python y Flask. El backend recibe las imágenes, ejecuta el modelo de inteligencia artificial y almacena los resultados del análisis.

El sistema también incorpora una base de datos SQLite para conservar el historial de análisis y un sistema de almacenamiento de imágenes.

---

## Características

- Análisis de imágenes de hojas de tomate mediante inteligencia artificial.
- Detección de enfermedades mediante un modelo YOLO.
- Captura de imágenes desde una cámara compatible.
- Soporte para cámara del teléfono o webcam.
- Integración experimental con ESP32-CAM.
- Visualización de la imagen original y de la imagen procesada.
- Visualización de las detecciones realizadas por el modelo.
- Historial de análisis.
- Almacenamiento de imágenes y resultados.
- Descarga de imágenes procesadas.
- Interfaz responsiva para diferentes dispositivos.
- API REST para la comunicación entre frontend y backend.

---

## Tecnologías utilizadas

### Frontend

- React
- JavaScript
- HTML5
- CSS3

### Backend

- Python
- Flask
- Flask-CORS

### Inteligencia artificial y procesamiento de imágenes

- YOLO
- Ultralytics
- OpenCV
- NumPy
- Pillow

### Base de datos

- SQLite

### Herramientas

- Git
- GitHub
- Visual Studio Code
- Arduino IDE

---

## Arquitectura del sistema

El sistema está dividido en tres componentes principales:

```text
┌─────────────────────────────┐
│          FRONTEND           │
│            React            │
│                             │
│  Cámara / selección imagen  │
│  Interfaz de usuario        │
│  Historial                  │
└──────────────┬──────────────┘
               │
               │ HTTP / REST API
               ▼
┌─────────────────────────────┐
│          BACKEND            │
│        Python + Flask       │
│                             │
│  Recepción de imágenes      │
│  Procesamiento              │
│  Modelo YOLO                │
│  Gestión de resultados      │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│    YOLO      │  │   SQLite     │
│   best.pt    │  │  Historial   │
└──────────────┘  └──────────────┘


<<<<<<< HEAD <<<<<<< HEAD # Phytosanitary-monitor AI-powered tomato crop health monitoring system using computer vision, YOLO, and camera-based analytics for precision agriculture. ======= # Getting Started with Create React App ======= # Sistema de Diagnóstico Fitosanitario del Tomate >>>>>>> 3317378 (Initial commit) Sistema de análisis visual automatizado para la identificación de enfermedades foliares en cultivos de tomate, desarrollado con **FreeNove ESP32-CAM** y **React**. ## Características - **Stream en vivo MJPEG** desde ESP32-CAM - **Captura de imágenes** de alta calidad - **Análisis con inteligencia artificial** (requiere backend) - **Descarga de imágenes** capturadas - **Historial de análisis** completo - **Interfaz responsiva** (móvil, tablet, desktop) - **Soporte para webcam** como alternativa ## Requisitos - **ESP32-CAM FreeNove** (con módulo OV2640) - **Node.js** 14+ instalado - **WiFi** en tu red local - Navegador moderno (Chrome, Firefox, Edge, Safari) ## Configuración inicial del ESP32-CAM ### 1. Código Arduino para el ESP32 Flash el siguiente código al ESP32-CAM usando Arduino IDE:
cpp
#include "esp_camera.h"
#include <WiFi.h>
#include <esp_http_server.h>

// Configuración de pines para OV2640
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Tu WiFi
const char* ssid = "TU_RED_WIFI";
const char* password = "TU_CONTRASEÑA";

void startCameraServer();

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  // Configurar cámara
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_freq_hz = 20000000;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.jpeg_quality = 10;
  config.fb_count = 2;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  // WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("Camera Ready! Use 'http://");
  Serial.print(WiFi.localIP());
  Serial.println(":81/stream' to connect");

  startCameraServer();
}

void loop() {
  delay(10000);
}
### 2. Obtener la IP del ESP32 Después de flashear, abre el Monitor Serial (9600 baud) y busca:
Camera Ready! Use 'http://192.168.X.XXX:81/stream' to connect
## Cómo usar la aplicación ### 1. Instalar dependencias
bash
cd deteccion-foliar
npm install
### 2. Iniciar la aplicación
bash
npm start
Se abrirá en http://localhost:3000 ### 3. Conectar el ESP32-CAM - Selecciona **"ESP32-CAM"** en la interfaz - Ingresa la URL: http://192.168.4.1:81/stream (o tu IP local) - Verás el indicador cambiar a **EN VIVO** ### 4. Capturar imágenes - Haz clic en **"Capturar y analizar"** - Las imágenes se guardarán en el historial - Haz clic en **"Descargar"** para descargar ## Backend, red neuronal y base de datos El backend de este proyecto está en backend/. La base de datos es SQLite y se crea automáticamente en backend/storage/detecciones.db. Las imágenes se guardan como archivos JPEG en backend/storage/images/; la base solo conserva sus nombres, fecha y detecciones. Esta separación evita que la base de datos crezca innecesariamente. ### 1. Instalar Python y dependencias Instala Python 3.10 o superior y verifica que python funcione en una terminal:
bash
python --version
cd backend
python -m pip install -r requirements.txt
### 2. Copiar el modelo entrenado Copia el archivo best.pt del profesor en:
text
backend/models/best.pt
### 3. Iniciar el backend Desde la carpeta backend/:
bash
python app.py
Comprueba que responde visitando http://localhost:5000/health. Debe indicar "status": "ok" y "modelPresent": true. El endpoint POST /analyze recibe la imagen capturada por React, ejecuta best.pt, guarda la imagen original, la imagen con detecciones y los resultados en SQLite. El endpoint GET /analyses devuelve el historial guardado y /media/<archivo> sirve las imágenes almacenadas. ### Orden recomendado de trabajo 1. Ejecutar el backend y comprobar /health. 2. Copiar best.pt y probar una captura real con /analyze. 3. Confirmar que aparecen archivos en backend/storage/images/ y que se crea backend/storage/detecciones.db. 4. Después conectar la pantalla de historial de React con GET /analyses. La aplicación React ya envía las capturas a http://localhost:5000/analyze. ## Uso en teléfono - Si el ESP32 y tu teléfono están en la **misma WiFi**, simplemente ingresa la IP del ESP32 - Puedes usar la cámara del teléfono también (selecciona "Teléfono / Webcam") ## Solución de problemas | Problema | Solución | |----------|----------| | "No se pudo conectar al ESP32" | Verifica que el ESP32 esté en la misma WiFi y que la IP sea correcta | | Stream lentitud | Reduce la calidad JPEG en el ESP32 (aumenta jpeg_quality a 15-20) | | Errores CORS | Asegúrate que el ESP32 está respondiendo a solicitudes HTTP | | No funciona la cámara del teléfono | Acepte permisos de cámara en el navegador | ## Estructura del proyecto
deteccion-foliar/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx              # Componente principal
│   ├── App.css              # Estilos
│   ├── components/
│   │   └── CameraStream.jsx # Streaming de cámara
│   └── index.js
├── package.json
└── README.md
## Características de la interfaz - **Streaming en tiempo real** desde ESP32-CAM - **Indicador de conexión** (En vivo / Desconectado) - **Galería de imágenes capturadas** con timestamp - **Descarga de imágenes** en formato JPEG - **Historial completo** de análisis realizados - **Interfaz responsiva** para todos los dispositivos --- **Sistema para análisis visual de enfermedades del tomate** This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting) ### Analyzing the Bundle Size This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size) ### Making a Progressive Web App This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app) ### Advanced Configuration This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration) ### Deployment This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment) ### npm run build fails to minify This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify) >>>>>>> 7903a68 (Initialize project using Create React App) que cosas me recomindas dejar de mi readme
