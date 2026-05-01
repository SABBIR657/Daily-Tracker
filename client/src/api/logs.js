import api from './axios';

export const getLogs       = (params) => api.get('/logs', { params });
export const getLogById    = (id)     => api.get(`/logs/${id}`);
export const createLog     = (data)   => api.post('/logs', data);
export const updateLog     = (id, data) => api.put(`/logs/${id}`, data);
export const deleteLog     = (id)     => api.delete(`/logs/${id}`);
export const getAnalytics  = (period) => api.get('/logs/analytics', { params: { period } });