// ======================================================
// Layout del panel interno (components/AppShell.tsx)
// Orquesta el Sidebar (components/layout/Sidebar.tsx) en dos
// formas:
//   - Desktop (md+): fijo a la izquierda, colapsable (ancho
//     persistido en localStorage vía useLocalStorage).
//   - Mobile: oculto por defecto; una topbar con botón de
//     menú lo abre como drawer superpuesto con animación
//     (framer-motion), y se cierra solo al navegar.
// El contenido de cada página se renderiza en el <Outlet />.
// ======================================================
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "./layout/Sidebar";
import { useLocalStorage } from "../hooks/use-local-storage";
import { cn } from "../lib/cn";

export default function AppShell() {
  const [collapsed, setCollapsed] = useLocalStorage("ssc_sidebar_collapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Cierra el drawer mobile automáticamente al cambiar de ruta.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-full flex bg-slate-50">
      {/* Sidebar de escritorio: fijo, colapsable */}
      <aside
        className={cn(
          "hidden md:block shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed(!collapsed)} />
      </aside>

      {/* Topbar + drawer de mobile */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg font-bold text-brand-700">SSC</span>
        </header>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl md:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.2 }}
              >
                <Sidebar />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
