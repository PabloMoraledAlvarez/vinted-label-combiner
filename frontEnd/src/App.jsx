// 📁 App.jsx (estilos visuales aplicados con Tailwind activado)

import React, { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";

export default function EtiquetaCombiner() {
  const [etiquetas, setEtiquetas] = useState([]);

  const handleAddEtiqueta = () => {
    setEtiquetas([
      ...etiquetas,
      {tipo: "inpost", archivo: null},
    ]);
  };

  const handleChangeTipo = (index, tipo) => {
    const nuevas = [...etiquetas];
    nuevas[index].tipo = tipo;
    setEtiquetas(nuevas);
  };

  const handleChangeArchivo = (index, archivo) => {
    const nuevas = [...etiquetas];
    nuevas[index].archivo = archivo;
    setEtiquetas(nuevas);
  };

  const handleChangeTexto = (index, texto) => {
    const nuevas = [...etiquetas];
    nuevas[index].texto = texto;
    setEtiquetas(nuevas);
  };

  const handleEliminarEtiqueta = (index) => {
    const nuevas = etiquetas.filter((_, i) => i !== index);
    setEtiquetas(nuevas);
  };

  const handleCombinar = async () => {
    const formData = new FormData();

    etiquetas.forEach((etiqueta) => {
      if (etiqueta.archivo) {
        formData.append("etiquetas", etiqueta.archivo);
        formData.append("textos", etiqueta.texto);
        formData.append("tipos", etiqueta.tipo);
      }
    });

    try {
      const response = await axios.post("https://combinaretiquetasbackend.onrender.com", formData, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      saveAs(blob, "etiquetas_combinadas.pdf");
    } catch (error) {
      alert("❌ Error al combinar las etiquetas");
      console.error(error);
    }
  };

  return (
  <div className="bg-gray-100 min-h-screen p-6">
    <div className="bg-white mx-auto rounded-xl shadow-lg p-8 max-w-screen-lg">
      <h1 className="font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-2 text-2xl">
        <span role="text" aria-label="package">📦</span> Combinar Etiquetas PDF
      </h1>

      <div className="mb-8 text-center">
        <button
          onClick={handleAddEtiqueta}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow"
        >
          ➕ Añadir etiqueta
        </button>
      </div>

      <div className="space-y-6">
        {etiquetas.map((etiqueta, i) => (
          <div
            key={i}
            className="rounded-xl p-6 bg-gray-50 shadow-sm space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-700">
                Etiqueta #{i + 1}
              </h2>
              <button
                onClick={() => handleEliminarEtiqueta(i)}
                className="text-red-500 hover:text-red-700 text-base font-medium border border-red-300 px-3 py-1 rounded"
                title="Eliminar"
              >
                ✖️ Quitar etiqueta
              </button>
            </div>

            <div className="flex flex-wrap md:flex-nowrap gap-6">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-base text-gray-600 mb-2">
                  Tipo:
                </label>
                <select
                  value={etiqueta.tipo}
                  onChange={(e) => handleChangeTipo(i, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="inpost">InPost</option>
                  <option value="ups">UPS</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-base font-semibold text-gray-600 mb-2">
                  Texto identificativo:
                </label>
                <input
                  type="text"
                  value={etiqueta.texto}
                  onChange={(e) => handleChangeTexto(i, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Nombre del artículo"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-base font-semibold text-gray-600 mb-2">
                  Archivo PDF:
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleChangeArchivo(i, e.target.files[0])}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

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