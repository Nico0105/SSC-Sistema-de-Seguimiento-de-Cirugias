// ======================================================
// Enrutador principal (App.tsx)
// Define el mapa de rutas de la SPA:
//   - /auth  → login (pública)
//   - /board → pantalla para familiares (pública, fullscreen)
//   - resto  → panel interno, protegido por ProtectedRoute
//              y envuelto en el layout AppShell (sidebar).
// ======================================================
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Surgeries from "./pages/Surgeries";
import SurgeryDetail from "./pages/SurgeryDetail";
import Appointments from "./pages/Appointments";
import Users from "./pages/Users";
import Board from "./pages/Board";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/board" element={<Board />} />

      {/* Panel interno: requiere sesión activa */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/surgeries" element={<Surgeries />} />
        <Route path="/surgeries/:id" element={<SurgeryDetail />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/users" element={<Users />} />
      </Route>

      {/* Cualquier ruta desconocida vuelve al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
