import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import "./styles/globals.css";

import CanchaPage from "./pages/CanchaPage";
import CanchasPage from "./pages/CanchasPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import { UserManagement } from "./components/users/UserManagement";
import { ManagerAssistantLauncher } from "./components/ManagerAssistantLauncher";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/canchas" element={<CanchasPage />} />

        <Route
          path="/canchas/:id"
          element={<CanchaPage />}
        />

        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/usuarios" element={<UserManagement />} />
      </Routes>
      <ManagerAssistantLauncher />
    </BrowserRouter>
  );
}
