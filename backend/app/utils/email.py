"""Email service using SendGrid for transactional emails."""

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from typing import Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Initialize SendGrid client
sg_client = None
if settings.sendgrid_api_key:
    sg_client = SendGridAPIClient(settings.sendgrid_api_key)


class EmailService:
    """Service class for sending emails via SendGrid."""
    
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        """Send an email using SendGrid.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text content (optional)
            from_email: Sender email (defaults to config)
            from_name: Sender name (defaults to config)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not sg_client:
            logger.warning(f"SendGrid not configured. Would send email to {to_email}: {subject}")
            return False
        
        try:
            from_email = from_email or settings.sender_email
            from_name = from_name or settings.sender_name
            
            message = Mail(
                from_email=Email(from_email, from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            if text_content:
                message.add_content(Content("text/plain", text_content))
            
            response = sg_client.send(message)
            
            if response.status_code >= 200 and response.status_code < 300:
                logger.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"Failed to send email to {to_email}: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    async def send_password_reset(
        to_email: str,
        reset_token: str,
        frontend_url: str = "http://localhost:3000"
    ) -> bool:
        """Send password reset email.
        
        Args:
            to_email: Recipient email
            reset_token: Password reset token
            frontend_url: Frontend application URL
            
        Returns:
            True if email sent successfully
        """
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ 
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #0066cc;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 4px;
                    margin: 20px 0;
                }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Reset Your Password</h2>
                <p>You requested to reset your password for your Pulse account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="{reset_url}" class="button">Reset Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="{reset_url}">{reset_url}</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <div class="footer">
                    <p>This is an automated email from Pulse. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Reset Your Password
        
        You requested to reset your password for your Pulse account.
        
        Click this link to reset your password:
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request this, you can safely ignore this email.
        """
        
        return await EmailService.send_email(
            to_email=to_email,
            subject="Reset Your Pulse Password",
            html_content=html_content,
            text_content=text_content
        )
    
    @staticmethod
    async def send_email_verification(
        to_email: str,
        verification_token: str,
        frontend_url: str = "http://localhost:3000"
    ) -> bool:
        """Send email verification email.
        
        Args:
            to_email: Recipient email
            verification_token: Email verification token
            frontend_url: Frontend application URL
            
        Returns:
            True if email sent successfully
        """
        verification_url = f"{frontend_url}/verify-email?token={verification_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ 
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #00cc66;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 4px;
                    margin: 20px 0;
                }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Verify Your Email</h2>
                <p>Welcome to Pulse! Please verify your email address to complete your registration.</p>
                <a href="{verification_url}" class="button">Verify Email</a>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="{verification_url}">{verification_url}</a></p>
                <p>This link will expire in 24 hours.</p>
                <div class="footer">
                    <p>This is an automated email from Pulse. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Verify Your Email
        
        Welcome to Pulse! Please verify your email address to complete your registration.
        
        Click this link to verify:
        {verification_url}
        
        This link will expire in 24 hours.
        """
        
        return await EmailService.send_email(
            to_email=to_email,
            subject="Verify Your Pulse Email",
            html_content=html_content,
            text_content=text_content
        )
    
    @staticmethod
    async def send_welcome_email(
        to_email: str,
        user_name: str
    ) -> bool:
        """Send welcome email for new users.
        
        Args:
            to_email: Recipient email
            user_name: User's name
            
        Returns:
            True if email sent successfully
        """
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Welcome to Pulse! 🎉</h2>
                <p>Hi {user_name},</p>
                <p>Thank you for joining Pulse! We're excited to help you manage your business more effectively.</p>
                <h3>Getting Started:</h3>
                <ul>
                    <li>Add your employees</li>
                    <li>Set up your payroll</li>
                    <li>Track your finances</li>
                    <li>Communicate with your team</li>
                </ul>
                <p>If you have any questions, feel free to reach out to our support team.</p>
                <div class="footer">
                    <p>This is an automated email from Pulse. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to Pulse!
        
        Hi {user_name},
        
        Thank you for joining Pulse! We're excited to help you manage your business more effectively.
        
        Getting Started:
        - Add your employees
        - Set up your payroll
        - Track your finances
        - Communicate with your team
        
        If you have any questions, feel free to reach out to our support team.
        """
        
        return await EmailService.send_email(
            to_email=to_email,
            subject="Welcome to Pulse!",
            html_content=html_content,
            text_content=text_content
        )
    
    @staticmethod
    async def send_invoice_email(
        to_email: str,
        invoice_number: str,
        amount_due: float,
        due_date: str,
        invoice_pdf_url: Optional[str] = None
    ) -> bool:
        """Send invoice email.
        
        Args:
            to_email: Recipient email
            invoice_number: Invoice number
            amount_due: Amount due
            due_date: Due date string
            invoice_pdf_url: URL to PDF invoice
            
        Returns:
            True if email sent successfully
        """
        pdf_link = f'<a href="{invoice_pdf_url}">Download Invoice PDF</a>' if invoice_pdf_url else ""
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .invoice-details {{ background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>New Invoice from Pulse</h2>
                <div class="invoice-details">
                    <p><strong>Invoice Number:</strong> {invoice_number}</p>
                    <p><strong>Amount Due:</strong> ${amount_due:.2f}</p>
                    <p><strong>Due Date:</strong> {due_date}</p>
                </div>
                {pdf_link}
                <p>Thank you for your business!</p>
                <div class="footer">
                    <p>This is an automated email from Pulse. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        New Invoice from Pulse
        
        Invoice Number: {invoice_number}
        Amount Due: ${amount_due:.2f}
        Due Date: {due_date}
        
        {f'Download PDF: {invoice_pdf_url}' if invoice_pdf_url else ''}
        
        Thank you for your business!
        """
        
        return await EmailService.send_email(
            to_email=to_email,
            subject=f"Invoice {invoice_number} from Pulse",
            html_content=html_content,
            text_content=text_content
        )
    
    @staticmethod
    async def send_payment_failed_email(
        to_email: str,
        amount: float,
        next_attempt_date: Optional[str] = None
    ) -> bool:
        """Send payment failed email.
        
        Args:
            to_email: Recipient email
            amount: Failed payment amount
            next_attempt_date: Next retry date
            
        Returns:
            True if email sent successfully
        """
        retry_info = f"<p>We'll automatically retry on {next_attempt_date}.</p>" if next_attempt_date else ""
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .alert {{ background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107; }}
                .button {{ 
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #0066cc;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 4px;
                    margin: 20px 0;
                }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Payment Failed</h2>
                <div class="alert">
                    <p><strong>We couldn't process your payment of ${amount:.2f}.</strong></p>
                </div>
                <p>Your payment method may have insufficient funds, expired, or been declined by your bank.</p>
                {retry_info}
                <p>Please update your payment method to avoid service interruption.</p>
                <a href="http://localhost:3000/settings/billing" class="button">Update Payment Method</a>
                <div class="footer">
                    <p>This is an automated email from Pulse. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Payment Failed
        
        We couldn't process your payment of ${amount:.2f}.
        
        Your payment method may have insufficient funds, expired, or been declined by your bank.
        
        {f"We'll automatically retry on {next_attempt_date}." if next_attempt_date else ""}
        
        Please update your payment method to avoid service interruption.
        """
        
        return await EmailService.send_email(
            to_email=to_email,
            subject="Payment Failed - Action Required",
            html_content=html_content,
            text_content=text_content
        )
