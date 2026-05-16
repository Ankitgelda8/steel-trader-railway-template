/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#E8F0F8',
          100: '#C5D8ED',
          200: '#9ABFE0',
          300: '#6FA5D2',
          400: '#4492C7',
          500: '#2471A3',
          600: '#1A5276',   // primary
          700: '#154469',
          800: '#10375C',
          900: '#0B2940',
        },
        copper: {
          50:  '#FEF3E2',
          100: '#FDDCB0',
          200: '#FCC47A',
          300: '#FBAB43',
          400: '#F99721',
          500: '#D4820A',
          600: '#B45309',   // accent
          700: '#8C3D07',
          800: '#662A05',
          900: '#3F1803',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
