import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { SectionsPage } from './pages/SectionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Workspace Routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="sections" element={<SectionsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </WorkspaceProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
