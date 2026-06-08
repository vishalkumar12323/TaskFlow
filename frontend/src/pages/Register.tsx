import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form,    setForm]    = useState({ email: '', username: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      await register(form.email, form.username, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      const details = err.response?.data?.details;
      if (details) {
        const msgs = Object.values(details).flat() as string[];
        setError(msgs[0] || 'Registration failed');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="logo">⚡</div>
          <h1>Create account</h1>
          <p>Start managing your tasks with TaskFlow</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              name="username"
              type="text"
              className="form-input"
              placeholder="johndoe"
              value={form.username}
              onChange={handle}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handle}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              name="confirm"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.confirm}
              onChange={handle}
              required
            />
          </div>

          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <button id="btn-register" type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
