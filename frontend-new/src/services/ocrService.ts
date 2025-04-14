import api from './api';

export interface OCRResult {
  raw_text: string;
  confidence: number;
  extracted_data: {
    detectedInvoiceNumber: string;
    detectedVendor: string;
    detectedAmount: number;
    detectedDate: string;
    confidence: {
      invoiceNumber: number;
      vendor: number;
      amount: number;
      date: number;
    };
  };
  processedAt: string;
}

export interface OCRProcessRequest {
  file: File;
}

export const ocrService = {
  /**
   * Process an invoice with OCR
   */
  async processInvoice(file: File): Promise<OCRResult> {
    // Create form data with file
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<OCRResult>(
      '/api/ocr/process',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Process an image file with OCR
   */
  async processImage(file: File): Promise<{ text: string; confidence: number }> {
    // Create form data with file
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ text: string; confidence: number }>(
      '/api/ocr/extract-text',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Extract structured data from an image file
   */
  async extractStructuredData(file: File): Promise<{
    text: string;
    fields: Record<string, string>;
    confidence: number;
  }> {
    // Create form data with file
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{
      text: string;
      fields: Record<string, string>;
      confidence: number;
    }>(
      '/api/ocr/extract-structured',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
};

export default ocrService; 