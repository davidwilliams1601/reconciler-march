import os
import imaplib
import email
import uuid
import tempfile
from email.header import decode_header
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

from app.services.ocr import ocr_service


class EmailProcessor:
    """
    Service for connecting to an email inbox and processing incoming emails with invoice attachments.
    """
    
    def __init__(self):
        self.email_address = os.environ.get("EMAIL_ADDRESS")
        self.email_password = os.environ.get("EMAIL_PASSWORD")
        self.email_server = os.environ.get("EMAIL_SERVER", "imap.gmail.com")
        self.email_folder = os.environ.get("EMAIL_FOLDER", "INBOX")
        self.uploads_dir = "uploads"
        
        # Create uploads directory if it doesn't exist
        os.makedirs(self.uploads_dir, exist_ok=True)

    def is_configured(self) -> bool:
        """Check if email integration is configured with valid credentials."""
        return bool(self.email_address and self.email_password and self.email_server)
    
    def connect(self) -> Optional[imaplib.IMAP4_SSL]:
        """Connect to the email server and authenticate."""
        if not self.is_configured():
            return None
            
        try:
            # Connect to server
            mail = imaplib.IMAP4_SSL(self.email_server)
            
            # Login
            mail.login(self.email_address, self.email_password)
            
            # Select the mailbox
            mail.select(self.email_folder)
            
            return mail
        except Exception as e:
            print(f"Error connecting to email: {str(e)}")
            return None
    
    def fetch_unprocessed_emails(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Fetch unprocessed emails with attachments.
        
        Args:
            limit: Maximum number of emails to fetch
            
        Returns:
            List of dictionaries with email metadata and attachments
        """
        if not self.is_configured():
            return self._mock_fetch_emails()
        
        try:
            mail = self.connect()
            if not mail:
                return self._mock_fetch_emails()
            
            # Search for all unseen emails
            result, data = mail.search(None, "UNSEEN")
            
            if result != "OK":
                print("No messages found!")
                return []
            
            # Get email IDs
            email_ids = data[0].split()
            
            # Limit the number of emails to process
            if limit and len(email_ids) > limit:
                email_ids = email_ids[:limit]
            
            emails = []
            
            # Process each email
            for email_id in email_ids:
                # Fetch the email
                result, data = mail.fetch(email_id, "(RFC822)")
                
                if result != "OK":
                    print(f"Error fetching email {email_id}")
                    continue
                
                # Parse the email
                raw_email = data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                email_data = {
                    "id": email_id.decode(),
                    "subject": self._decode_email_header(msg["Subject"]),
                    "from": self._decode_email_header(msg["From"]),
                    "date": self._decode_email_header(msg["Date"]),
                    "attachments": [],
                    "body": "",
                }
                
                # Get email body
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        content_disposition = str(part.get("Content-Disposition"))
                        
                        # Extract text body
                        if content_type == "text/plain" and "attachment" not in content_disposition:
                            email_data["body"] = part.get_payload(decode=True).decode()
                        
                        # Extract attachments
                        elif "attachment" in content_disposition:
                            attachment = self._process_attachment(part)
                            if attachment:
                                email_data["attachments"].append(attachment)
                else:
                    # Not multipart - i.e. plain text, no attachments
                    email_data["body"] = msg.get_payload(decode=True).decode()
                
                emails.append(email_data)
                
                # Mark as seen
                mail.store(email_id, "+FLAGS", "\\Seen")
            
            mail.close()
            mail.logout()
            
            return emails
        
        except Exception as e:
            print(f"Error fetching emails: {str(e)}")
            return self._mock_fetch_emails()
    
    def _process_attachment(self, part) -> Optional[Dict[str, Any]]:
        """Process email attachment and save to disk."""
        try:
            filename = part.get_filename()
            
            if filename:
                # Decode filename if needed
                filename_parts = decode_header(filename)
                if filename_parts[0][1] is not None:
                    filename = filename_parts[0][0].decode(filename_parts[0][1])
                else:
                    filename = filename_parts[0][0]
                
                # Clean filename and add unique identifier
                base_name, extension = os.path.splitext(filename)
                clean_name = f"{base_name.replace(' ', '_')}_{uuid.uuid4().hex[:8]}{extension}"
                
                # Save the attachment
                file_path = os.path.join(self.uploads_dir, clean_name)
                with open(file_path, "wb") as f:
                    f.write(part.get_payload(decode=True))
                
                return {
                    "filename": filename,
                    "saved_path": file_path,
                    "content_type": part.get_content_type(),
                    "size": len(part.get_payload(decode=True))
                }
            
        except Exception as e:
            print(f"Error processing attachment: {str(e)}")
        
        return None
    
    def _decode_email_header(self, header: Optional[str]) -> str:
        """Decode email header value."""
        if not header:
            return ""
            
        decoded_parts = decode_header(header)
        header_text = ""
        
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                if encoding:
                    header_text += part.decode(encoding)
                else:
                    header_text += part.decode()
            else:
                header_text += part
                
        return header_text
    
    def process_invoice_emails(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Process emails with invoice attachments.
        
        Args:
            limit: Maximum number of emails to process
            
        Returns:
            List of processed invoices with OCR results
        """
        # Fetch emails
        emails = self.fetch_unprocessed_emails(limit)
        
        results = []
        
        for email_data in emails:
            # Process attachments
            for attachment in email_data["attachments"]:
                if self._is_invoice_attachment(attachment):
                    # Process with OCR
                    ocr_result = ocr_service.process_invoice(attachment["saved_path"])
                    
                    # Extract sender domain
                    sender_domain = self._extract_domain_from_email(email_data["from"])
                    
                    # Add email metadata
                    invoice_data = {
                        "email_metadata": {
                            "subject": email_data["subject"],
                            "from": email_data["from"],
                            "domain": sender_domain,
                            "date": email_data["date"],
                        },
                        "attachment": attachment,
                        "ocr_data": ocr_result,
                        "extracted_invoice": {
                            "invoice_number": ocr_result["extracted_data"]["detectedInvoiceNumber"],
                            "vendor": ocr_result["extracted_data"]["detectedVendor"],
                            "amount": ocr_result["extracted_data"]["detectedAmount"],
                            "date": ocr_result["extracted_data"]["detectedDate"],
                            "confidence": ocr_result["confidence"],
                        }
                    }
                    
                    results.append(invoice_data)
        
        return results
    
    def _is_invoice_attachment(self, attachment: Dict[str, Any]) -> bool:
        """Check if an attachment is likely an invoice."""
        if not attachment:
            return False
            
        # Check file extension
        valid_extensions = [".pdf", ".jpg", ".jpeg", ".png"]
        _, extension = os.path.splitext(attachment["filename"])
        
        if extension.lower() not in valid_extensions:
            return False
            
        # Check content type
        valid_content_types = ["application/pdf", "image/jpeg", "image/png"]
        if attachment["content_type"] not in valid_content_types:
            return False
            
        return True
    
    def _extract_domain_from_email(self, email_address: str) -> str:
        """Extract domain from email address."""
        try:
            # Extract address from "Name <email@domain.com>" format
            if "<" in email_address and ">" in email_address:
                start = email_address.find("<") + 1
                end = email_address.find(">")
                email_address = email_address[start:end]
            
            # Extract domain
            domain = email_address.split("@")[-1]
            return domain
        except:
            return ""
    
    def _mock_fetch_emails(self) -> List[Dict[str, Any]]:
        """Generate mock email data for testing."""
        return [
            {
                "id": "mock1",
                "subject": "Invoice #INV-001 from Acme Inc",
                "from": "accounts@acmeinc.com",
                "date": datetime.now().strftime("%a, %d %b %Y %H:%M:%S +0000"),
                "body": "Please find attached our invoice #INV-001 for your recent purchase.",
                "attachments": [
                    {
                        "filename": "INV-001.pdf",
                        "saved_path": os.path.join(self.uploads_dir, f"INV-001_{uuid.uuid4().hex[:8]}.pdf"),
                        "content_type": "application/pdf",
                        "size": 1024 * 50  # 50 KB
                    }
                ]
            },
            {
                "id": "mock2",
                "subject": "Monthly Invoice from Tech Solutions Ltd",
                "from": "billing@techsolutions.com",
                "date": datetime.now().strftime("%a, %d %b %Y %H:%M:%S +0000"),
                "body": "Please process the attached invoice for your monthly subscription.",
                "attachments": [
                    {
                        "filename": "Invoice_TS_2023_05.pdf",
                        "saved_path": os.path.join(self.uploads_dir, f"Invoice_TS_2023_05_{uuid.uuid4().hex[:8]}.pdf"),
                        "content_type": "application/pdf",
                        "size": 1024 * 75  # 75 KB
                    }
                ]
            }
        ]

# Create singleton instance
email_processor = EmailProcessor() 