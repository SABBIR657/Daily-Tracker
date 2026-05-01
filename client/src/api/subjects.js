import api from './axios';

export const getSubjects    = ()           => api.get('/subjects');
export const createSubject  = (data)       => api.post('/subjects', data);
export const updateSubject  = (id, data)   => api.put(`/subjects/${id}`, data);
export const deleteSubject  = (id)         => api.delete(`/subjects/${id}`);
export const addTopic       = (id, data)   => api.post(`/subjects/${id}/topics`, data);
export const updateTopic    = (id, topicId, data) => api.put(`/subjects/${id}/topics/${topicId}`, data);
export const deleteTopic    = (id, topicId)       => api.delete(`/subjects/${id}/topics/${topicId}`);