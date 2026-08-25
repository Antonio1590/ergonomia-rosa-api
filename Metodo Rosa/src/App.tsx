// HashRouter: Apps Script sirve la app desde una única URL sin control de
// rutas del servidor, por lo que el enrutado debe vivir en el fragmento (#).
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./context/useAuth";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AutoEvaluationPage from "./pages/AutoEvaluationPage";


/* =========================================================
   RUTA PROTEGIDA
========================================================= */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF4FF]">
        <p className="text-gray-500 font-semibold">Cargando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}


/* =========================================================
   APP
========================================================= */

export default function App() {
  const { user } = useAuth();

  return (
    <HashRouter>
      <ErrorBoundary
        message="Ocurrió un error inesperado en ROSA Expert."
        onReset={() => window.location.reload()}
      >
        <Routes>

          <Route
            path="/login"
            element={
              user
                ? <Navigate to={user.rol === "admin" ? "/admin" : "/"} replace />
                : <Login />
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                {user?.rol === "admin"
                  ? <AdminDashboard />
                  : <Navigate to="/" replace />}
              </ProtectedRoute>
            }
          />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AutoEvaluationPage />
              </ProtectedRoute>
            }
          />

        </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}
