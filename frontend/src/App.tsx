import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import "./styles/globals.css";

import CanchaPage from "./pages/CanchaPage";
import CanchasPage from "./pages/CanchasPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyAccountPage from "./pages/VerifyAccountPage";
import { UserManagement } from "./components/users/UserManagement";
import { ManagerAssistantLauncher } from "./components/ManagerAssistantLauncher";
import GestionMisCanchasPage from "./pages/GestionMisCanchasPage";
import GestionCanchaDetallePage from "./pages/GestionCanchaDetallePage";
import GestorDashboardPage from "./pages/GestorDashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify/:token" element={<VerifyAccountPage />} />

        <Route path="/canchas" element={<CanchasPage />} />

        <Route
          path="/canchas/:id"
          element={<CanchaPage />}
        />

        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/usuarios" element={<UserManagement />} />
        <Route path="/gestor/dashboard" element={<GestorDashboardPage />} />
        <Route path="/gestor/mis-canchas" element={<GestionMisCanchasPage />} />
        <Route path="/gestion/mis-canchas/:id" element={<GestionCanchaDetallePage />} />
        

      </Routes>
      <ManagerAssistantLauncher />
    </BrowserRouter>
  );
}
