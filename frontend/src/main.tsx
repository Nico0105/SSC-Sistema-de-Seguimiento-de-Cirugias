// ======================================================
// Punto de entrada del frontend (main.tsx)
// Monta la aplicación React con:
//   - StrictMode (detección temprana de problemas)
//   - BrowserRouter (navegación SPA)
//   - AuthProvider (sesión disponible en toda la app)
// ======================================================
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./lib/auth-context";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
