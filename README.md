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
