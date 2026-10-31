import io
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger("brightloop.pdf")


def format_money(cents: int, currency: str = "USD") -> str:
    dollars = cents / 100.0
    return f"${dollars:,.2f}"


def format_date(dt: Optional[datetime]) -> str:
    if not dt:
        return "N/A"
    return dt.strftime("%b %d, %Y")


def generate_invoice_html(invoice) -> str:
    cust = invoice.subscription.customer if invoice.subscription else None
    customer_name = cust.name if cust else "Valued Customer"
    company_name = cust.company if cust and cust.company else ""
    billing_addr = cust.billing_address if cust and cust.billing_address else "N/A"
    tax_id = cust.tax_id if cust and cust.tax_id else "N/A"

    amount_paid = sum(p.amount for p in invoice.payments)
    balance_due = max(0, invoice.total - amount_paid)

    lines_html = ""
    for line in invoice.lines:
        lines_html += f"""
        <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b;">{line.description}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569; text-align: center;">{line.quantity}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569; text-align: right;">{format_money(line.unit_price)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569; text-align: right;">{format_money(line.tax_amount)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right;">{format_money(line.amount)}</td>
        </tr>
        """

    payments_html = ""
    if invoice.payments:
        payments_html += """
        <div style="margin-top: 24px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Payment History</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8fafc; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">
                        <th style="padding: 6px 10px;">Date</th>
                        <th style="padding: 6px 10px;">Method</th>
                        <th style="padding: 6px 10px;">Note</th>
                        <th style="padding: 6px 10px; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
        """
        for p in invoice.payments:
            payments_html += f"""
                    <tr>
                        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9;">{format_date(p.paid_on)}</td>
                        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; text-transform: capitalize;">{p.method.replace('_', ' ')}</td>
                        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">{p.note or '-'}</td>
                        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">{format_money(p.amount)}</td>
                    </tr>
            """
        payments_html += """
                </tbody>
            </table>
        </div>
        """

    status_badge_color = {
        "paid": "#10b981",
        "confirmed": "#3b82f6",
        "draft": "#64748b",
        "cancelled": "#ef4444",
    }.get(invoice.status, "#64748b")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice {invoice.number}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 30px;
                color: #0f172a;
                background: #ffffff;
            }}
            @page {{
                margin: 20mm;
                size: A4 portrait;
            }}
        </style>
    </head>
    <body>
        <div style="max-width: 800px; margin: 0 auto;">
            <!-- Header -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                    <td style="vertical-align: top;">
                        <div style="font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px;">Brightloop</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Subscription Billing & SaaS Management</div>
                        <div style="font-size: 12px; color: #64748b;">support@brightloop.io | https://brightloop.io</div>
                    </td>
                    <td style="text-align: right; vertical-align: top;">
                        <div style="font-size: 28px; font-weight: 800; color: #0f172a; text-transform: uppercase;">INVOICE</div>
                        <div style="font-size: 14px; font-weight: 700; color: #475569; margin-top: 4px;">{invoice.number}</div>
                        <div style="margin-top: 6px;">
                            <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #fff; background-color: {status_badge_color};">
                                {invoice.status}
                            </span>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Customer & Dates Info -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background: #f8fafc; border-radius: 8px; padding: 16px;">
                <tr>
                    <td style="width: 50%; padding: 16px; vertical-align: top;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Billed To</div>
                        <div style="font-size: 14px; font-weight: 700; color: #0f172a;">{customer_name}</div>
                        {f'<div style="font-size: 13px; color: #334155;">{company_name}</div>' if company_name else ''}
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">{billing_addr}</div>
                        <div style="font-size: 12px; color: #64748b;">Tax ID: {tax_id}</div>
                    </td>
                    <td style="width: 50%; padding: 16px; vertical-align: top; text-align: right;">
                        <div style="font-size: 12px; color: #475569; margin-bottom: 4px;"><strong>Subscription:</strong> {invoice.subscription.number if invoice.subscription else 'N/A'}</div>
                        <div style="font-size: 12px; color: #475569; margin-bottom: 4px;"><strong>Period:</strong> {format_date(invoice.period_start)} – {format_date(invoice.period_end)}</div>
                        <div style="font-size: 12px; color: #475569; margin-bottom: 4px;"><strong>Issued On:</strong> {format_date(invoice.created_at)}</div>
                        <div style="font-size: 13px; color: #b91c1c; font-weight: 700;"><strong>Due Date:</strong> {format_date(invoice.due_date)}</div>
                    </td>
                </tr>
            </table>

            <!-- Line Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                    <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
                        <th style="padding: 10px 12px;">Description</th>
                        <th style="padding: 10px 12px; text-align: center;">Qty</th>
                        <th style="padding: 10px 12px; text-align: right;">Unit Price</th>
                        <th style="padding: 10px 12px; text-align: right;">Tax</th>
                        <th style="padding: 10px 12px; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {lines_html}
                </tbody>
            </table>

            <!-- Totals Section -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
                <table style="width: 320px; border-collapse: collapse; margin-left: auto;">
                    <tr>
                        <td style="padding: 6px 10px; font-size: 13px; color: #64748b;">Subtotal:</td>
                        <td style="padding: 6px 10px; font-size: 13px; color: #1e293b; text-align: right; font-weight: 600;">{format_money(invoice.subtotal)}</td>
                    </tr>
                    {f'''
                    <tr>
                        <td style="padding: 6px 10px; font-size: 13px; color: #16a34a;">Discount:</td>
                        <td style="padding: 6px 10px; font-size: 13px; color: #16a34a; text-align: right; font-weight: 600;">-{format_money(invoice.discount_total)}</td>
                    </tr>
                    ''' if invoice.discount_total > 0 else ''}
                    <tr>
                        <td style="padding: 6px 10px; font-size: 13px; color: #64748b;">Tax Total:</td>
                        <td style="padding: 6px 10px; font-size: 13px; color: #1e293b; text-align: right; font-weight: 600;">{format_money(invoice.tax_total)}</td>
                    </tr>
                    <tr style="border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0;">
                        <td style="padding: 10px; font-size: 15px; font-weight: 800; color: #0f172a;">Grand Total:</td>
                        <td style="padding: 10px; font-size: 15px; font-weight: 800; color: #4f46e5; text-align: right;">{format_money(invoice.total)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 10px; font-size: 13px; color: #16a34a;">Amount Paid:</td>
                        <td style="padding: 6px 10px; font-size: 13px; color: #16a34a; text-align: right; font-weight: 600;">{format_money(amount_paid)}</td>
                    </tr>
                    <tr style="background: #fef2f2;">
                        <td style="padding: 8px 10px; font-size: 13px; font-weight: 700; color: #991b1b;">Balance Due:</td>
                        <td style="padding: 8px 10px; font-size: 13px; font-weight: 700; color: #991b1b; text-align: right;">{format_money(balance_due)}</td>
                    </tr>
                </table>
            </div>

            {payments_html}

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
                Thank you for choosing Brightloop. For inquiries regarding this invoice, please reach out to billing@brightloop.io.
            </div>
        </div>
    </body>
    </html>
    """
    return html


def generate_invoice_pdf_reportlab(invoice) -> bytes:
    """Fallback PDF generator using ReportLab canvas / platypus for seamless local execution."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    elements = []
    styles = getSampleStyleSheet()

    # Title & Header
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor('#4f46e5'),
        spaceAfter=4,
    )
    elements.append(Paragraph("<b>Brightloop Subscription Platform</b>", title_style))
    elements.append(Paragraph(f"<b>INVOICE #{invoice.number}</b> | Status: <b>{invoice.status.upper()}</b>", styles['Normal']))
    elements.append(Spacer(1, 15))

    cust = invoice.subscription.customer if invoice.subscription else None
    cust_name = cust.name if cust else "Valued Customer"
    company = cust.company if cust and cust.company else ""
    addr = cust.billing_address if cust and cust.billing_address else "N/A"

    info_data = [
        [
            Paragraph(f"<b>Billed To:</b><br/>{cust_name}<br/>{company}<br/>{addr}", styles['Normal']),
            Paragraph(
                f"<b>Subscription:</b> {invoice.subscription.number if invoice.subscription else 'N/A'}<br/>"
                f"<b>Period:</b> {format_date(invoice.period_start)} - {format_date(invoice.period_end)}<br/>"
                f"<b>Due Date:</b> {format_date(invoice.due_date)}",
                styles['Normal']
            )
        ]
    ]
    info_table = Table(info_data, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    # Items Table
    table_data = [["Description", "Qty", "Unit Price", "Tax", "Amount"]]
    for line in invoice.lines:
        table_data.append([
            line.description,
            str(line.quantity),
            format_money(line.unit_price),
            format_money(line.tax_amount),
            format_money(line.amount),
        ])

    items_table = Table(table_data, colWidths=[230, 45, 85, 85, 95])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#334155')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))

    # Totals
    amount_paid = sum(p.amount for p in invoice.payments)
    balance_due = max(0, invoice.total - amount_paid)

    totals_data = [
        ["Subtotal:", format_money(invoice.subtotal)],
        ["Discount:", f"-{format_money(invoice.discount_total)}" if invoice.discount_total > 0 else "$0.00"],
        ["Tax Total:", format_money(invoice.tax_total)],
        ["Total Due:", format_money(invoice.total)],
        ["Amount Paid:", format_money(amount_paid)],
        ["Balance Due:", format_money(balance_due)],
    ]
    totals_table = Table(totals_data, colWidths=[120, 100], hAlign='RIGHT')
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,3), (-1,3), 'Helvetica-Bold'),
        ('FONTNAME', (0,5), (-1,5), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,5), (-1,5), colors.HexColor('#991b1b')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("<font size=8 color='#94a3b8'>Thank you for choosing Brightloop. Billing inquiries: billing@brightloop.io</font>", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def generate_invoice_pdf(invoice) -> bytes:
    """
    Renders invoice to PDF.
    First attempts WeasyPrint (standard master prompt requirement).
    If WeasyPrint native C-libraries are missing (e.g. Windows dev), gracefully uses ReportLab.
    """
    try:
        import weasyprint
        html_str = generate_invoice_html(invoice)
        pdf_bytes = weasyprint.HTML(string=html_str).write_pdf()
        return pdf_bytes
    except Exception as exc:
        logger.info(f"WeasyPrint not available ({exc}), generating invoice with ReportLab.")
        return generate_invoice_pdf_reportlab(invoice)

