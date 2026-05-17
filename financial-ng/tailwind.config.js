/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C63FF',
          dim:     '#5A52D9',
        },
        success: '#22C55E',
        danger:  '#EF4444',
        warning: '#F59E0B',
        info:    '#3B82F6',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      borderRadius: {
        sm:   '6px',
        md:   '12px',
        lg:   '18px',
        xl:   '24px',
      },
    },
  },
  plugins: [],
};
