from flask import Flask, request, send_file
from flask_cors import CORS
from pathlib import Path
import io
import uuid
import tempfile
import os
print(f"📂 Flask ejecutado desde: {os.getcwd()}")

from scriptOptimo import combinar_etiquetas

app = Flask(__name__)
CORS(app, origins=["https://combinaretiquetas.onrender.com/"])

@app.route("/combinar", methods=["POST"])
def combinar():
    files = request.files.getlist("etiquetas")
    textos = request.form.getlist("textos")
    tipos = request.form.getlist("tipos")

    if len(files) != len(textos) or len(files) != len(tipos):
        return "Error: archivos, textos y tipos deben coincidir en cantidad", 400

    if not (2 <= len(files) <= 4):
        return "Debes enviar entre 2 y 4 etiquetas", 400

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        etiquetas_info = []

        for i, file in enumerate(files):
            file_id = str(uuid.uuid4())[:8]
            temp_path = temp_dir_path / f"etiqueta_{file_id}.pdf"
            file.save(temp_path)
            etiquetas_info.append((temp_path, textos[i], tipos[i]))

        output_path = temp_dir_path / "etiquetas_combinadas.pdf"

        try:
            combinar_etiquetas(etiquetas_info, output_path)

            # ✅ LEE el archivo ANTES de salir del with
            with open(output_path, "rb") as f:
                contenido_pdf = io.BytesIO(f.read())

            return send_file(
                contenido_pdf,
                mimetype="application/pdf",
                as_attachment=True,
                download_name="etiquetas_combinadas.pdf"
            )

        except Exception as e:
            return f"❌ Error al combinar etiquetas: {str(e)}", 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))  # Render le da un puerto a tu app
    app.run(host='0.0.0.0', port=port, debug=True)
