/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{js,jsx}', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-secondary': 'var(--surface-secondary)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-foreground': 'var(--primary-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        destructive: 'var(--destructive)',
        ink: 'var(--primary)',
        cyan: {
          DEFAULT: 'var(--primary)',
          100: 'var(--primary-soft)',
          200: 'var(--primary-border)',
          500: 'var(--primary)',
          600: 'var(--primary)',
          700: 'var(--primary-hover)',
        },
        canvas: 'var(--background)',
        panel: 'var(--surface-secondary)',
        hair: 'var(--border)',
        tint: {
          blue: 'var(--primary-soft)',
          cyan: 'var(--primary-soft)',
          amber: 'var(--accent-soft)',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        head: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
}
