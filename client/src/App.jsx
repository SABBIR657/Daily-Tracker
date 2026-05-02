import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import useAuthStore from "./stores/authStore";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Study from "./pages/Study";
import Physical from "./pages/Physical";
import Todos from "./pages/Todos";
import Subjects from "./pages/Subjects";
import PublicProfile from "./pages/PublicProfile";

const PrivateRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { token, logout } = useAuthStore();

  // Set auto-logout timer based on token expiry
  useEffect(() => {
    if (!token) return;

    try {
      const { exp } = jwtDecode(token);
      const expiresIn = exp * 1000 - Date.now(); // ms until expiry

      if (expiresIn <= 0) {
        logout();
        return;
      }

      // Set a timer to log out exactly when token expires
      const timer = setTimeout(() => {
        logout();
        window.location.href = "/login";
      }, expiresIn);

      return () => clearTimeout(timer); // cleanup on unmount
    } catch {
      logout();
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/u/:userId" element={<PublicProfile />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="study" element={<Study />} />
          <Route path="physical" element={<Physical />} />
          <Route path="todos" element={<Todos />} />
          <Route path="subjects" element={<Subjects />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
