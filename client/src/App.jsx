import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

// Protects routes — redirects to /login if not authenticated
const PrivateRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
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
