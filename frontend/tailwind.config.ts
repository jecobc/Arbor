import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#f4ecd8',
        parchmentDark: '#e8dcc0',
        ink: '#1c2b24',
        inkNavy: '#10161f',
        seal: '#8a4b12',
        sealDark: '#6b3a0d',
        forest: '#2f5233',
        hairline: '#c9bd9e',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        stamp: {
          '0%': { transform: 'scale(2.2) rotate(-14deg)', opacity: '0' },
          '55%': { transform: 'scale(0.92) rotate(-6deg)', opacity: '1' },
          '75%': { transform: 'scale(1.06) rotate(-8deg)' },
          '100%': { transform: 'scale(1) rotate(-6deg)', opacity: '1' },
        },
      },
      animation: {
        stamp: 'stamp 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) forwards',
      },
    },
  },
  plugins: [],
};
export default config;
