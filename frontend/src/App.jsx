import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Equipements from "./pages/Equipements";
import Ordres from "./pages/Ordres";
import Planning from "./pages/Planning";
import Stock from "./pages/Stock";
import Alertes from "./pages/Alertes";
import Utilisateurs from "./pages/Utilisateurs";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public route */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/equipements" element={<Equipements />} />
        <Route path="/ordres" element={<Ordres />} />
        <Route
          path="/planning"
          element={
            <ProtectedRoute allowedRoles={["admin", "responsable", "technicien"]}>
              <Planning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoute allowedRoles={["admin", "responsable", "technicien"]}>
              <Stock />
            </ProtectedRoute>
          }
        />
        <Route path="/alertes" element={<Alertes />} />
        <Route
          path="/utilisateurs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Utilisateurs />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
