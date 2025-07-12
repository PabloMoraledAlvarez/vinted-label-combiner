// 📁 App.jsx (estilos visuales aplicados con Tailwind activado)

import React, { useState, useRef } from "react";
import axios from "axios";
import { saveAs } from "file-saver";

export default function EtiquetaCombiner() {
  const [combinando, setCombinando] = useState(false);
  const [etiquetas, setEtiquetas] = useState([]);
  const fileInputRef = useRef(null); // Para limpiar input después de cada carga

  const handleCombinar = async () => {
    if (etiquetas.length < 2) {
      alert("Debes añadir al menos dos etiquetas para combinarlas.");
      return;
    }

    const formData = new FormData();
    etiquetas.forEach(({ archivo, tipo, texto }) => {
      formData.append("etiquetas", archivo);
      formData.append("tipos", tipo);
      formData.append("textos", texto);
    });

    setCombinando(true);
    try {
      const API_BASE_URL = import.meta.env.DEV
        ? "http://localhost:5000"
        : "https://combinaretiquetasbackend.onrender.com";

      const response = await axios.post(`${API_BASE_URL}/combinar`, formData, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      saveAs(blob, "etiquetas_combinadas.pdf");
    } catch (error) {
      alert("❌ Error al combinar las etiquetas");
      console.error(error);
    } finally {
      setCombinando(false);
    }
  };

  const handleArchivoChange = (e) => {
    const nuevosArchivos = Array.from(e.target.files);

    const yaSubidos = new Set(
      etiquetas.map((et) => `${et.archivo.name}-${et.archivo.lastModified}`)
    );

    const nuevos = nuevosArchivos
      .filter((archivo) => !yaSubidos.has(`${archivo.name}-${archivo.lastModified}`))
      .map((archivo) => ({
        archivo,
        tipo: "inpost",
        texto: "",
      }));

    setEtiquetas((prev) => [...prev, ...nuevos]);

    // Limpia el input para poder volver a seleccionar los mismos archivos
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEliminarEtiqueta = (index) => {
    const nuevas = [...etiquetas];
    nuevas.splice(index, 1);
    setEtiquetas(nuevas);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {/* Popup de carga */}
      {combinando && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg text-center text-xl shadow-xl">
            Combinando etiquetas...
          </div>
        </div>
      )}

      <div className="bg-white mx-auto rounded-xl shadow-lg p-8 max-w-screen-lg">
        <h1 className="font-bold text-gray-800 text-center flex items-center justify-center gap-2 text-2xl mb-4">
          <span role="text" aria-label="package">📦</span> Combinar Etiquetas PDF
        </h1>

        <p className="text-center text-gray-600 max-w-2xl mx-auto text-base mb-8">
          Sube <strong>al menos dos archivos PDF</strong> de etiquetas, añade un <strong>texto identificativo</strong> si lo deseas, selecciona el tipo de envío (InPost o UPS), y pulsa en <em>"Combinar etiquetas"</em> para descargar un único PDF listo para imprimir. Puedes añadir más etiquetas en tandas.
        </p>

        {/* Subida múltiple */}
        <div className="mb-6">
          <label className="block text-base font-semibold text-gray-600 mb-2">
            Subir varias etiquetas PDF:
          </label>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleArchivoChange}
            ref={fileInputRef}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
          />
        </div>

        {/* Lista de archivos */}
        {etiquetas.length > 0 && (
          <div className="space-y-4 mt-6">
            {etiquetas.map((etiqueta, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row gap-4 items-start md:items-center border rounded-lg p-4 bg-gray-50"
              >
                <span className="flex-1 text-gray-800 truncate font-medium">
                  📄 {etiqueta.archivo.name}
                </span>

                <select
                  value={etiqueta.tipo}
                  onChange={(e) => {
                    const nuevas = [...etiquetas];
                    nuevas[i].tipo = e.target.value;
                    setEtiquetas(nuevas);
                  }}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  <option value="inpost">InPost</option>
                  <option value="ups">UPS</option>
                </select>

                <input
                  type="text"
                  placeholder="Texto identificativo (opcional)"
                  value={etiqueta.texto}
                  onChange={(e) => {
                    const nuevas = [...etiquetas];
                    nuevas[i].texto = e.target.value;
                    setEtiquetas(nuevas);
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full md:w-1/3"
                />

                <button
                  onClick={() => handleEliminarEtiqueta(i)}
                  className="text-red-500 hover:text-red-700 font-semibold border border-red-300 px-3 py-1 rounded ml-2"
                  title="Eliminar esta etiqueta"
                >
                  Quitar etiqueta
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Botón de combinar */}
        {etiquetas.length > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={handleCombinar}
              className="bg-green-600 hover:bg-green-700 text-white py-4 px-8 rounded-lg text-lg font-semibold shadow-md"
            >
              📄 Combinar etiquetas y descargar PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
