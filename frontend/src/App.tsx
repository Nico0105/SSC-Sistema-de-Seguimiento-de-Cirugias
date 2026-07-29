// ======================================================
// Enrutador principal (App.tsx)
// Define el mapa de rutas de la SPA:
//   - /auth  → login (pública)
//   - /board → pantalla para familiares (pública, fullscreen)
//   - panel interno (staff)   → protegido por sesión + rol
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
import RoleRoute from "./components/RoleRoute";
import { useAuth } from "./lib/auth-context";
import { hasAnyRole, PATIENT_ROLES, STAFF_ROLES } from "./lib/permissions";

/** Redirige la raíz según el rol: paciente → portal, staff → dashboard. */
function HomeRedirect() {
  const { user } = useAuth();
  const home = hasAnyRole(user?.roles, PATIENT_ROLES) && !hasAnyRole(user?.roles, STAFF_ROLES)
    ? "/my-care"
    : "/dashboard";
  return <Navigate to={home} replace />;
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
        <Route path="/dashboard" element={<RoleRoute roles={STAFF_ROLES}><Dashboard /></RoleRoute>} />
        <Route path="/patients" element={<RoleRoute roles={STAFF_ROLES}><Patients /></RoleRoute>} />
        <Route path="/patients/:id/history" element={<RoleRoute roles={STAFF_ROLES}><PatientHistory /></RoleRoute>} />
        <Route path="/surgeries" element={<RoleRoute roles={STAFF_ROLES}><Surgeries /></RoleRoute>} />
        <Route path="/surgeries/:id" element={<RoleRoute roles={STAFF_ROLES}><SurgeryDetail /></RoleRoute>} />
        <Route path="/appointments" element={<RoleRoute roles={STAFF_ROLES}><Appointments /></RoleRoute>} />
        <Route path="/users" element={<RoleRoute roles={STAFF_ROLES}><Users /></RoleRoute>} />
        <Route path="/emails" element={<RoleRoute roles={STAFF_ROLES}><EmailLogs /></RoleRoute>} />

        {/* Portal del paciente */}
        <Route path="/my-care" element={<RoleRoute roles={PATIENT_ROLES}><MyCare /></RoleRoute>} />
      </Route>

      {/* Cualquier ruta desconocida vuelve al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
