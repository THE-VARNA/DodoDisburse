/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        emerald: { 400: '#34d399', 500: '#10b981' },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.07)',
          border: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.1)',
        },
      },
      backgroundImage: {
        'mesh-glow':
          'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.05) 0%, transparent 50%)',
      },
      boxShadow: {
        glass: '0 0 0 1px rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.4)',
        glow: '0 0 32px rgba(99,102,241,0.25)',
        'glow-sm': '0 0 16px rgba(99,102,241,0.15)',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
