import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from email.mime.application import MIMEApplication
from app.config import settings

logger = logging.getLogger("brightloop.email")


def send_password_reset_email(to_email: str, reset_token: str):
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    subject = "Password Reset Request - Brightloop"
    body = f"""Hello,

We received a request to reset your password for your Brightloop account.
To reset your password, please click the link below (valid for {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes):

{reset_url}

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The Brightloop Team
"""

    if settings.EMAIL_CONSOLE_LOG or settings.ENVIRONMENT == "development":
        logger.info("\n" + "=" * 60)
        logger.info(f"EMAIL TO: {to_email}")
        logger.info(f"SUBJECT: {subject}")
        logger.info(f"RESET LINK: {reset_url}")
        logger.info("=" * 60 + "\n")
        print("\n" + "=" * 60)
        print(f"[DEVELOPMENT EMAIL DISPATCH]")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"RESET URL: {reset_url}")
        print("=" * 60 + "\n")
        return True

    # Otherwise attempt SMTP
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.EMAILS_FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_invoice_email(
    to_email: str,
    invoice_number: str,
    pdf_bytes: bytes,
    customer_name: str,
    amount_due_formatted: str,
) -> bool:
    subject = f"Invoice {invoice_number} from Brightloop"
    body = f"""Hello {customer_name},

Thank you for your business. Your invoice {invoice_number} for {amount_due_formatted} is ready.
Please find the attached PDF copy for your records.

Sincerely,
Brightloop Billing Team
https://brightloop.io
"""

    if settings.EMAIL_CONSOLE_LOG or settings.ENVIRONMENT == "development" or not settings.SMTP_HOST:
        logger.info(
            f"[DEV EMAIL LOG] Invoice Email To: {to_email} | Subject: '{subject}' | PDF: {len(pdf_bytes)} bytes"
        )
        print("\n" + "=" * 60)
        print(f"[DEVELOPMENT EMAIL DISPATCH]")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"ATTACHMENT: invoice-{invoice_number}.pdf ({len(pdf_bytes)} bytes)")
        print("=" * 60 + "\n")
        return True

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.EMAILS_FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        part = MIMEApplication(pdf_bytes, Name=f"invoice-{invoice_number}.pdf")
        part["Content-Disposition"] = f'attachment; filename="invoice-{invoice_number}.pdf"'
        msg.attach(part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Failed to send invoice email to {to_email}: {e}")
        return False


def send_overdue_reminder_email(
    to_email: str,
    invoice_number: str,
    customer_name: str,
    amount_due_formatted: str,
    days_overdue: int,
    due_date_formatted: str,
) -> bool:
    subject = f"Payment Reminder: Invoice {invoice_number} is {days_overdue} day(s) overdue"
    body = f"""Hello {customer_name},

This is a courtesy reminder that payment for invoice {invoice_number} was due on {due_date_formatted} ({days_overdue} day(s) ago).

Outstanding Balance Due: {amount_due_formatted}

Please log in to your Brightloop Customer Portal to view and pay your invoice, or reach out to our billing team.

Portal Link: {settings.FRONTEND_URL}/portal

Thank you,
Brightloop Accounts Receivable Team
https://brightloop.io
"""

    if settings.EMAIL_CONSOLE_LOG or settings.ENVIRONMENT == "development" or not settings.SMTP_HOST:
        logger.info(
            f"[DEV EMAIL LOG] Overdue Reminder To: {to_email} | Subject: '{subject}' | Balance: {amount_due_formatted}"
        )
        print("\n" + "=" * 60)
        print(f"[DEVELOPMENT OVERDUE REMINDER DISPATCH]")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"BALANCE DUE: {amount_due_formatted}")
        print(f"DAYS OVERDUE: {days_overdue}")
        print("=" * 60 + "\n")
        return True

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.EMAILS_FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Failed to send overdue reminder email to {to_email}: {e}")
        return False



