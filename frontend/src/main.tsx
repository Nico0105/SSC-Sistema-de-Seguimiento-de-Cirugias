// ======================================================
// Punto de entrada del frontend (main.tsx)
// Monta la aplicación React con:
//   - StrictMode (detección temprana de problemas)
//   - BrowserRouter (navegación SPA)
//   - QueryClientProvider (TanStack Query: caché de datos del servidor,
//     reemplaza el fetch-on-mount manual que tenía cada página)
//   - TooltipProvider (Radix): habilita <Tooltip> en toda la app
//   - AuthProvider (sesión disponible en toda la app)
//   - <Toaster /> (sonner): feedback de mutaciones (crear/editar/eliminar)
// ======================================================
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App";
import { AuthProvider } from "./lib/auth-context";
import { queryClient } from "./lib/query-client";
import { TooltipProvider } from "./components/ui/tooltip";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
