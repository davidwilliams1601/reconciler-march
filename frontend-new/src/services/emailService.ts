import api from './api';

export interface EmailSettings {
  enabled: boolean;
  server: string;
  email_address: string;
  folder: string;
}

export interface EmailProcessingResult {
  status: string;
  processed_count: number;
  invoices_created: string[];
  errors: string[];
}

export const emailService = {
  /**
   * Get email processing settings
   */
  async getSettings(): Promise<EmailSettings> {
    const response = await api.get<EmailSettings>('/api/email-processing/settings');
    return response.data;
  },

  /**
   * Start polling emails in the background
   */
  async pollEmails(limit: number = 10): Promise<{ status: string }> {
    const response = await api.post<{ status: string }>(
      `/api/email-processing/poll?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Process emails immediately (not in the background)
   */
  async processEmailsNow(limit: number = 10): Promise<EmailProcessingResult> {
    const response = await api.post<EmailProcessingResult>(
      `/api/email-processing/process-now?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Update email processing settings
   */
  async updateSettings(settings: {
    email_address?: string;
    email_password?: string;
    email_server?: string;
    email_folder?: string;
    email_enabled?: boolean;
  }): Promise<EmailSettings> {
    const response = await api.post<EmailSettings>(
      '/api/settings',
      {
        email_address: settings.email_address,
        email_password: settings.email_password,
        email_server: settings.email_server,
        email_folder: settings.email_folder,
        email_enabled: settings.email_enabled,
      }
    );
    return response.data;
  }
};

export default emailService; 