import axios from 'axios';

// Debug environment variables
console.log('Frontend Environment Variables:');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

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

      // Handle 502 errors (Bad Gateway)
      if (error.response.status === 502) {
        console.error('Backend server is unreachable (502 Bad Gateway)');
        // You could implement fallback behavior here if needed
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error (No Response):', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 