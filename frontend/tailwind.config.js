/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          navy: '#0B192C',
          dark: '#1E3E62',
          blue: '#1E88E5',
          lightBlue: '#E3F2FD',
          yellow: '#FFB800',
          yellowLight: '#FFF8E1',
          green: '#10B981',
          greenLight: '#ECFDF5',
          red: '#EF4444',
          redLight: '#FEF2F2',
          orange: '#F59E0B',
          orangeLight: '#FFFBEB',
          card: '#FFFFFF',
          bg: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

