import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL
    ? (import.meta.env.VITE_API_URL.endsWith('/api')
        ? import.meta.env.VITE_API_URL
        : `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`)
    : '/api';

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

export default axiosClient;
