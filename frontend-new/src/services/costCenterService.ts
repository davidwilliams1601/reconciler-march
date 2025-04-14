import api from './api';

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CostCenterCreate {
  code: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface CostCenterUpdate {
  code?: string;
  name?: string;
  description?: string;
  active?: boolean;
}

export const costCenterService = {
  /**
   * Get all cost centers
   */
  async getCostCenters(params?: { 
    active_only?: boolean;
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_desc?: boolean;
  }): Promise<CostCenter[]> {
    // Build query params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const response = await api.get<CostCenter[]>(
      `/api/cost-centers?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single cost center by ID
   */
  async getCostCenter(id: string): Promise<CostCenter> {
    const response = await api.get<CostCenter>(`/api/cost-centers/${id}`);
    return response.data;
  },

  /**
   * Create a new cost center
   */
  async createCostCenter(data: CostCenterCreate): Promise<CostCenter> {
    const response = await api.post<CostCenter>('/api/cost-centers', data);
    return response.data;
  },

  /**
   * Update an existing cost center
   */
  async updateCostCenter(id: string, data: CostCenterUpdate): Promise<CostCenter> {
    const response = await api.put<CostCenter>(`/api/cost-centers/${id}`, data);
    return response.data;
  },

  /**
   * Delete a cost center
   */
  async deleteCostCenter(id: string): Promise<CostCenter> {
    const response = await api.delete<CostCenter>(`/api/cost-centers/${id}`);
    return response.data;
  }
};

export default costCenterService; 