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

// Determine if the backend is available
let backendIsDown = false;

// Function to check if backend is available
const checkBackendAvailability = async () => {
  try {
    console.log('Checking backend availability at:', `${getBaseUrl()}/health`);
    
    // First try with normal fetch
    const response = await fetch(`${getBaseUrl()}/health`, { 
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Don't use no-cors as it doesn't provide useful status information
    });
    
    console.log('Health check response:', response.status);
    
    if (response.ok) {
      backendIsDown = false;
      console.log('Backend is available - health check succeeded');
    } else if (response.status === 404) {
      // If health endpoint doesn't exist, try a different endpoint
      console.log('Health endpoint not found, trying /api/status instead');
      try {
        const altResponse = await fetch(`${getBaseUrl()}/api/status`, { method: 'GET' });
        if (altResponse.ok) {
          backendIsDown = false;
          console.log('Backend is available - alternative check succeeded');
        } else {
          backendIsDown = true;
          console.log('Backend appears to be down or hibernating (status check failed)');
        }
      } catch (altError) {
        backendIsDown = true;
        console.log('Backend appears to be down (alternative check failed):', altError);
      }
    } else {
      backendIsDown = true;
      console.log(`Backend health check failed with status: ${response.status}`);
    }
  } catch (error) {
    backendIsDown = true;
    console.log('Backend appears to be down, enabling fallback mode:', error);
    
    // In development, this is expected since there might not be a backend
    if (process.env.NODE_ENV === 'development' || MOCK_MODE) {
      console.log('Using mock data since we are in development/mock mode');
    }
  }
};

// Check backend availability on startup
checkBackendAvailability();

// Periodically check backend availability when it's marked as down
setInterval(() => {
  if (backendIsDown) {
    console.log('Attempting to reconnect to backend...');
    checkBackendAvailability();
  }
}, 30000); // Check every 30 seconds

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
        url: error.config.url,
        headers: error.response.headers,
        data: error.response.data,
      });

      // If we get a 503 or 502, mark the backend as down for future requests
      if (error.response.status === 503 || error.response.status === 502) {
        backendIsDown = true;
        console.warn('Backend appears to be down or hibernating. Enabling fallback mode.');
      }

      // Handle errors when backend is down or in mock mode
      if ((error.response.status === 502 || error.response.status === 404 || 
           error.response.status === 503) && (MOCK_MODE || backendIsDown)) {
        console.warn(`Backend server returned ${error.response.status}. Using mock data.`);
        
        const url = error.config.url;
        
        // Handle Xero API endpoints first as they're causing issues
        if (url && url.includes('/api/xero/status')) {
          console.info('Using mock Xero status data');
          return Promise.resolve({ data: mockXeroIntegration.status });
        }
        
        if (url && url.includes('/api/xero/auth-url')) {
          console.info('Using mock Xero auth URL data');
          return Promise.resolve({ data: mockXeroIntegration.authUrl });
        }
        
        if (url && url.includes('/api/xero/invoices')) {
          console.info('Using mock Xero invoices data');
          return Promise.resolve({ data: mockXeroInvoices });
        }
        
        if (url && url.includes('/api/xero/bank-transactions')) {
          console.info('Using mock Xero bank transactions data');
          return Promise.resolve({ data: mockXeroBankTransactions });
        }
        
        if (url && url.includes('/api/xero/disconnect')) {
          console.info('Using mock Xero disconnect response');
          return Promise.resolve({ 
            data: { 
              success: true, 
              message: 'Successfully disconnected from Xero (mock)' 
            } 
          });
        }
        
        // Then handle other API endpoints
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
        }}
      } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error (No Response):', error.request);
      
      // Mark the backend as down
      backendIsDown = true;
      
      // Use mock data if in mock mode OR if backend is detected as down
      if (MOCK_MODE || backendIsDown) {
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