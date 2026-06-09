import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-logo">
          ⚡ TaskFlow
        </Link>

        <div className="navbar-links">
          <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className={isActive('/admin')}>
              Admin <span className="nav-badge">ADMIN</span>
            </Link>
          )}
        </div>

        <div className="navbar-user">
          <span className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="navbar-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.username}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role}</span>
            </span>
          </span>
          <button id="btn-logout" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};
