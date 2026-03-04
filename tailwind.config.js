/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0F172A",
          background: "#F9FAFB",
          card: "#FFFFFF",
          border: "#E5E7EB",
          emerald: "#22C55E",
          gold: "#C59D1F"
        }
      },
      borderRadius: {
        xl: "12px",
        '2xl': "16px"
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.05)"
      }
    }
  },
  plugins: []
};