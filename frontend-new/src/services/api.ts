import axios from 'axios';
import { 
  mockInvoices, 
  mockDashboardStats, 
  mockXeroIntegration, 
  mockXeroInvoices, 
  mockXeroBankTransactions 
} from './mockData';
import { mockSettings, mockOrganization, mockEmailProcessing, mockCostCenters } from './mockSettings';

// Debug environment variables
console.log('Frontend Environment Variables:');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Control mock mode with environment variable or enable when in development
const MOCK_MODE = process.env.REACT_APP_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';
console.log('MOCK_MODE:', MOCK_MODE);

// Determine the base URL based on environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    // In development, the proxy will handle routing to the correct server
    return '';
  }
  // In production, use the deployed backend URL
  return 'https://reconciler-march.onrender.com';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000, // Increase timeout to 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug base URL
console.log('API baseURL:', api.defaults.baseURL);

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
      });

      // Handle 502 errors (Bad Gateway) or 404 errors (Not Found)
      if (error.response.status === 502 || error.response.status === 404) {
        console.warn(`Backend server returned ${error.response.status}. Using mock data if available.`);
        
        // Check if we're in mock mode and can provide mock data
        if (MOCK_MODE) {
          const url = error.config.url;
          
          // Return mock data based on the API endpoint
          if (url && url.includes('/api/invoices')) {
            console.info('Using mock invoice data');
            return Promise.resolve({ data: mockInvoices });
          }
          
          if (url && url.includes('/api/dashboard/stats')) {
            console.info('Using mock dashboard stats');
            return Promise.resolve({ data: mockDashboardStats });
          }
          
          if (url && url.includes('/api/settings')) {
            console.info('Using mock settings data');
            return Promise.resolve({ data: mockSettings });
          }
          
          if (url && url.includes('/api/organization')) {
            console.info('Using mock organization data');
            return Promise.resolve({ data: mockOrganization });
          }
          
          if (url && url.includes('/api/email-processing')) {
            console.info('Using mock email processing data');
            return Promise.resolve({ data: mockEmailProcessing });
          }
          
          if (url && url.includes('/api/cost-centers')) {
            console.info('Using mock cost centers data');
            return Promise.resolve({ data: mockCostCenters });
          }
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error (No Response):', error.request);
      
      // Check if we're in mock mode and can provide mock data
      if (MOCK_MODE) {
        const url = error.config.url;
        
        // Return mock data based on the API endpoint
        if (url && url.includes('/api/invoices')) {
          console.info('Using mock invoice data due to network error');
          return Promise.resolve({ data: mockInvoices });
        }
        
        if (url && url.includes('/api/dashboard/stats')) {
          console.info('Using mock dashboard stats due to network error');
          return Promise.resolve({ data: mockDashboardStats });
        }
        
        if (url && url.includes('/api/settings')) {
          console.info('Using mock settings data due to network error');
          return Promise.resolve({ data: mockSettings });
        }
        
        if (url && url.includes('/api/organization')) {
          console.info('Using mock organization data due to network error');
          return Promise.resolve({ data: mockOrganization });
        }
        
        if (url && url.includes('/api/email-processing')) {
          console.info('Using mock email processing data due to network error');
          return Promise.resolve({ data: mockEmailProcessing });
        }
        
        if (url && url.includes('/api/cost-centers')) {
          console.info('Using mock cost centers data due to network error');
          return Promise.resolve({ data: mockCostCenters });
        }
        
        // Handle Xero API endpoints
        if (url && url.includes('/api/xero/status')) {
          console.info('Using mock Xero status data due to network error');
          return Promise.resolve({ data: mockXeroIntegration.status });
        }
        
        if (url && url.includes('/api/xero/auth-url')) {
          console.info('Using mock Xero auth URL data due to network error');
          return Promise.resolve({ data: mockXeroIntegration.authUrl });
        }
        
        if (url && url.includes('/api/xero/invoices')) {
          console.info('Using mock Xero invoices data due to network error');
          return Promise.resolve({ data: mockXeroInvoices });
        }
        
        if (url && url.includes('/api/xero/bank-transactions')) {
          console.info('Using mock Xero bank transactions data due to network error');
          return Promise.resolve({ data: mockXeroBankTransactions });
        }
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 