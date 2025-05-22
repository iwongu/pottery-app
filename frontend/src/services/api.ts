import axios from 'axios';

// Base URL for API calls
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Base URL for static file uploads (e.g., images)
// This assumes your backend serves static files from a root path like /uploads
// and not necessarily prefixed with /api
export const UPLOADS_BASE_URL = process.env.REACT_APP_UPLOADS_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL, // Use API_URL for actual API calls
});

// Interceptor to add JWT token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;

// Example image URL construction:
// For profile pics: `${UPLOADS_BASE_URL}/uploads/profile_pics/${user.profile_photo_filename}`
// For post images: `${UPLOADS_BASE_URL}/uploads/post_images/${post.image_filename}`