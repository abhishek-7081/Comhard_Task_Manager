/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0F7F3',
          100: '#DFEFE7',
          200: '#BEDECF',
          500: '#3D9A72',
          600: '#2E7D5B', // Primary Green
          700: '#246549',
          800: '#1D503A',
        },
        ocean: {
          50: '#F0F5FA',
          100: '#DFECF6',
          200: '#BED9ED',
          500: '#4F8DDC',
          600: '#3977C3', // Primary Blue
          700: '#2E61A1',
          800: '#244D80',
        },
        earth: {
          50: '#F9F6F4',
          100: '#F2ECE7',
          200: '#E4D8CF',
          500: '#A67D5B',
          600: '#8B6548', // Warm Brown
          700: '#715139',
          800: '#583F2C',
        },
        canvas: '#F5F7F5', // Light background
        ink: {
          main: '#24312B', // Main text
          muted: '#718078', // Muted text
          subtle: '#9EAEA5',
        },
        edge: '#E1E8E2', // Border
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
