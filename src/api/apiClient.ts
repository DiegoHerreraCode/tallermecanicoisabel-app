import axios from 'axios';

export const TallerMecanicoIsabelApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Accept': 'application/json',
  },
});

// Configurar interceptores para token Bearer
TallerMecanicoIsabelApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { TallerMecanicoIsabelApi as apiClient };
