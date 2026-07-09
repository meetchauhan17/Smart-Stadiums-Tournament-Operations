/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary:   '#3B82F6',
        secondary: '#10B981',
        accent:    '#F59E0B',
        danger:    '#EF4444',
        muted:     '#F3F4F6',
      },
      borderRadius: {
        none: '0px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
