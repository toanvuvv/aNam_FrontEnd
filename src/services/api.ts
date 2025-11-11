import axios from 'axios';
import type { PrepareProductsDto, UpdateLiveSessionConfigDto, RealCartResult, ClearRealCartResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://anambackend-production.up.railway.app';

// Log để debug (chỉ trong development)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL);
  console.log('🔗 VITE_API_BASE_URL env:', import.meta.env.VITE_API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  prepareProducts: (id: string, data: PrepareProductsDto) => api.post(`/users/${id}/prepare-products`, data),
  clearRealCart: (id: string) => api.post<ClearRealCartResult>(`/users/${id}/clear-real-cart`),
  addToRealCart: (id: string) => api.post<RealCartResult>(`/users/${id}/add-to-real-cart`),
  checkLiveStatus: (id: string) => api.get<{ isLive: boolean; sessionId?: number; sessionTitle?: string }>(`/users/${id}/check-live-status`),
  checkCookies: (id: string) => api.post<{ status: 'valid' | 'invalid'; message: string; sessionCount: number }>(`/users/${id}/check-cookies`),
  getSessionList: (id: string) => api.get<{ sessions: Array<{ sessionId: number; title: string; duration: number; startTime?: number; atc?: number; confirmedOrders?: number; confirmedSales?: number }> }>(`/users/${id}/session-list`),
};

// Product Link API
export const productLinkApi = {
  getAll: (userId?: string) => api.get('/product-links', { params: { userId } }),
  getById: (id: string) => api.get(`/product-links/${id}`),
  create: (data: any) => api.post('/product-links', data),
  update: (id: string, data: any) => api.patch(`/product-links/${id}`, data),
  delete: (id: string) => api.delete(`/product-links/${id}`),
  assignToCart: (id: string, cartAssignment: string) => 
    api.post(`/product-links/${id}/assign-cart`, { cartAssignment }),
};

// Sample Product API
export const sampleProductApi = {
  getAll: (userId?: string) => api.get('/sample-products', { params: { userId } }),
  getById: (id: string) => api.get(`/sample-products/${id}`),
  create: (data: any) => api.post('/sample-products', data),
  update: (id: string, data: any) => api.patch(`/sample-products/${id}`, data),
  delete: (id: string) => api.delete(`/sample-products/${id}`),
};

// Live Session Config API
export const liveSessionConfigApi = {
  getByUserId: (userId: string) => api.get(`/live-session-configs/user/${userId}`),
  update: (userId: string, data: UpdateLiveSessionConfigDto) => api.patch(`/live-session-configs/user/${userId}`, data),
};

export default api;
