import { createSlice } from '@reduxjs/toolkit';

// Get initial theme from localStorage or default to 'light'
const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    
    // If no saved preference, check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false; // Default to light theme
};

const initialState = {
  darkMode: getInitialTheme(),
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleColorMode: (state) => {
      state.darkMode = !state.darkMode;
      // Save preference to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.darkMode ? 'dark' : 'light');
      }
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      // Save preference to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.darkMode ? 'dark' : 'light');
      }
    },
  },
});

export const { toggleColorMode, setDarkMode } = themeSlice.actions;

export default themeSlice.reducer; 