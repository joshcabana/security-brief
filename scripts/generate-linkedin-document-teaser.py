#!/usr/bin/env python3
"""Generate the LinkedIn document-ad teaser PDF for AI Security Brief Pro."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


PAGE_WIDTH, PAGE_HEIGHT = A4
OUTPUT_PATH = Path("marketing/assets/ai-security-brief-pro-launch-teaser.pdf")

BACKGROUND = HexColor("#08111d")
SURFACE = HexColor("#0f1c2d")
BORDER = HexColor("#1f3b57")
ACCENT = HexColor("#00b4ff")
ACCENT_DIM = HexColor("#4fd2ff")
TEXT_PRIMARY = HexColor("#f5fbff")
TEXT_MUTED = HexColor("#9fb8cc")
TEXT_FAINT = HexColor("#6f8aa1")
TABLE_FILL = HexColor("#13283b")
TABLE_HEADER = HexColor("#1c3952")
REDACT = HexColor("#ff6b57")


def draw_page_background(pdf: canvas.Canvas) -> None:
    pdf.setFillColor(BACKGROUND)
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, stroke=0, fill=1)

    pdf.setFillColor(HexColor("#0b1726"))
    pdf.circle(PAGE_WIDTH * 0.18, PAGE_HEIGHT * 0.84, 90, stroke=0, fill=1)
    pdf.circle(PAGE_WIDTH * 0.86, PAGE_HEIGHT * 0.24, 120, stroke=0, fill=1)


def draw_badge(pdf: canvas.Canvas, x: float, y: float, width: float, height: float, text: str) -> None:
    pdf.setFillColor(SURFACE)
    pdf.setStrokeColor(ACCENT)
    pdf.roundRect(x, y, width, height, 9, stroke=1, fill=1)
    pdf.setFillColor(ACCENT)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(x + 12, y + 9, text.upper())


def draw_heading(pdf: canvas.Canvas) -> None:
    draw_badge(pdf, 42, PAGE_HEIGHT - 68, 180, 26, "LinkedIn document ad teaser")

    pdf.setFillColor(TEXT_PRIMARY)
    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawString(42, PAGE_HEIGHT - 110, "2026 AI Threat Landscape Report")

    pdf.setFillColor(ACCENT_DIM)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(42, PAGE_HEIGHT - 132, "Security-leader preview for AI Security Brief Pro")

    pdf.setFillColor(TEXT_MUTED)
    pdf.setFont("Helvetica", 10.5)
    pdf.drawString(
        42,
        PAGE_HEIGHT - 156,
        "Agentic intrusions, prompt-injection persistence, and MLSecOps control gaps are accelerating.",
    )
    pdf.drawString(
        42,
        PAGE_HEIGHT - 171,
        "This teaser shows the format and pressure points. The full report ships inside the Pro launch funnel.",
    )


def draw_metric_row(pdf: canvas.Canvas) -> None:
    metrics = [
        ("coverage", "9 sectors"),
        ("window", "last 90 days"),
        ("priority", "CISO / SecOps"),
    ]
    start_x = 42
    top_y = PAGE_HEIGHT - 222
    box_width = 160
    box_height = 46
    gap = 16

    for index, (label, value) in enumerate(metrics):
        x = start_x + index * (box_width + gap)
        pdf.setFillColor(SURFACE)
        pdf.setStrokeColor(BORDER)
        pdf.roundRect(x, top_y, box_width, box_height, 10, stroke=1, fill=1)
        pdf.setFillColor(TEXT_FAINT)
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawString(x + 12, top_y + 29, label.upper())
        pdf.setFillColor(TEXT_PRIMARY)
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(x + 12, top_y + 12, value)


def draw_table_card(
    pdf: canvas.Canvas,
    x: float,
    y: float,
    width: float,
    height: float,
    title: str,
    subtitle: str,
) -> None:
    pdf.setFillColor(SURFACE)
    pdf.setStrokeColor(BORDER)
    pdf.roundRect(x, y, width, height, 14, stroke=1, fill=1)

    pdf.setFillColor(TEXT_PRIMARY)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(x + 16, y + height - 26, title)

    pdf.setFillColor(TEXT_MUTED)
    pdf.setFont("Helvetica", 9)
    pdf.drawString(x + 16, y + height - 40, subtitle)

    table_x = x + 16
    table_y = y + 22
    table_width = width - 32
    table_height = height - 78
    row_count = 4
    column_ratios = [0.4, 0.22, 0.22, 0.16]
    row_height = table_height / row_count

    pdf.setFillColor(TABLE_HEADER)
    pdf.roundRect(table_x, table_y + table_height - row_height, table_width, row_height, 6, stroke=0, fill=1)

    column_positions = [table_x]
    running_x = table_x
    for ratio in column_ratios:
        running_x += table_width * ratio
        column_positions.append(running_x)

    header_labels = ["surface", "volume", "severity", "delta"]
    for index, label in enumerate(header_labels):
        pdf.setFillColor(TEXT_MUTED)
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawString(column_positions[index] + 8, table_y + table_height - row_height + 9, label.upper())

    pdf.setStrokeColor(BORDER)
    for row_index in range(row_count):
        row_bottom = table_y + row_index * row_height
        pdf.setFillColor(TABLE_FILL if row_index < row_count - 1 else HexColor("#122436"))
        pdf.rect(table_x, row_bottom, table_width, row_height - 1, stroke=0, fill=1)

    for column_x in column_positions[1:-1]:
        pdf.line(column_x, table_y, column_x, table_y + table_height)

    for row_index in range(1, row_count):
        row_y = table_y + row_index * row_height
        pdf.line(table_x, row_y, table_x + table_width, row_y)

    pdf.setStrokeColor(REDACT)
    pdf.setLineWidth(10)
    pdf.line(x + 34, y + 30, x + width - 34, y + height - 58)

    pdf.saveState()
    pdf.translate(x + width / 2, y + height / 2)
    pdf.rotate(27)
    pdf.setFillColor(white)
    pdf.setFont("Helvetica-Bold", 26)
    pdf.drawCentredString(0, -8, "REDACTED")
    pdf.restoreState()
    pdf.setLineWidth(1)


def draw_footer(pdf: canvas.Canvas) -> None:
    pdf.setStrokeColor(BORDER)
    pdf.line(42, 86, PAGE_WIDTH - 42, 86)

    pdf.setFillColor(TEXT_PRIMARY)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(42, 58, "Full report + weekly Pro briefings at aithreatbrief.com/pro")

    pdf.setFillColor(TEXT_MUTED)
    pdf.setFont("Helvetica", 10)
    pdf.drawString(
        42,
        39,
        "Use this PDF as the native LinkedIn document creative for the Pro waitlist campaign.",
    )


def generate_pdf(output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(output_path), pagesize=A4)
    pdf.setTitle("AI Security Brief Pro Launch Teaser")
    pdf.setAuthor("AI Security Brief")
    pdf.setSubject("LinkedIn document ad teaser")

    draw_page_background(pdf)
    draw_heading(pdf)
    draw_metric_row(pdf)

    card_width = PAGE_WIDTH - 84
    card_height = 118
    first_card_y = PAGE_HEIGHT - 382
    card_gap = 18

    draw_table_card(
        pdf,
        42,
        first_card_y,
        card_width,
        card_height,
        "1. Agentic intrusion pathways",
        "Observed footholds across retrieval, browser, and code-execution layers.",
    )
    draw_table_card(
        pdf,
        42,
        first_card_y - card_height - card_gap,
        card_width,
        card_height,
        "2. Prompt-injection persistence map",
        "Persistence vectors ranked by blast radius and operator detection difficulty.",
    )
    draw_table_card(
        pdf,
        42,
        first_card_y - (card_height + card_gap) * 2,
        card_width,
        card_height,
        "3. MLSecOps control coverage gaps",
        "Coverage matrix showing where logging, isolation, and policy enforcement still fail.",
    )

    draw_footer(pdf)
    pdf.showPage()
    pdf.save()


def main() -> None:
    generate_pdf(OUTPUT_PATH)
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
