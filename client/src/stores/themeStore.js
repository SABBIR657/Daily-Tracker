import { create } from 'zustand';

const useThemeStore = create((set) => ({
  dark: localStorage.getItem('theme') === 'dark',

  toggle: () =>
    set((state) => {
      const next = !state.dark;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { dark: next };
    }),

  init: () => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    if (isDark) document.documentElement.classList.add('dark');
    return { dark: isDark };
  },
}));

export default useThemeStore;