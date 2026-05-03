import api from './axios';

export const getTodayVocabulary = (difficulty) =>
  api.get('/vocabulary/today', { params: { difficulty } });

export const getFavourites  = ()     => api.get('/vocabulary/favourites');
export const addFavourite   = (data) => api.post('/vocabulary/favourites', data);
export const removeFavourite = (word) => api.delete(`/vocabulary/favourites/${word}`);