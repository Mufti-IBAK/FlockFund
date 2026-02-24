import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#19382d',
        accent: '#E6B450',
        'background-light': '#F9F6F0',
        'background-dark': '#151d1a',
        charcoal: '#1E1E1E',
        'teal-accent': '#2dd4bf',
        'coral-accent': '#fb7185',
        'border-color': '#E5E7EB',
        surface: '#FFFFFF',
      },
      fontFamily: {
        display: ["'DM Sans'", 'sans-serif'],
        heading: ["'Outfit'", 'sans-serif'],
        serif: ["'Playfair Display'", 'serif'],
        mono: ["'Space Mono'", 'monospace'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;
