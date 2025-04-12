import os
import io
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
import re

class OCRService:
    """
    Service for optical character recognition (OCR) of invoice documents.
    Integrates with Google Cloud Vision API.
    """
    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_VISION_API_KEY")
    
    def is_configured(self) -> bool:
        """Check if the OCR service is configured with API credentials."""
        return bool(self.api_key)
    
    def process_invoice(self, file_path: str) -> Dict[str, Any]:
        """
        Process an invoice file using OCR.
        
        Args:
            file_path: Path to the invoice file
            
        Returns:
            Dictionary with OCR results including:
            - raw_text: Full extracted text
            - confidence: Overall confidence score
            - extracted_data: Structured data (invoice number, vendor, amount, date)
        """
        # Check if the file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Check if Google Vision is configured
        if not self.is_configured():
            return self._mock_ocr_process(file_path)
        
        # In a real implementation, this would use the Google Vision API
        # For now, we'll return mock data
        return self._mock_ocr_process(file_path)
    
    def _mock_ocr_process(self, file_path: str) -> Dict[str, Any]:
        """
        Provide mock OCR processing for development and testing.
        
        In a real implementation, this would be replaced with actual Google Vision API calls.
        """
        # Get file extension
        _, ext = os.path.splitext(file_path)
        
        # Read a small part of the file to check if it's a valid document
        try:
            with open(file_path, "rb") as f:
                _ = f.read(100)  # Just read a bit to check if file is valid
        except Exception as e:
            raise ValueError(f"Error reading file: {str(e)}")
        
        # For mock purposes, extract some data from the filename
        filename = os.path.basename(file_path)
        invoice_number_match = re.search(r'INV[-_]?(\d+)', filename, re.IGNORECASE)
        invoice_number = invoice_number_match.group(0) if invoice_number_match else "UNKNOWN"
        
        # Generate mock text based on filename
        raw_text = f"""
        INVOICE
        
        Invoice Number: {invoice_number}
        Date: {datetime.now().strftime('%Y-%m-%d')}
        
        Vendor: Example Vendor Ltd
        Customer: Client Company
        
        Items:
        1. Service Fee          $1,250.00
        2. Materials            $750.00
        
        Subtotal:              $2,000.00
        Tax (20%):              $400.00
        
        Total:                 $2,400.00
        
        Payment Terms: Net 30
        """
        
        # Extract data with regex
        extracted_data = {
            "detectedInvoiceNumber": invoice_number,
            "detectedVendor": "Example Vendor Ltd",
            "detectedAmount": 2400.00,
            "detectedDate": datetime.now().strftime('%Y-%m-%d'),
            "confidence": {
                "invoiceNumber": 0.95,
                "vendor": 0.9,
                "amount": 0.85,
                "date": 0.9,
            }
        }
        
        # Calculate overall confidence
        confidence = sum(extracted_data["confidence"].values()) / len(extracted_data["confidence"])
        
        return {
            "raw_text": raw_text,
            "confidence": confidence,
            "extracted_data": extracted_data,
            "processedAt": datetime.now().isoformat()
        }
    
    def _real_ocr_process(self, file_path: str) -> Dict[str, Any]:
        """
        Actual implementation using Google Vision API.
        
        Note: This is not implemented yet and would require the google-cloud-vision package.
        """
        try:
            from google.cloud import vision
            
            # Initialize Google Vision client
            client = vision.ImageAnnotatorClient()
            
            # Read file
            with io.open(file_path, 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            
            # Perform text detection
            response = client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(f"Google Vision API error: {response.error.message}")
            
            # Process response
            raw_text = response.full_text_annotation.text
            
            # Extract data using regex
            invoice_number_match = re.search(r'invoice\s*(?:no|number|#)?[:\s]*([a-z0-9\-]+)', raw_text, re.IGNORECASE)
            invoice_number = invoice_number_match.group(1) if invoice_number_match else "UNKNOWN"
            
            vendor_match = re.search(r'(?:from|vendor|supplier|company)?\s*:\s*([^\n]+)', raw_text, re.IGNORECASE)
            vendor = vendor_match.group(1) if vendor_match else "UNKNOWN"
            
            amount_match = re.search(r'(?:total|amount|sum)\s*:?\s*(?:[£$€])?\s*(\d+(?:,\d+)*(?:\.\d+)?)', raw_text, re.IGNORECASE)
            amount = float(amount_match.group(1).replace(',', '')) if amount_match else 0.0
            
            date_match = re.search(r'(?:date|issued)?\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})', raw_text, re.IGNORECASE)
            date = date_match.group(1) if date_match else datetime.now().strftime('%Y-%m-%d')
            
            # Calculate confidence
            confidence = response.full_text_annotation.pages[0].confidence if response.full_text_annotation.pages else 0.7
            
            extracted_data = {
                "detectedInvoiceNumber": invoice_number,
                "detectedVendor": vendor,
                "detectedAmount": amount,
                "detectedDate": date,
                "confidence": {
                    "invoiceNumber": confidence,
                    "vendor": confidence,
                    "amount": confidence,
                    "date": confidence,
                }
            }
            
            return {
                "raw_text": raw_text,
                "confidence": confidence,
                "extracted_data": extracted_data,
                "processedAt": datetime.now().isoformat()
            }
            
        except ImportError:
            # Fallback to mock implementation if Google Vision is not available
            return self._mock_ocr_process(file_path)
        except Exception as e:
            # If any error occurs, fall back to mock implementation
            print(f"Error in OCR processing: {str(e)}")
            return self._mock_ocr_process(file_path)

# Create singleton instance
ocr_service = OCRService() 