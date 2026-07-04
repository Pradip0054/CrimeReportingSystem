import axios from 'axios';

// Create a custom Axios instance
const instance = axios.create({
    // The base URL for your Laravel backend API
    baseURL: 'http://localhost:8000/api', 
});

/**
 * Request Interceptor:
 * This runs automatically before every request is sent to the server.
 * It checks for an auth token in localStorage and attaches it to the Headers.
 */
instance.interceptors.request.use((config) => {
    // Retrieve the token saved during the OTP verification process
    const token = localStorage.getItem('token');
    
    if (token) {
        // Attach the token in the 'Bearer' format required by Laravel Sanctum
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    // Handle request errors here
    return Promise.reject(error);
});

export default instance;