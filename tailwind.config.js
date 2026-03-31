/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        background: '#0d1117',
        surface: '#161b22',
        border: '#30363d',
        'border-subtle': '#21262d',
        accent: '#00b4ff',
        'accent-dim': '#0086bd',
        'accent-glow': 'rgba(0, 180, 255, 0.15)',
        // Text
        'text-primary': '#ffffff',
        'text-body': '#e6edf3',
        'text-muted': '#8b949e',
        'text-faint': '#484f58',
        // Status
        danger: '#f85149',
        warning: '#d29922',
        success: '#3fb950',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.75rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.05' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        88: '22rem',
        128: '32rem',
      },
      maxWidth: {
        '8xl': '90rem',
        '9xl': '100rem',
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 180, 255, 0.25)',
        'glow-sm': '0 0 10px rgba(0, 180, 255, 0.15)',
        card: '0 1px 3px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 180, 255, 0.3)',
      },
      backgroundImage: {
        'grid-pattern': `radial-gradient(circle at 1px 1px, rgba(0,180,255,0.08) 1px, transparent 0)`,
        'hero-gradient': 'linear-gradient(135deg, #0d1117 0%, #0d1117 60%, rgba(0,180,255,0.04) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #00b4ff 0%, #0086bd 100%)',
        'card-gradient': 'linear-gradient(135deg, #161b22 0%, #1a2030 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 180, 255, 0.15)' },
          '50%': { boxShadow: '0 0 24px rgba(0, 180, 255, 0.4)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#e6edf3',
            a: { color: '#00b4ff' },
            h1: { color: '#ffffff' },
            h2: { color: '#ffffff' },
            h3: { color: '#ffffff' },
            h4: { color: '#e6edf3' },
            code: { color: '#00b4ff', fontFamily: '"JetBrains Mono", monospace' },
            pre: { backgroundColor: '#161b22', border: '1px solid #30363d' },
            blockquote: { borderLeftColor: '#00b4ff', color: '#8b949e' },
          },
        },
      },
    },
  },
  plugins: [],
};
