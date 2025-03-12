import axios from 'axios';

// Configure axios defaults
const baseURL = process.env.NODE_ENV === 'production'
    ? 'https://reconciler-backend.onrender.com'
    : 'http://localhost:4001';

console.log('Using API baseURL:', baseURL);

axios.defaults.baseURL = baseURL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for error handling
axios.interceptors.request.use(
    config => {
        console.log('Making request to:', config.url);
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            console.error('API Error:', error.response.data);
        }
        return Promise.reject(error);
    }
);

export default axios; 