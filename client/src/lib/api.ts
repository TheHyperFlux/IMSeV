import axios, { AxiosResponse } from 'axios';

const api = axios.create({
    baseURL: '/api', // Vite proxy handles the rest
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Helper to recursively transform _id to id
const transformId = (data: any): any => {
    if (Array.isArray(data)) {
        return data.map(transformId);
    }
    if (data !== null && typeof data === 'object') {
        if (data._id && !data.id) {
            data.id = data._id;
            // delete data._id; // Optional: keep _id or remove it
        }
        // Recurse into object properties
        Object.keys(data).forEach((key) => {
            // Avoid circular references or deep recursion on certain objects if needed
            // For simple JSON data from API, this is usually safe
            if (typeof data[key] === 'object' && data[key] !== null) {
                data[key] = transformId(data[key]);
            }
        });
    }
    return data;
};

// Add a response interceptor to transform _id to id
api.interceptors.response.use(
    (response: AxiosResponse) => {
        if (response.data) {
            // If the response follows the { success: true, data: ... } pattern
            if (response.data.data) {
                response.data.data = transformId(response.data.data);
            } else {
                // Fallback if data is at root or different structure
                response.data = transformId(response.data);
            }
        }
        return response;
    },
    (error) => Promise.reject(error)
);

export default api;
