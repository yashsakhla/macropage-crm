import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Leads from './pages/admin/Leads.jsx';
import Projects from './pages/admin/Projects.jsx';
import ProjectDetails from './pages/admin/ProjectDetails.jsx';
import InternalProjectDetails from './pages/admin/InternalProjectDetails.jsx';
import Finance from './pages/admin/Finance.jsx';
import Hustlers from './pages/admin/Hustlers.jsx';
import PortalHome from './pages/customer/PortalHome.jsx';
import PortalProject from './pages/customer/PortalProject.jsx';
import PortalDiscussions from './pages/customer/PortalDiscussions.jsx';
import PortalDiscussion from './pages/customer/PortalDiscussion.jsx';

const homeFor = (user) => (user?.role === 'admin' ? '/admin/dashboard' : '/portal');

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homeFor(user) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="internal-projects/:id" element={<InternalProjectDetails />} />
        <Route path="finance" element={<Finance />} />
        <Route path="hustlers" element={<Hustlers />} />
      </Route>

      <Route
        path="/portal"
        element={
          <Protected role="customer">
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<PortalHome />} />
        <Route path="projects/:id" element={<PortalProject />} />
        <Route path="discussions" element={<PortalDiscussions />} />
        <Route path="discussions/:id" element={<PortalDiscussion />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
