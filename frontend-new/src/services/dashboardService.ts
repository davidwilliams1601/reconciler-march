import api from './api';

export interface DashboardStats {
  totalInvoices: number;
  processedInvoices: number;
  pendingInvoices: number;
  totalAmount: number;
  currency: string;
  recentInvoices: Array<{
    id: string;
    invoice_number: string;
    vendor: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  }>;
}

export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/api/dashboard/stats');
    
    // Map backend data structure to frontend
    const stats: DashboardStats = {
      totalInvoices: response.data.totalInvoices,
      processedInvoices: response.data.processedInvoices,
      pendingInvoices: response.data.pendingInvoices,
      totalAmount: response.data.totalAmount,
      currency: response.data.currency,
      recentInvoices: response.data.recentInvoices || []
    };
    
    return stats;
  }
};

export default dashboardService; 