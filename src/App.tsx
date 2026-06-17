import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '@/pages/Login';
import ResearcherProjects from '@/pages/researcher/Projects';
import ResearcherProjectDetail from '@/pages/researcher/ProjectDetail';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminTeam from '@/pages/admin/Team';
import AdminTasks from '@/pages/admin/Tasks';
import AdminAlerts from '@/pages/admin/Alerts';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/researcher/projects"
          element={
            <ProtectedRoute role="researcher">
              <Layout>
                <ResearcherProjects />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/researcher/projects/:id"
          element={
            <ProtectedRoute role="researcher">
              <Layout>
                <ResearcherProjectDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/team"
          element={
            <ProtectedRoute role="admin">
              <Layout>
                <AdminTeam />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute role="admin">
              <Layout>
                <AdminTasks />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/alerts"
          element={
            <ProtectedRoute role="admin">
              <Layout>
                <AdminAlerts />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
