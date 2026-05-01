import api from './axios';

export const getTodos      = (params) => api.get('/todos', { params });
export const createTodo    = (data)   => api.post('/todos', data);
export const updateTodo    = (id, data) => api.put(`/todos/${id}`, data);
export const deleteTodo    = (id)     => api.delete(`/todos/${id}`);
export const getTodoSummary = (period) => api.get('/todos/summary', { params: { period } });