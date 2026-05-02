import { create } from 'zustand';
import { isTokenExpired } from '../utils/tokenUtils';

// Check token validity on store init
const getInitialState = () => {
  const token = localStorage.getItem('token');
  const user  = localStorage.getItem('user');

  if (!token || isTokenExpired(token)) {
    // Clear stale data immediately
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { user: null, token: null };
  }

  return {
    user:  user ? JSON.parse(user) : null,
    token,
  };
};

const useAuthStore = create((set) => ({
  ...getInitialState(),

  setAuth: (user, token) => {
    localStorage.setItem('user',  JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;