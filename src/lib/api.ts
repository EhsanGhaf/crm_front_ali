// src/lib/api.ts
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      
      // 🌟 مسیر تایید دو مرحله‌ای هم اضافه شد تا توکن‌های خرابِ قبلی باعث قطعی نشوند 🌟
      const isAuthRoute = 
        config.url?.includes('/login/') || 
        config.url?.includes('/register/') || 
        config.url?.includes('/verify-2fa/');
      
      if (token && !isAuthRoute) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      
      // 🌟 در اینجا هم مسیر 2FA را استثنا می‌کنیم تا کاربر را بیرون نیندازد 🌟
      const isAuthRequest = 
        error.config.url.includes('/login/') || 
        error.config.url.includes('/verify-2fa/');

      if (!isAuthRequest) {
        toast.error("نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.");
        
        if (typeof window !== 'undefined') {
          if (window.location.pathname !== '/') {
            localStorage.removeItem('access_token');
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }
        }
      }
    }
    return Promise.reject(error);
  }
);