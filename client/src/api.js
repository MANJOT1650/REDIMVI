import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
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

export const signup = (username, email, password, confirmPassword) => {
  return api.post('/auth/signup', { username, email, password, confirmPassword });
};

export const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const compressImage = (file, quality, targetSize = null) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('quality', quality);
  if (targetSize) {
    formData.append('targetSize', targetSize);
  }
  return api.post('/compress/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const compressVideo = (file, targetSize, quality) => {
  const formData = new FormData();
  formData.append('video', file);
  if (targetSize) {
    formData.append('targetSize', targetSize);
  }
  formData.append('quality', quality);
  return api.post('/compress/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const convertFormat = (file, fromFormat, toFormat) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fromFormat', fromFormat);
  formData.append('toFormat', toFormat);
  return api.post('/compress/convert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const convertImageFormat = (file, toFormat) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('toFormat', toFormat);
  return api.post('/compress/convert-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;
