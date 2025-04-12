import pickle
import os
import numpy as np
from typing import List, Optional, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

class CostCenterClassifier:
    """
    A machine learning model for classifying invoices to cost centers based on
    invoice text content like vendor name, invoice number, and other metadata.
    """
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), "models", "cost_center_model.pkl")
        self.load_model()
    
    def load_model(self) -> None:
        """Load the trained model from disk if it exists."""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        if os.path.exists(self.model_path):
            with open(self.model_path, "rb") as f:
                self.model = pickle.load(f)
        else:
            # Create a default model
            self.model = Pipeline([
                ('tfidf', TfidfVectorizer(stop_words='english')),
                ('clf', RandomForestClassifier(n_estimators=100))
            ])
    
    def save_model(self) -> None:
        """Save the trained model to disk."""
        with open(self.model_path, "wb") as f:
            pickle.dump(self.model, f)
    
    def train(self, texts: List[str], labels: List[str]) -> None:
        """Train the model on invoice texts and their assigned cost centers."""
        self.model.fit(texts, labels)
        self.save_model()
    
    def predict(self, text: str) -> Tuple[str, float]:
        """
        Predict the cost center for a given invoice text.
        
        Returns:
            Tuple of (cost_center_code, confidence)
        """
        if self.model is None:
            return None, 0.0
        
        # Make prediction
        cost_center = self.model.predict([text])[0]
        
        # Get confidence scores
        try:
            # For probability-based models
            probs = self.model.predict_proba([text])[0]
            confidence = np.max(probs)
        except:
            # Fallback for models without probabilities
            confidence = 0.7  # Default confidence
        
        return cost_center, float(confidence)
    
    def prepare_invoice_text(
        self, 
        invoice: Dict[str, Any]
    ) -> str:
        """
        Prepare invoice data for the model by concatenating relevant text fields.
        """
        text_parts = []
        
        # Add vendor name
        if invoice.get("vendor"):
            text_parts.append(f"Vendor: {invoice['vendor']}")
        
        # Add invoice number
        if invoice.get("invoice_number"):
            text_parts.append(f"Invoice: {invoice['invoice_number']}")
        
        # Add amount and currency
        if invoice.get("amount") and invoice.get("currency"):
            text_parts.append(f"Amount: {invoice['amount']} {invoice['currency']}")
        
        # Add any extracted text from OCR
        if invoice.get("ocr_data") and invoice["ocr_data"].get("raw_text"):
            text_parts.append(invoice["ocr_data"]["raw_text"])
        
        return " ".join(text_parts)

# Create singleton instance
classifier = CostCenterClassifier() 