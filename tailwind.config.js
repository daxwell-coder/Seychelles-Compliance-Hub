/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Seychelles Paradise Color Palette
        paradise: {
          cyan: '#06b6d4',
          blue: '#0ea5e9',
          purple: '#8b5cf6',
          green: '#10b981',
          ocean: '#0891b2',
          coral: '#f97316',
          sand: '#fbbf24',
        },
        // Glassmorphism Colors
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.2)',
          heavy: 'rgba(255, 255, 255, 0.3)',
          border: 'rgba(255, 255, 255, 0.2)',
        }
      },
      backgroundImage: {
        'paradise-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 25%, #8b5cf6 75%, #10b981 100%)',
        'ocean-gradient': 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #0ea5e9 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #f97316 0%, #fbbf24 50%, #06b6d4 100%)',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'float-medium': 'float-medium 4s ease-in-out infinite',
        'float-fast': 'float-fast 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        'float-medium': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(-3deg)' },
        },
        'float-fast': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-10px) rotate(1deg)' },
          '50%': { transform: 'translateY(-20px) rotate(0deg)' },
          '75%': { transform: 'translateY(-10px) rotate(-1deg)' },
        }
      },
      backdropBlur: {
        'xs': '2px',
        '4xl': '72px',
      },
      scale: {
        '102': '1.02',
      }
    },
  },
  plugins: [],
}
