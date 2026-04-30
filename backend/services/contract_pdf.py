"""Generate the signed "Contrato de actividad" PDF using fpdf2."""
from __future__ import annotations

import base64
import io
import logging
from datetime import datetime

from fpdf import FPDF

logger = logging.getLogger(__name__)

_MONTHS_ES = [
    "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

_BODY_1 = (
    "La empresa SALVIDA se compromete con Don/Doña: {name} con DNI {dni}, "
    "a ofrecerle sus servicios de movilizacion en escaleras con silla "
    "especializada, en la fecha y hora acordadas previamente."
)

_BODY_2 = (
    "La persona usuaria de este servicio se compromete a cumplir con el "
    "horario acordado, debiendo avisar de cualquier cambio o cancelacion al "
    "menos 24 horas antes, al telefono: 644572604 donde podra contactar "
    "tambien con la empresa para cualquier consulta."
)


def generate_contract_pdf(
    prm_name: str,
    prm_dni: str,
    booking_date: str,
    signature_png_b64: str,
) -> bytes:
    """
    Build a PDF contract pre-filled with PRM data and the canvas signature.

    Args:
        prm_name: Full name of the PRM.
        prm_dni: DNI of the PRM.
        booking_date: ISO date string 'YYYY-MM-DD'.
        signature_png_b64: Base64-encoded PNG of the drawn signature (no data-URI prefix).

    Returns:
        Raw PDF bytes.
    """
    pdf = FPDF()
    pdf.set_margins(left=20, top=20, right=20)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", style="B", size=16)
    pdf.cell(0, 12, "Contrato de actividad", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # Body paragraph 1
    pdf.set_font("Helvetica", size=11)
    pdf.multi_cell(
        0, 7,
        _BODY_1.format(name=prm_name or "___________________", dni=prm_dni or "_____________"),
    )
    pdf.ln(6)

    # Body paragraph 2
    pdf.multi_cell(0, 7, _BODY_2)
    pdf.ln(10)

    # Date
    try:
        dt = datetime.strptime(booking_date, "%Y-%m-%d")
        date_str = f"San Fernando a {dt.day} de {_MONTHS_ES[dt.month]} del {dt.year}"
    except ValueError:
        date_str = f"San Fernando, {booking_date}"
    pdf.cell(0, 7, date_str, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)

    # Signature labels
    pdf.cell(90, 7, "Firma persona usuaria:", new_x="RIGHT", new_y="TOP")
    pdf.cell(80, 7, "Firma Salvida:", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Embed drawn signature
    try:
        sig_bytes = base64.b64decode(signature_png_b64)
        sig_buf = io.BytesIO(sig_bytes)
        pdf.image(sig_buf, x=20, w=80, h=30)
    except Exception as exc:
        logger.warning("Could not embed signature image: %s", exc)

    return bytes(pdf.output())
