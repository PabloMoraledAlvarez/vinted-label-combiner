// 📁 App.jsx (estilos visuales aplicados con Tailwind activado)

import React, { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";

export default function EtiquetaCombiner() {
  const [combinando, setCombinando] = useState(false);
  const [etiquetas, setEtiquetas] = useState([]);

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

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {/* POPUP de carga */}
      {combinando && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg text-center text-xl shadow-xl">
            Combinando etiquetas...
          </div>
        </div>
      )}

      <div className="bg-white mx-auto rounded-xl shadow-lg p-8 max-w-screen-lg">
        <h1 className="font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-2 text-2xl">
          <span role="text" aria-label="package">📦</span> Combinar Etiquetas PDF
        </h1>

        {/* Subida múltiple */}
        <div className="mb-6">
          <label className="block text-base font-semibold text-gray-600 mb-2">
            Subir varias etiquetas PDF:
          </label>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => {
              const nuevos = Array.from(e.target.files).map((archivo) => ({
                archivo,
                tipo: "inpost",
                texto: "",
              }));
              setEtiquetas(nuevos);
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
          />
        </div>

        {/* Lista de archivos + select + texto */}
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

                {/* ✅ Botón de eliminar */}
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

        {/* Botón combinar */}
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
