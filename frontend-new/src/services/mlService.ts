import api from './api';

export interface ModelInfo {
  model_type: string;
  feature_count: number;
  training_data_count: number;
  cost_centers_count: number;
  cost_centers: string[];
}

export interface CostCenterPrediction {
  invoice_id: string;
  predicted_cost_center: string;
  confidence: number;
  cost_center_exists: boolean;
  cost_center_name: string | null;
}

export const mlService = {
  /**
   * Get information about the cost center classification model
   */
  async getModelInfo(): Promise<ModelInfo> {
    const response = await api.get<ModelInfo>('/api/ml/model-info');
    return response.data;
  },

  /**
   * Train the cost center classification model
   */
  async trainModel(): Promise<{ status: string; message: string }> {
    const response = await api.post<{ status: string; message: string }>('/api/ml/train-cost-center');
    return response.data;
  },

  /**
   * Classify an invoice's cost center
   */
  async classifyInvoice(invoiceId: string): Promise<CostCenterPrediction> {
    const response = await api.post<CostCenterPrediction>(`/api/ml/classify-invoice/${invoiceId}`);
    return response.data;
  },

  /**
   * Train cost center on a specific invoice
   */
  async trainOnInvoice(invoiceId: string, costCenterCode: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`/api/invoices/${invoiceId}`, {
      cost_center: costCenterCode,
      cost_center_manually_set: true,
    });
    
    // After updating the invoice, trigger model training
    if (response.status === 200) {
      await this.trainModel();
    }
    
    return {
      success: response.status === 200,
      message: response.status === 200 ? 'Cost center updated and model trained' : 'Failed to update cost center'
    };
  }
};

export default mlService; 