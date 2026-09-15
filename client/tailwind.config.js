/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#08090B',
          secondary: '#101216',
          card: '#15181D',
          elevated: '#1B1F26',
        },
        border: {
          DEFAULT: '#292E36',
          subtle: '#1E2229',
        },
        text: {
          primary: '#F5F7FA',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        accent: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          subtle: '#6366F120',
        },
        success: {
          DEFAULT: '#22C55E',
          subtle: '#22C55E20',
        },
        warning: {
          DEFAULT: '#F59E0B',
          subtle: '#F59E0B20',
        },
        danger: {
          DEFAULT: '#EF4444',
          subtle: '#EF444420',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        elevated: '0 4px 16px rgba(0,0,0,0.5)',
        glow: '0 0 20px rgba(99,102,241,0.15)',
      },
    },
  },
  plugins: [],
}
