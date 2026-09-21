/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A1B26',        // buttons, deadline banner, headings
        cyan: {
          DEFAULT: '#13B8D4',
          100: '#D6F2F8',
          200: '#B4E7F1',
          500: '#13B8D4',
          600: '#0E9BB8',
          700: '#0B7E96',
        },
        canvas: '#F0F6FF',     // page + panel background
        panel: '#F8FAFC',      // login right panel
        hair: '#E4EDF8',       // card borders
        tint: {
          blue: '#DCE9F5',     // lecture sessions
          cyan: '#C7EDF5',     // active lab session
          amber: '#FBE4C6',    // workshops
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        head: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 40, 72, 0.04), 0 8px 24px -12px rgba(16, 40, 72, 0.12)',
      },
    },
  },
  plugins: [],
}
