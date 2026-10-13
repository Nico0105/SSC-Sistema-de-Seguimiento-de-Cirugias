// ======================================================
// Enrutador principal (App.tsx)
// Define el mapa de rutas de la SPA:
//   - /auth  → login (pública)
//   - /board → pantalla para familiares (pública, sin cuenta)
//   - panel interno (staff)   → protegido por sesión + permiso
//   - /my-care (rol paciente) → portal de autogestión
// ======================================================
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import { Loading } from "./components/ui/spinner";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute, { homePathFor } from "./components/RoleRoute";
import { useAuth } from "./lib/auth-context";

// Carga diferida por ruta: cada pantalla es un chunk propio, así la pantalla
// pública y el login no descargan el código de todo el panel interno.
const AuthPage = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Patients = lazy(() => import("./pages/Patients"));
const PatientHistory = lazy(() => import("./pages/PatientHistory"));
const Surgeries = lazy(() => import("./pages/Surgeries"));
const SurgeryDetail = lazy(() => import("./pages/SurgeryDetail"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Users = lazy(() => import("./pages/Users"));
const EmailLogs = lazy(() => import("./pages/EmailLogs"));
const MyCare = lazy(() => import("./pages/MyCare"));
const Board = lazy(() => import("./pages/Board"));

/** Redirige la raíz según el rol: paciente → portal, staff → dashboard. */
function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homePathFor(user?.roles)} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/board" element={<Board />} />

        {/* Panel autenticado (encabezado con navegación por pestañas) */}
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
    </Suspense>
  );
}
