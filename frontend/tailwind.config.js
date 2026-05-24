/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      animation: {
        'critical-flash': 'critical-flash 1.2s ease-in-out infinite',
        'soft-pulse':     'soft-pulse 2s ease-in-out infinite',
        'slide-in':       'slide-in 0.3s ease-out'
      },
      keyframes: {
        'critical-flash': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220,38,38,0.6)' },
          '50%':      { boxShadow: '0 0 40px 12px rgba(220,38,38,0.25)' }
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.55' }
        },
        'slide-in': {
          '0%':   { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
