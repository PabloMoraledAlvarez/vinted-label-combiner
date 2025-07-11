import fitz  # PyMuPDF
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import io

def extraer_etiqueta(path_pdf, tipo="inpost", zoom=2, rotar=False, total=2):
    """Extrae y recorta una etiqueta desde un PDF, adaptando el recorte y la rotación según el tipo y total."""
    with fitz.open(path_pdf) as doc:
        pagina = doc[0]
        rect = pagina.rect

        if tipo == "ups":
            recorte = fitz.Rect(0, 0, rect.width, rect.height)
        else:
            altura = 350
            recorte = fitz.Rect(0, rect.height - altura, rect.width, rect.height)

        pix = pagina.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=recorte)
        pix = recortar_margenes_blancos(pix)

        if not rotar and tipo != "ups":
            return pix

        image_pil = Image.open(io.BytesIO(pix.tobytes("png")))

        if tipo == "ups":
            if total == 2:
                image_pil = image_pil.rotate(90, expand=True)  # solo si son 2
        elif rotar:
            image_pil = image_pil.rotate(90, expand=True)

        buffer = io.BytesIO()
        image_pil.save(buffer, format="PNG")
        return fitz.Pixmap(buffer.getvalue())

def recortar_margenes_blancos(pix):
    """Recorta márgenes blancos de un Pixmap basándose en la luminosidad."""
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("L")
    mask = img.point(lambda x: 255 if x < 250 else 0)
    bbox = mask.getbbox()
    img_corte = img.crop(bbox).convert("RGB") if bbox else img.convert("RGB")
    buffer = io.BytesIO()
    img_corte.save(buffer, format="PNG")
    return fitz.Pixmap(buffer.getvalue())

def calcular_posiciones(num, ancho, alto):
    """Calcula posiciones para 2 a 4 etiquetas en un A4."""
    if num == 2:
        return [
            fitz.Rect(0, alto / 2 + 10, ancho, alto - 10),
            fitz.Rect(0, 10, ancho, alto / 2 - 10)
        ]
    
    mitad_ancho, mitad_alto = ancho / 2, alto / 2
    margen = 10
    return [
        fitz.Rect(margen, mitad_alto + margen, mitad_ancho - margen, alto - margen),
        fitz.Rect(mitad_ancho + margen, mitad_alto + margen, ancho - margen, alto - margen),
        fitz.Rect(margen, margen, mitad_ancho - margen, mitad_alto - margen),
        fitz.Rect(mitad_ancho + margen, margen, ancho - margen, mitad_alto - margen)
    ][:num]

def insertar_etiqueta_con_texto(pagina, pix, destino, texto, escala_forzada=None):
    """Inserta la etiqueta recortada + texto identificativo debajo, centrado."""
    alto_texto = 16
    margen = 4
    texto = str(texto)

    try:
        fuente_pil = ImageFont.truetype("arial.ttf", alto_texto)
    except:
        fuente_pil = ImageFont.load_default()

    img_temp = Image.new("RGB", (1, 1))
    draw = ImageDraw.Draw(img_temp)
    bbox = draw.textbbox((0, 0), texto, font=fuente_pil)
    ancho_texto = bbox[2] - bbox[0]

    x_centro = destino.x0 + (destino.width - ancho_texto) / 2
    y_base = destino.y1 - margen

    pagina.insert_text(
        point=(x_centro, y_base),
        text=texto,
        fontsize=alto_texto,
        fontname="helv",
        color=(0, 0, 0)
    )

    destino_img = fitz.Rect(destino.x0, destino.y0, destino.x1, destino.y1 - alto_texto - 2 * margen - 4)
    zona = fitz.Rect(destino_img.x0 + 4, destino_img.y0 + 4, destino_img.x1 - 4, destino_img.y1 - 4)

    escala = escala_forzada if escala_forzada else min(zona.width / pix.width, zona.height / pix.height) * 1.04
    w, h = pix.width * escala, pix.height * escala
    x0 = zona.x0 + (zona.width - w) / 2
    y0 = zona.y0 + (zona.height - h) / 2

    pagina.insert_image(fitz.Rect(x0, y0, x0 + w, y0 + h), pixmap=pix)

def combinar_etiquetas(etiqueta_data, output_path, zoom=2):
    """Combina 2-4 etiquetas en un solo PDF A4 con texto identificativo y escala común."""
    if not (2 <= len(etiqueta_data) <= 4):
        print("⚠️ Solo se aceptan entre 2 y 4 etiquetas.")
        return

    rotar = len(etiqueta_data) >= 3
    total = len(etiqueta_data)

    # 📦 Extraer pixmaps
    etiquetas = [
        (extraer_etiqueta(path, tipo=tipo, zoom=zoom, rotar=rotar, total=total), texto)
        for path, texto, tipo in etiqueta_data
    ]

    # 🧮 Calcular escala común para que todas se vean iguales
    a4_ancho, a4_alto = 595, 842
    posiciones = calcular_posiciones(total, a4_ancho, a4_alto)

    escalas = []
    for (pix, _), rect in zip(etiquetas, posiciones):
        zona = fitz.Rect(rect.x0 + 4, rect.y0 + 4, rect.x1 - 4, rect.y1 - 24)
        escala_w = zona.width / pix.width
        escala_h = zona.height / pix.height
        escalas.append(min(escala_w, escala_h))

    escala_comun = min(escalas) * 1.04

    # 🎯 Generar PDF
    doc = fitz.open()
    pagina = doc.new_page(width=a4_ancho, height=a4_alto)

    for (pix, texto), rect in zip(etiquetas, posiciones):
        insertar_etiqueta_con_texto(pagina, pix, rect, texto, escala_forzada=escala_comun)

    doc.save(output_path)
    doc.close()
    print(f"✅ PDF generado con {total} etiqueta(s): {output_path}")

# 🧪 Ejemplo de uso
if __name__ == "__main__":
    base = Path("C:/Users/pablo/OneDrive/Escritorio/Personal/ScriptEtiquetas")
    etiquetas = [
        (base / "label.pdf", "Pedido 001", "inpost"),
        (base / "label2.pdf", "Pedido 002", "ups"),
        (base / "label2.pdf", "DEV Ana", "ups"),
        #(base / "label.pdf", "Reposición #4", "inpost")
    ]
    salida = base / "etiquetas_combinadas.pdf"
    combinar_etiquetas(etiquetas, salida)