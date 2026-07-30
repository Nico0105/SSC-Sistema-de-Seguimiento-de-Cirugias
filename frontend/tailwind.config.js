/** @type {import('tailwindcss').Config} */
// Paleta de marca + tokens semánticos del SSC. Se usan como colores
// planos de Tailwind (sin CSS variables ni dark mode: fuera de alcance)
// para que toda la app use los mismos nombres en vez de "rose-600",
// "emerald-100", etc. sueltos en cada componente.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        // Estado positivo: altas, checklist completo, confirmaciones.
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          600: "#059669",
          700: "#047857",
        },
        // Estado de atención: incumplimientos, recordatorios.
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          600: "#d97706",
          700: "#b45309",
        },
        // Errores y acciones destructivas.
        danger: {
          50: "#fff1f2",
          100: "#ffe4e6",
          600: "#e11d48",
          700: "#be123c",
        },
        // Información neutra (en curso, recuperación).
        info: {
          50: "#eef2ff",
          100: "#e0e7ff",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
