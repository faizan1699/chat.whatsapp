/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'lora': ['Lora', 'serif'],
      },
      keyframes: {
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)', width: '30%' },
          '50%': { width: '50%' },
          '100%': { transform: 'translateX(250%)', width: '30%' },
        },
      },
      animation: {
        'progress-indeterminate': 'progress-indeterminate 2s infinite linear',
      },
    },
  },
  plugins: [],
}
