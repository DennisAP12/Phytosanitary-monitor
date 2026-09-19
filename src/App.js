import { useState, useMemo } from 'react';
import CameraStream from './components/CameraStream';
import './App.css';

// Calcula la URL base del backend dinámicamente si se accede desde otro dispositivo en la red
const DEFAULT_BACKEND_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname
    ? `http://${window.location.hostname}:5000`
    : 'http://localhost:5000');

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [backendUrl] = useState(DEFAULT_BACKEND_URL);

  // Optimizar y normalizar la resolución de imagen antes de enviarla
  const prepareImageForAnalysis = (imageData, maxWidth = 1280, maxHeight = 960, quality = 0.8) => {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        try {
          const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
          const width = Math.max(1, Math.round(image.naturalWidth * ratio));
          const height = Math.max(1, Math.round(image.naturalHeight * ratio));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (error) {
          console.warn('No se pudo optimizar la resolución, usando imagen original.', error);
          resolve(imageData);
        }
      };
      image.onerror = () => resolve(imageData);
      image.src = imageData;
    });
  };

  const handleCapture = async (imageData) => {
    setBackendError(null);
    setLoading(true);

    const optimizedImage = await prepareImageForAnalysis(imageData);
    setOriginalImage(optimizedImage);
    setProcessedImage(null);
    setAnalysis(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const endpoint = `${backendUrl.replace(/\/$/, '')}/analyze`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: optimizedImage, confidence: 0.04 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor (HTTP ${response.status})`);
      }

      const result = await response.json();
      setProcessedImage(result.processedImage || optimizedImage);
      setAnalysis({
        id: result.id,
        status: result.analysis?.status || 'OK',
        detections: result.analysis?.detections || [],
        count: result.analysis?.count ?? (result.analysis?.detections?.length || 0),
      });
    } catch (err) {
      console.error('Error de análisis:', err);
      setBackendError(
        'No se pudo completar el análisis en este momento. Por favor verifica que el servicio esté activo e inténtalo nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Agrupación de clases detectadas para resumen estadístico
  const classSummary = useMemo(() => {
    if (!analysis || !analysis.detections) return {};
    const summary = {};
    analysis.detections.forEach((item) => {
      const name = item.class || 'Sin clasificar';
      summary[name] = (summary[name] || 0) + 1;
    });
    return summary;
  }, [analysis]);

  return (
    <div className="app">
      <header>
        <h1>Monitor de Problemas Fitosanitarios</h1>
        <p>Análisis visual automatizado mediante visión por computadora.</p>
      </header>

      <main>
        {/* Sección de cámara y selector de fuente */}
        <section className="camera-section">
          <CameraStream onCapture={handleCapture} />
        </section>

        {/* Mensaje de error de conexión con el backend */}
        {backendError && (
          <div className="alert-box alert-error">
            <div className="alert-content">
              <strong>Error de conexión:</strong> {backendError}
            </div>
          </div>
        )}

        {/* Resultados del análisis */}
        {(originalImage || processedImage || loading) && (
          <section className="results-section">
            <div className="results-header">
              <h2>Resultado del diagnóstico</h2>
            </div>

            {/* Comparación visual */}
            <div className="image-comparison">
              <div className="image-card">
                <div className="card-header">
                  <h3>Imagen original</h3>
                </div>
                <div className="image-wrapper">
                  {originalImage ? (
                    <img src={originalImage} alt="Original capturada" />
                  ) : (
                    <p className="placeholder-text">Esperando captura...</p>
                  )}
                </div>
              </div>

              <div className="image-card">
                <div className="card-header">
                  <h3>Resultado del modelo de detección</h3>
                </div>
                <div className="image-wrapper">
                  {loading ? (
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                      <p>Ejecutando inferencia con best.pt...</p>
                    </div>
                  ) : processedImage ? (
                    <img src={processedImage} alt="Procesada con detecciones" />
                  ) : (
                    <p className="placeholder-text">Captura una imagen para iniciar el análisis.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de diagnóstico detallado */}
            {analysis && (
              <div className="diagnosis-panel">
                <div className="diagnosis-title-bar">
                  <h3>Diagnóstico y clasificación de anomalías</h3>
                  <span className="total-count-pill">
                    {analysis.count} {analysis.count === 1 ? 'detección' : 'detecciones'} identificadas
                  </span>
                </div>

                {/* Resumen de etiquetas */}
                <div className="summary-badges">
                  {Object.keys(classSummary).length === 0 ? (
                    <div className="empty-detection-alert">
                      No se observaron anomalías o síntomas foliares evidentes en el umbral establecido.
                    </div>
                  ) : (
                    Object.entries(classSummary).map(([cls, count]) => {
                      let badgeType = 'badge-neutral';
                      const lower = cls.toLowerCase();
                      if (lower.includes('sano')) badgeType = 'badge-sano';
                      else if (lower.includes('verde')) badgeType = 'badge-verde';
                      else if (lower.includes('infectado') || lower.includes('podrido')) badgeType = 'badge-infectado';

                      return (
                        <div key={cls} className={`diagnosis-badge ${badgeType}`}>
                          <span className="badge-name">{cls}</span>
                          <span className="badge-count">{count}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Tabla detallada de objetos detectados */}
                {analysis.detections && analysis.detections.length > 0 && (
                  <div className="table-responsive">
                    <table className="detections-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Clasificación</th>
                          <th>Nivel de Confianza</th>
                          <th>Caja Delimitadora [x1, y1, x2, y2]</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.detections.map((det, idx) => {
                          const lower = (det.class || '').toLowerCase();
                          let rowClass = '';
                          if (lower.includes('sano')) rowClass = 'row-sano';
                          else if (lower.includes('infectado') || lower.includes('podrido')) rowClass = 'row-infectado';

                          return (
                            <tr key={idx} className={rowClass}>
                              <td>{idx + 1}</td>
                              <td>
                                <strong>{det.class}</strong>
                              </td>
                              <td>
                                <div className="confidence-meter">
                                  <div
                                    className="confidence-fill"
                                    style={{ width: `${Math.round(det.confidence * 100)}%` }}
                                  ></div>
                                  <span>{Math.round(det.confidence * 100)}%</span>
                                </div>
                              </td>
                              <td>
                                <code>{JSON.stringify(det.box)}</code>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
