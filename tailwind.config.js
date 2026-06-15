module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/shadcn/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Archivum Colors
        oxfordBlue : '#2C3E6B' ,
        deepSpaceBlue : '#1F2B4B' ,
        velvetWine : '#9B4455' ,
        eerieBlack : '#2E2A2B' ,
        antiFlashWhite : '#F0ECEC' ,
        snow : '#FAF8F8' ,
        oldGold : '#C5A84B' ,
        deepSeaGreen : '#49766C' ,
        frenchRose : '#F06880' ,
        malachite : '#5ED86D' ,
        malachiteDark: '#4CBD5C',
        /** Between legacy crimsonRed (#EC1E24) and velvetWine (#9B4455) — UI accent red */
        archivumRed: '#C23A46',

        // Student Research Portal Original Colors (legacy — prefer Archivum tokens above)
        ivory: '#FEFBF5',
        darkSlateBlue: '#19374C',
        crimsonRed: '#EC1E24', // notification badge only
        lightGray: '#D5D5D5',
        skyBlue: '#A1C1D9',
        mutedGreen: '#76D474',
        
        // Extended Academic Palette
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#f4f5f9',
          100: '#e8ebf2',
          200: '#d1d8e5',
          300: '#a3b0c9',
          400: '#6b7fa3',
          500: '#2C3E6B', // oxfordBlue
          600: '#243456',
          700: '#1F2B4B', // deepSpaceBlue
          800: '#182238',
          900: '#111827',
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
          50: '#f2f7f6',
          100: '#e0ebe8',
          200: '#c2d7d2',
          300: '#94b5ad',
          400: '#6b9489',
          500: '#49766C', // deepSeaGreen
          600: '#3d635b',
          700: '#32504a',
          800: '#273d39',
          900: '#1c2a28',
        },
        error: {
          50: '#fdf4f5',
          100: '#f9e4e7',
          200: '#f2c8cd',
          300: '#e5a0a9',
          400: '#d46b78',
          500: '#C23A46', // archivumRed
          600: '#ad3340',
          700: '#922b36',
          800: '#77232d',
          900: '#5c1b23',
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
        coordinator: {
          navy: '#2C3E6B',
          rose: '#9B4455',
          ink: '#2E2A2B',
          cream: '#F0ECEC',
        },
        neutral: {
          50: '#FAF8F8', // snow
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
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-dm-serif-text)', 'Georgia', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'md': ['0.9375rem', { lineHeight: '1.375rem' }],
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
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        md: '0 4px 10px -1px rgba(0, 0, 0, 0.12), 0 2px 6px -2px rgba(0, 0, 0, 0.08)',
        lg: '0 10px 22px -3px rgba(0, 0, 0, 0.14), 0 4px 10px -4px rgba(0, 0, 0, 0.08)',
        'soft': '0 2px 15px rgba(0, 0, 0, 0.11)',
        'medium': '0 4px 25px rgba(0, 0, 0, 0.15)',
        'hard': '0 10px 40px rgba(0, 0, 0, 0.19)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
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
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
