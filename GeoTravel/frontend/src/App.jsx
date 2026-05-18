import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [status, setStatus] = useState("Conectando...");

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then((data) => setStatus(`Backend: ${data.backend} | GeoServer: ${data.geoserverUrl}`))
      .catch(() => setStatus("No se pudo conectar con el backend"));
  }, []);

  return (
    <main>
      <section>
        <h1>TSIG</h1>
        <p>{status}</p>
        <div className="links">
          <a href="http://localhost:8081/geoserver" target="_blank" rel="noreferrer">GeoServer</a>
          <a href="http://localhost:8080/actuator/health" target="_blank" rel="noreferrer">Spring Health</a>
          <a href="http://localhost:8082" target="_blank" rel="noreferrer">Tomcat</a>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
