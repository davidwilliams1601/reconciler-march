import axios from 'axios';

// Debug environment variables
console.log('Frontend Environment Variables:');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

// Debug base URL
console.log('API baseURL:', api.defaults.baseURL);

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Only set Content-Type if it's not a FormData request
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Debug request details
    console.log('API Request Details:');
    console.log('- Method:', config.method?.toUpperCase());
    console.log('- URL:', config.url || '');
    console.log('- Full URL:', (config.baseURL || '') + (config.url || ''));
    console.log('- Headers:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.statusText);
    return response;
  },
  (error) => {
    console.error('API Error Details:');
    console.error('- Status:', error.response?.status);
    console.error('- Status Text:', error.response?.statusText);
    console.error('- Headers:', error.response?.headers);
    console.error('- Data:', error.response?.data);
    return Promise.reject(error);
  }
);

export default api; 