import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext';
import './index.css'
import axios from 'axios';

// Configure Axios to include JWT token in all requests
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

// Handle session expiry
axios.interceptors.response.use(response => response, error => {
    if (error.response && [401, 403].includes(error.response.status)) {
        // Only redirect if not already on login page (optional check)
        // localStorage.removeItem('token');
        // window.location.reload(); 
        // Note: For now, we'll let individual components handle specific errors or implement a global redirect later if needed.
        // Actually, for basic auth, let's just clear token to force re-login logic if app checks it.
    }
    return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <LanguageProvider>
            <App />
        </LanguageProvider>
    </React.StrictMode>,
)
