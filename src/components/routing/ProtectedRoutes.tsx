import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import { Session } from "@supabase/supabase-js";

interface ProtectedRoutesProps {
  session: Session | null;
}

const ProtectedRoutes = ({ session }: ProtectedRoutesProps) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            session ? (
              <Index />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />
        {/* Add a catch-all route that redirects to the appropriate page */}
        <Route
          path="*"
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default ProtectedRoutes;