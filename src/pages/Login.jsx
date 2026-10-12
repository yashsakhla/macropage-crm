import logo from '../assets/logo.png';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CheckCircle2, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/portal'} replace />;

  const pick = (r) => {
    setRole(r);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await login(role, email, password);
    setBusy(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className="login-wrap">
      <section className="login-hero">
        <div className="brand" style={{ padding: 0 }}>
          <img className="brand-img" src={logo} alt="Macropage" />
          <span>by MR Tech Solutions Pvt. Ltd.</span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1>
            One place for every <em>lead</em>, project and rupee.
          </h1>
          <ul>
            <li><CheckCircle2 size={18} color="#f26522" /> Lead pipeline from first enquiry to Deal Won</li>
            <li><CheckCircle2 size={18} color="#f26522" /> Auto-converts won deals into live projects</li>
            <li><CheckCircle2 size={18} color="#f26522" /> Project-wise revenue, expenses and profit</li>
            <li><CheckCircle2 size={18} color="#f26522" /> Client portal with progress & final approval</li>
          </ul>
        </div>
        <div className="small" style={{ color: '#8fa3c4', position: 'relative', zIndex: 1 }}>© MACROPAGE · info@macropage.in</div>
      </section>

      <section className="login-form-side">
        <form className="login-box" onSubmit={submit}>
          <h2>Welcome back</h2>
          <p className="muted" style={{ marginTop: 4 }}>Sign in to continue to your workspace.</p>

          <div className="role-switch">
            <button type="button" className={`role-opt ${role === 'admin' ? 'on' : ''}`} onClick={() => pick('admin')}>
              <Shield size={18} color="#f26522" />
              <b>Admin</b>
              <span>Leads, projects, finance</span>
            </button>
            <button type="button" className={`role-opt ${role === 'customer' ? 'on' : ''}`} onClick={() => pick('customer')}>
              <User size={18} color="#f26522" />
              <b>Customer</b>
              <span>Track your project</span>
            </button>
          </div>

          <div className="stack">
            {error && <div className="err">{error}</div>}
            <div className="field">
              <label>{role === 'customer' ? 'Phone number' : 'Email'}</label>
              <input
                className="input"
                key={role}
                type={role === 'customer' ? 'tel' : 'email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'customer' ? 'Number shared with Macropage' : undefined}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ padding: '11px 14px' }} disabled={busy}>
              {busy ? 'Signing in…' : `Sign in as ${role === 'admin' ? 'Admin' : 'Customer'}`}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
