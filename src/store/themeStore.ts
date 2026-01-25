import { create } from 'zustand';

type Theme = 'dark';

type ThemeState = {
  theme: Theme;
};

export const useThemeStore = create<ThemeState>()(() => ({
  theme: 'dark',
}));
