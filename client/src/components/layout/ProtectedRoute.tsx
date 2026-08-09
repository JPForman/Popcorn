import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth();

  if (loading) return <p>Loading…</p>;
  if (!firebaseUser) return <Navigate to="/login" replace />;

  return <Outlet />;
}
