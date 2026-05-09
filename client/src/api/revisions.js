import api from './axios';

export const getRevisions      = (params) => api.get('/revisions', { params });
export const getDueRevisions   = ()        => api.get('/revisions/due');
export const getRevisionStats  = ()        => api.get('/revisions/stats');
export const createRevision    = (data)    => api.post('/revisions', data);
export const markRevised       = (id, data) => api.post(`/revisions/${id}/revise`, data);
export const deleteRevision    = (id)      => api.delete(`/revisions/${id}`);