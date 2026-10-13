/** @type {import('tailwindcss').Config} */
// Paleta de marca + tokens semánticos de MediQ's. Se usan como colores
// planos de Tailwind (sin CSS variables ni dark mode: fuera de alcance)
// para que toda la app use los mismos nombres en vez de "rose-600",
// "emerald-100", etc. sueltos en cada componente.
//
// Lenguaje visual "consola quirúrgica":
//   - navy  → identidad (títulos, botones primarios, navegación activa)
//   - brand → acento interactivo (links, códigos, foco)
//   - fuente mono para códigos de seguimiento, horarios e IDs
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef2fb",
          100: "#dbe4f5",
          200: "#b7c8eb",
          500: "#2b4a9e",
          600: "#1e3a8a",
          700: "#1a3278",
          800: "#152a66",
          900: "#0f1f4d",
        },
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
          200: "#a7f3d0",
          600: "#059669",
          700: "#047857",
        },
        // Estado de atención: preparación, recordatorios, incumplimientos.
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          600: "#d97706",
          700: "#b45309",
        },
        // Errores, retrasos y acciones destructivas.
        danger: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          600: "#e11d48",
          700: "#be123c",
        },
        // Información neutra (sala de espera, recuperación).
        info: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          600: "#7c3aed",
          700: "#6d28d9",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 31 77 / 0.04), 0 1px 3px 0 rgb(15 31 77 / 0.06)",
      },
    },
  },
  plugins: [],
};
