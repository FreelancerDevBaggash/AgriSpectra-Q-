/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── AgriSpectra-Q Brand Palette ──────────────────────────────────────
        // Primary deep forest green
        primary: {
          50:  '#e8f4ef',
          100: '#c5e2d4',
          200: '#9ecfb6',
          300: '#6eba96',
          400: '#42a879',
          500: '#168A45',   // brand green
          600: '#0f7a3c',
          700: '#0a6431',
          800: '#063B2A',   // deep primary
          900: '#042819',
          950: '#021409',
        },
        // Spectral teal — tech / data layer
        teal: {
          50:  '#e0f5f4',
          100: '#b3e6e4',
          200: '#7ed4d2',
          300: '#45c0bc',
          400: '#1ab0ac',
          500: '#008F83',   // tech teal
          600: '#007a70',
          700: '#00635b',
          800: '#004d47',
          900: '#003733',
          950: '#001f1c',
        },
        // Accent lime green — CTA / highlights
        accent: {
          50:  '#f0fde7',
          100: '#dafab9',
          200: '#c0f587',
          300: '#9fee52',
          400: '#7de42a',
          500: '#63C72B',   // accent lime
          600: '#52a922',
          700: '#408b1a',
          800: '#2f6d12',
          900: '#1f500b',
          950: '#103305',
        },
        // Cyan — technical accents only
        cyan: {
          50:  '#e5fafe',
          100: '#b8f3fb',
          200: '#80eaf7',
          300: '#3dddf2',
          400: '#21C7D4',   // brand cyan
          500: '#14a8b4',
          600: '#0c8a95',
          700: '#086d76',
          800: '#055058',
          900: '#033439',
          950: '#011a1e',
        },
        // Gold — premium / warning accents only
        gold: {
          50:  '#fefce8',
          100: '#fef6c3',
          200: '#feec88',
          300: '#fddd49',
          400: '#F5B52E',   // brand gold
          500: '#e09c18',
          600: '#c07c0f',
          700: '#9a5d0c',
          800: '#7a4610',
          900: '#633810',
          950: '#3a1e06',
        },
        // Text / dark surfaces
        surface: {
          50:  '#F7FAF8',   // background
          100: '#edf2ef',
          200: '#d8e5de',
          300: '#b5ccbf',
          400: '#8aaa97',
          500: '#648d76',
          600: '#4d7060',
          700: '#3c5a4d',
          800: '#2a3f38',
          900: '#10252A',   // text dark
          950: '#091418',
        },
        // Pure white alias
        white: '#FFFFFF',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(22, 138, 69, 0.35)',
        'glow-teal':    '0 0 20px rgba(0, 143, 131, 0.35)',
        'glow-accent':  '0 0 20px rgba(99, 199, 43, 0.35)',
        'glow-cyan':    '0 0 20px rgba(33, 199, 212, 0.30)',
        'glow-gold':    '0 0 20px rgba(245, 181, 46, 0.30)',
        'card':         '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06)',
        'card-hover':   '0 4px 6px rgba(0,0,0,.07), 0 12px 32px rgba(0,0,0,.10)',
        'panel':        '0 0 0 1px rgba(6,59,42,.10), 0 8px 32px rgba(6,59,42,.10)',
        'hero':         '0 32px 64px rgba(6,59,42,.30)',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,.10)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':    'linear-gradient(135deg, #063B2A 0%, #0a6431 35%, #168A45 65%, #008F83 100%)',
        'gradient-hero':    'linear-gradient(135deg, #021409 0%, #063B2A 40%, #0a6431 70%, #168A45 100%)',
        'gradient-card':    'linear-gradient(135deg, rgba(255,255,255,.06) 0%, rgba(255,255,255,.02) 100%)',
        'gradient-teal':    'linear-gradient(135deg, #063B2A 0%, #008F83 100%)',
        'gradient-accent':  'linear-gradient(135deg, #168A45 0%, #63C72B 100%)',
        'dots-pattern':     'radial-gradient(circle, rgba(99,199,43,.08) 1px, transparent 1px)',
        'grid-pattern':     'linear-gradient(rgba(22,138,69,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(22,138,69,.04) 1px, transparent 1px)',
        'shimmer':          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,.05) 50%, transparent 100%)',
      },
      backgroundSize: {
        'dots': '24px 24px',
        'grid': '40px 40px',
      },
      animation: {
        'fade-in':      'fadeIn .5s ease-out both',
        'fade-up':      'fadeUp .6s ease-out both',
        'fade-up-sm':   'fadeUpSm .4s ease-out both',
        'slide-right':  'slideRight .5s ease-out both',
        'scale-in':     'scaleIn .3s ease-out both',
        'spin-slow':    'spin 3s linear infinite',
        'pulse-slow':   'pulse 3s cubic-bezier(.4,0,.6,1) infinite',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'progress-bar': 'progressBar 1.5s ease-in-out infinite',
        'orbit':        'orbit 8s linear infinite',
        'counter':      'counter .8s ease-out both',
        'border-flow':  'borderFlow 3s ease infinite',
      },
      keyframes: {
        fadeIn:      { '0%': { opacity: '0' },                                '100%': { opacity: '1' } },
        fadeUp:      { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeUpSm:    { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideRight:  { '0%': { opacity: '0', transform: 'translateX(-24px)' },'100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:     { '0%': { opacity: '0', transform: 'scale(.95)' },       '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseGlow:   { '0%,100%': { opacity: '1' },                           '50%':  { opacity: '.5' } },
        float:       { '0%,100%': { transform: 'translateY(0)' },             '50%':  { transform: 'translateY(-12px)' } },
        shimmer:     { '0%': { backgroundPosition: '-200% center' },          '100%': { backgroundPosition: '200% center' } },
        progressBar: { '0%': { transform: 'translateX(-100%) scaleX(.4)' }, '50%': { transform: 'translateX(0) scaleX(.8)' }, '100%': { transform: 'translateX(100%) scaleX(.4)' } },
        orbit:       { '0%': { transform: 'rotate(0deg) translateX(80px) rotate(0deg)' }, '100%': { transform: 'rotate(360deg) translateX(80px) rotate(-360deg)' } },
        borderFlow:  { '0%,100%': { borderColor: 'rgba(22,138,69,.3)' },      '50%':  { borderColor: 'rgba(22,138,69,.8)' } },
      },
      transitionTimingFunction: {
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':     'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
