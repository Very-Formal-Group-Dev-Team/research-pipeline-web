module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Palette
        ivory: '#FEFBF5',
        darkSlateBlue: '#19374C',
        crimsonRed: '#EC1E24',
        lightGray: '#D5D5D5',
        skyBlue: '#A1C1D9',
        mutedGreen: '#76D474',
        
        // Extended Academic Palette
        primary: {
          50: '#f0f4f8',
          100: '#d9e6f2',
          200: '#b3cce5',
          300: '#8db3d8',
          400: '#6799cb',
          500: '#19374C', // darkSlateBlue
          600: '#142c3d',
          700: '#0f212e',
          800: '#0a161f',
          900: '#050b0f',
        },
        accent: {
          50: '#f5f9fc',
          100: '#e8f2f9',
          200: '#d1e5f3',
          300: '#A1C1D9', // skyBlue
          400: '#7aa8c9',
          500: '#538fb9',
          600: '#437394',
          700: '#32566f',
          800: '#223a4a',
          900: '#111d25',
        },
        success: {
          50: '#f2fbf2',
          100: '#e5f7e5',
          200: '#cbefcb',
          300: '#b1e7b1',
          400: '#94df93',
          500: '#76D474', // mutedGreen
          600: '#5eba5c',
          700: '#47a045',
          800: '#2f862e',
          900: '#186c17',
        },
        error: {
          50: '#fef2f2',
          100: '#fee5e5',
          200: '#fdcbcb',
          300: '#fca5a5',
          400: '#fb7575',
          500: '#EC1E24', // crimsonRed
          600: '#dc1a20',
          700: '#b8161b',
          800: '#941216',
          900: '#700e11',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        neutral: {
          50: '#FEFBF5', // ivory
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#D5D5D5', // lightGray
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 25px rgba(0, 0, 0, 0.12)',
        'hard': '0 10px 40px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
