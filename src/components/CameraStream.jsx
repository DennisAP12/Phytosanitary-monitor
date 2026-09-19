import { useEffect, useRef, useState, useCallback } from 'react';
import './CameraStream.css';

// URLs internas para conectar automáticamente con la ESP32 (sin mostrarlas al usuario)
const ESP32_STREAM_URLS = [
  'http://192.168.4.1/stream',
  'http://192.168.4.1:81/stream',
  'http://localhost:81/stream',
];

const CameraStream = ({ onCapture }) => {
  // La fuente principal es la ESP32-CAM. La opción de webcam queda como respaldo interno, pero no se usa en la interfaz principal.
  const [sourceType, setSourceType] = useState('esp32');

  // Estado de conexión
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [activeUrlIndex, setActiveUrlIndex] = useState(0);
  const [reloadKey, setReloadKey] = useState(Date.now());

  // Estado de captura y galería
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // Referencias
  const streamImageRef = useRef(null);
  const videoRef = useRef(null);
  const webcamStreamRef = useRef(null);

  // Detener webcam al cambiar de fuente
  const stopWebcam = useCallback(() => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
  }, []);

  // Manejar cambio de fuente
  useEffect(() => {
    setErrorMessage(null);

    if (sourceType === 'webcam') {
      setConnectionStatus('connecting');
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
          .then((stream) => {
            webcamStreamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
            setConnectionStatus('connected');
          })
          .catch(() => {
            setConnectionStatus('error');
            setErrorMessage('No se pudo acceder a la cámara de la computadora. Verifica los permisos.');
          });
      } else {
        setConnectionStatus('error');
        setErrorMessage('Tu navegador no permite el acceso a la cámara.');
      }
    } else if (sourceType === 'esp32') {
      stopWebcam();
      setConnectionStatus('connecting');
      setReloadKey(Date.now());
    }

    return () => {
      stopWebcam();
    };
  }, [sourceType, stopWebcam]);

  // Reintentar conexión con el ESP32
  const handleRetryEsp32 = () => {
    setErrorMessage(null);
    setConnectionStatus('connecting');
    setActiveUrlIndex(0);
    setReloadKey(Date.now());
  };

  // Si falla la primera URL, probar siguiente puerto internamente
  const handleEsp32Error = () => {
    if (activeUrlIndex < ESP32_STREAM_URLS.length - 1) {
      setActiveUrlIndex((prev) => prev + 1);
      setReloadKey(Date.now());
    } else {
      setConnectionStatus('error');
    }
  };

  const handleEsp32Load = () => {
    setConnectionStatus('connected');
    setErrorMessage(null);
  };

  // Capturar imagen
  const captureImage = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setErrorMessage(null);

    try {
      let imageData = null;

      if (sourceType === 'webcam') {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) {
          throw new Error('La cámara de la computadora aún no está lista.');
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        imageData = canvas.toDataURL('image/jpeg', 0.92);
      } else if (sourceType === 'esp32') {
        const img = streamImageRef.current;

        // Intento 1: Captura directa desde el stream
        try {
          if (img && img.complete && img.naturalWidth > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            imageData = canvas.toDataURL('image/jpeg', 0.92);
          }
        } catch (corsErr) {
          console.warn('CORS en stream, recurriendo a proxy de captura...', corsErr);
        }

        // Intento 2: Proxy del backend (/api/esp32/capture) o directo (/capture)
        if (!imageData) {
          const endpoints = [
            'http://localhost:5000/api/esp32/capture',
            'http://192.168.4.1/capture',
          ];

          for (const ep of endpoints) {
            try {
              const res = await fetch(`${ep}?t=${Date.now()}`);
              if (res.ok) {
                const blob = await res.blob();
                imageData = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(blob);
                });
                break;
              }
            } catch (fetchErr) {
              continue;
            }
          }
        }
      }

      if (!imageData) {
        throw new Error('No se pudo tomar la captura. Asegúrate de que la cámara esté activa.');
      }

      const newCapture = {
        id: Date.now(),
        src: imageData,
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: sourceType === 'esp32' ? 'Cámara ESP32' : 'Cámara Computadora',
      };

      setCapturedImages((prev) => [newCapture, ...prev]);

      if (onCapture) {
        onCapture(imageData);
      }
    } catch (err) {
      console.error('Error al capturar:', err);
      setErrorMessage(err.message || 'Error al capturar.');
    } finally {
      setIsCapturing(false);
    }
  };

  const clearGallery = () => setCapturedImages([]);

  const deleteImage = (id) => {
    setCapturedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const downloadImage = (image) => {
    const link = document.createElement('a');
    link.href = image.src;
    link.download = `captura_cultivo_${image.id}.jpg`;

    if (document.body) {
      document.body.appendChild(link);
    }

    link.click();

    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  };

  const currentStreamUrl = `${ESP32_STREAM_URLS[activeUrlIndex]}?t=${reloadKey}`;

  return (
    <div className="camera-stream-container">
      {/* Selector simplificado: la aplicación usa la ESP32-CAM como fuente principal */}
      <div className="source-selector" style={{ display: 'none' }}>
        <div className="selector-label">Selecciona la cámara a utilizar:</div>
        <div className="selector-buttons">
          <button
            type="button"
            className={`source-btn ${sourceType === 'esp32' ? 'active' : ''}`}
            onClick={() => {
              setActiveUrlIndex(0);
              setSourceType('esp32');
            }}
          >
            Cámara ESP32
          </button>
          <button
            type="button"
            className={`source-btn ${sourceType === 'webcam' ? 'active' : ''}`}
            onClick={() => setSourceType('webcam')}
          >
            Cámara del equipo
          </button>
        </div>
      </div>

      {/* Sección del Stream */}
      <div className="stream-section">
        <div className="header">
          <h2>
            {sourceType === 'esp32' ? 'Transmisión en vivo (Cámara ESP32)' : 'Cámara del equipo'}
          </h2>
          <div className={`status-badge status-${connectionStatus}`}>
            {connectionStatus === 'connected' && 'EN VIVO'}
            {connectionStatus === 'connecting' && 'CONECTANDO'}
            {connectionStatus === 'error' && 'SIN SEÑAL'}
          </div>
        </div>

        <div className="stream-wrapper">
          {sourceType === 'esp32' && (
            <>
              <img
                ref={streamImageRef}
                key={currentStreamUrl}
                src={currentStreamUrl}
                alt="Transmisión en vivo"
                className={`stream-image ${connectionStatus === 'connected' ? 'visible' : 'hidden'}`}
                crossOrigin="anonymous"
                onLoad={handleEsp32Load}
                onError={handleEsp32Error}
              />

              {connectionStatus !== 'connected' && (
                <div className="camera-offline-card">
                  <div className="offline-icon"> </div>
                  <h3>Se espera la señal de la cámara ESP32</h3>
                  <p>
                    Verifique que la cámara esté conectada a la misma red local e intente nuevamente.
                  </p>
                  <button type="button" className="retry-btn" onClick={handleRetryEsp32}>
                    Conectar cámara
                  </button>
                </div>
              )}
            </>
          )}

          {sourceType === 'webcam' && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="stream-image visible"
              onLoadedMetadata={() => setConnectionStatus('connected')}
            />
          )}

          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>

        <button
          type="button"
          onClick={captureImage}
          disabled={isCapturing || (sourceType === 'esp32' && connectionStatus !== 'connected')}
          className="capture-button"
        >
          {isCapturing ? 'Procesando...' : 'CAPTURAR Y ANALIZAR IMAGEN'}
        </button>
      </div>

      {/* Galería de capturas */}
      <div className="gallery-section">
        <div className="gallery-header">
          <h3>Capturas recientes ({capturedImages.length})</h3>
          <button className="clear-btn" onClick={clearGallery} disabled={capturedImages.length === 0}>
            Borrar registros
          </button>
        </div>

        {capturedImages.length === 0 ? (
          <p className="gallery-empty">Las imágenes capturadas se mostrarán aquí.</p>
        ) : (
          <div className="gallery-grid">
            {capturedImages.map((image) => (
              <div key={image.id} className="gallery-item">
                <img src={image.src} alt="Captura" className="gallery-image" />
                <div className="gallery-info">
                  <span className="source-badge">{image.source}</span>
                  <span className="timestamp">{image.timestamp}</span>
                  <div className="gallery-actions">
                    <button className="download-btn" onClick={() => downloadImage(image)} title="Descargar imagen">
                      ⬇️
                    </button>
                    <button className="delete-btn" onClick={() => deleteImage(image.id)} title="Eliminar captura">
                      ❌
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraStream;