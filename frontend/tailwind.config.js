/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6B4A6B',
          hover: '#593B59',
          soft: '#F1EAF1',
        },
        page: {
          bg: '#F6F5F7',
        },
        card: {
          bg: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E3DFE5',
        },
        text: {
          DEFAULT: '#1F1A21',
          muted: '#6D6572',
        },
        sidebar: {
          bg: '#2E2330',
          text: '#D9CFDA',
          active: '#6B4A6B',
        },
        status: {
          success: '#1E8E5A',
          warning: '#B7791F',
          danger: '#C0392B',
          info: '#2B6CB0',
          neutral: '#6D6572',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        card: '8px',
        bento: '16px',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
      },
    },
  },
  plugins: [],
}
