import io
import os
import qrcode
from datetime import date
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT"):
    CERT_STORAGE_DIR = "/tmp/certificates"
else:
    CERT_STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "certificates")

try:
    os.makedirs(CERT_STORAGE_DIR, exist_ok=True)
except Exception:
    CERT_STORAGE_DIR = "/tmp/certificates"
    try:
        os.makedirs(CERT_STORAGE_DIR, exist_ok=True)
    except Exception:
        pass


def generate_qr_image_bytes(data: str) -> io.BytesIO:
    """Generates QR code as a PNG in-memory bytes buffer."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def build_certificate_pdf(
    certificate_id: str,
    recipient_name: str,
    recipient_college: str,
    event_title: str,
    host_college: str,
    cert_type: str,
    issue_date: date,
    verification_url: str,
) -> str:
    """
    Renders a landscape letter PDF certificate with modern blue-slate borders,
    gold/silver typography accents, dynamic metadata, and verification QR code.
    Saves to storage/certificates/ and returns the absolute file path.
    """
    filename = f"{certificate_id}.pdf"
    filepath = os.path.join(CERT_STORAGE_DIR, filename)

    # Landscape letter dimensions: 11 x 8.5 inches (792 x 612 pt)
    width, height = landscape(letter)
    c = canvas.Canvas(filepath, pagesize=landscape(letter))

    # 1. Background Fill
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # 2. Dual Elegant Border Lines
    # Outer navy-slate border
    c.setStrokeColor(colors.HexColor("#0f172a"))
    c.setLineWidth(5)
    c.rect(24, 24, width - 48, height - 48)

    # Inner gold border
    c.setStrokeColor(colors.HexColor("#d97706"))
    c.setLineWidth(1.5)
    c.rect(32, 32, width - 64, height - 64)

    # Corner Decorative Squares
    c.setFillColor(colors.HexColor("#2563eb"))
    for x, y in [(24, 24), (width - 32, 24), (24, height - 32), (width - 32, height - 32)]:
        c.rect(x, y, 8, 8, fill=1, stroke=0)

    # 3. Header Title & Brand
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.HexColor("#2563eb"))
    c.drawCentredString(width / 2.0, height - 70, f"OCCASIO • {host_college.upper()}")

    c.setFont("Helvetica-Bold", 32)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawCentredString(width / 2.0, height - 110, "CERTIFICATE OF RECOGNITION")

    # 4. Certificate Category Ribbon Text
    type_label = {
        "participation": "CERTIFICATE OF PARTICIPATION",
        "merit": "CERTIFICATE OF MERIT",
        "winner": "CERTIFICATE OF EXCELLENCE • 1ST PLACE",
        "runner_up": "CERTIFICATE OF EXCELLENCE • RUNNER UP",
    }.get(cert_type.lower(), f"CERTIFICATE OF {cert_type.upper()}")

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(colors.HexColor("#d97706"))
    c.drawCentredString(width / 2.0, height - 135, f"★  {type_label}  ★")

    # 5. Presentation Text
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawCentredString(width / 2.0, height - 180, "This is proudly presented to")

    # 6. Recipient Name
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawCentredString(width / 2.0, height - 220, recipient_name)

    # Underline
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    text_width = c.stringWidth(recipient_name, "Helvetica-Bold", 26)
    c.line(width / 2.0 - text_width / 2.0 - 20, height - 228, width / 2.0 + text_width / 2.0 + 20, height - 228)

    # 7. Institution & Event Details
    c.setFont("Helvetica", 13)
    c.setFillColor(colors.HexColor("#334155"))
    c.drawCentredString(width / 2.0, height - 260, f"representing {recipient_college}")

    c.setFont("Helvetica", 14)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawCentredString(width / 2.0, height - 300, "for active participation and remarkable performance in the event")

    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(colors.HexColor("#1d4ed8"))
    c.drawCentredString(width / 2.0, height - 335, f"\"{event_title}\"")

    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawCentredString(width / 2.0, height - 365, f"Organized under Occasio University Event Network on {issue_date.strftime('%B %d, %Y')}")

    # 8. Signatures Block
    c.setStrokeColor(colors.HexColor("#94a3b8"))
    c.setLineWidth(1)
    # Left signature (Convener)
    c.line(90, 110, 240, 110)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawString(90, 95, "Event Convener")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(90, 82, host_college)

    # Right signature (Head of Institution)
    c.line(width - 240, 110, width - 90, 110)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawString(width - 240, 95, "Authorized Signatory")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(width - 240, 82, "Occasio Platform Council")

    # 9. Verification QR Code & Hash (Center Bottom)
    qr_buffer = generate_qr_image_bytes(verification_url)
    qr_image = ImageReader(qr_buffer)
    # 70x70 QR in center
    qr_size = 72
    qr_x = (width - qr_size) / 2.0
    qr_y = 65
    c.drawImage(qr_image, qr_x, qr_y, width=qr_size, height=qr_size)

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawCentredString(width / 2.0, 52, f"CERTIFICATE ID: {certificate_id}")

    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawCentredString(width / 2.0, 42, "Scan QR to verify authenticity or visit verification portal")

    c.showPage()
    c.save()

    return filepath
