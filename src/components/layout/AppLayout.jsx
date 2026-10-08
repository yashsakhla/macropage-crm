import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, FolderKanban, LayoutDashboard, LogOut, Menu, MessagesSquare, Target, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { clientDiscussions } from '../../utils/metrics.js';
import { Avatar } from '../ui/index.jsx';

const NAV = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/leads', label: 'Lead Generation', icon: Target },
    { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { to: '/admin/finance', label: 'Finance', icon: Wallet },
  ],
  customer: [
    { to: '/portal', label: 'My Projects', icon: Briefcase, end: true },
    { to: '/portal/discussions', label: 'My Discussions', icon: MessagesSquare, count: true },
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data } = useData();
  const items = NAV[user.role];
  const current = [...items].sort((a, b) => b.to.length - a.to.length).find((i) => pathname.startsWith(i.to)) || items[0];
  const activeDiscussions =
    user.role === 'customer' ? clientDiscussions(data.leads, user.customerId).filter((l) => l.stage !== 'CANCELLED').length : 0;

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">M</div>
          <div>
            <b>MACROPAGE</b>
            <span>{user.role === 'admin' ? 'CRM · Admin' : 'Client Portal'}</span>
          </div>
        </div>
        <nav className="nav">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              <i.icon size={19} />
              {i.label}
              {i.count && activeDiscussions > 0 && <span className="nav-pill">{activeDiscussions}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          MR Tech Solutions Pvt. Ltd.
          <br />
          info@macropage.in
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>
          <h2>{current.label}</h2>
          <div className="grow" />
          <div className="row">
            <Avatar name={user.name} large />
            <div className="hide-sm" style={{ lineHeight: 1.2 }}>
              <div className="bold">{user.name}</div>
              <div className="small muted" style={{ textTransform: 'capitalize' }}>{user.role}</div>
            </div>
            <button className="btn btn-sm" onClick={doLogout}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
