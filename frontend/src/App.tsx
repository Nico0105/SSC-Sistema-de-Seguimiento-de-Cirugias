// ======================================================
// Enrutador principal (App.tsx)
// Define el mapa de rutas de la SPA:
//   - /auth  → login (pública)
//   - /board → pantalla para familiares (pública, sin cuenta)
//   - panel interno (staff)   → protegido por sesión + permiso
//   - /my-care (rol paciente) → portal de autogestión
// ======================================================
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientHistory from "./pages/PatientHistory";
import Surgeries from "./pages/Surgeries";
import SurgeryDetail from "./pages/SurgeryDetail";
import Appointments from "./pages/Appointments";
import Users from "./pages/Users";
import EmailLogs from "./pages/EmailLogs";
import MyCare from "./pages/MyCare";
import Board from "./pages/Board";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute, { homePathFor } from "./components/RoleRoute";
import { useAuth } from "./lib/auth-context";

/** Redirige la raíz según el rol: paciente → portal, staff → dashboard. */
function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homePathFor(user?.roles)} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/board" element={<Board />} />

      {/* Panel autenticado (layout con sidebar) */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />

        {/* Pantallas del staff */}
        <Route path="/dashboard" element={<RoleRoute permission="panel:ver"><Dashboard /></RoleRoute>} />
        <Route path="/patients" element={<RoleRoute permission="panel:ver"><Patients /></RoleRoute>} />
        <Route path="/patients/:id/history" element={<RoleRoute permission="clinica:ver"><PatientHistory /></RoleRoute>} />
        <Route path="/surgeries" element={<RoleRoute permission="panel:ver"><Surgeries /></RoleRoute>} />
        <Route path="/surgeries/:id" element={<RoleRoute permission="panel:ver"><SurgeryDetail /></RoleRoute>} />
        <Route path="/appointments" element={<RoleRoute permission="panel:ver"><Appointments /></RoleRoute>} />
        <Route path="/users" element={<RoleRoute permission="usuarios:gestionar"><Users /></RoleRoute>} />
        <Route path="/emails" element={<RoleRoute permission="emails:ver"><EmailLogs /></RoleRoute>} />

        {/* Portal del paciente */}
        <Route path="/my-care" element={<RoleRoute permission="portal:paciente"><MyCare /></RoleRoute>} />
      </Route>

      {/* Cualquier ruta desconocida vuelve al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
