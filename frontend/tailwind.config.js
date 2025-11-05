/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#008080',      // Deep teal
        secondary: '#2F4F4F',    // Slate gray
        accent: '#FFD700',       // Soft gold
        background: '#F5F5F5',   // Off-white
        error: '#FF6347',        // Soft red
        success: '#008080',      // Teal for success
        warning: '#FFD700',      // Gold for warnings
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}