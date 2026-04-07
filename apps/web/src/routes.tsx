import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Auth
import { LoginPage } from './pages/auth/Login';
import { RegisterPage } from './pages/auth/Register';

// Setup
import { SetupPage } from './pages/setup/SetupPage';

// Dashboard & Layout
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Features
import { ManagersPage } from './pages/managers/ManagersPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AssignmentsPage } from './pages/assignments/AssignmentsPage';
import { TerritoriesPage } from './pages/territories/TerritoryPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPassword';
import { ResetPasswordPage } from './pages/auth/ResetPassword';

// Componente para proteger rotas
function PrivateRoute() {
    const token = localStorage.getItem('territorio-token');
    return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AppRoutes() {
    return (
        <Routes>
            {/* --- ROTAS PÚBLICAS --- */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* --- ROTAS PROTEGIDAS --- */}
            <Route element={<PrivateRoute />}>
                
                {/* Rota de Setup (Fora do Layout Principal, pois é um Wizard focado) */}
                <Route path="/setup" element={<SetupPage />} />

                {/* Aplicação Principal (Com Sidebar e Header) */}
                <Route element={<DashboardLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/territories" element={<TerritoriesPage />} />
                    <Route path="/managers" element={<ManagersPage />} />
                    <Route path="/assignments" element={<AssignmentsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>

            </Route>

            {/* Fallback 404 - Redireciona para Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}