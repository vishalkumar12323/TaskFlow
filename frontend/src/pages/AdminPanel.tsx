import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Navbar } from '../components/Navbar';
import { ToastContainer, useToast } from '../components/Toast';

interface UserRow {
  id:        string;
  email:     string;
  username:  string;
  role:      'USER' | 'ADMIN';
  createdAt: string;
}

export const AdminPanel = () => {
  const toast                         = useToast();
  const [users,      setUsers]        = useState<UserRow[]>([]);
  const [loading,    setLoading]      = useState(true);
  const [updating,   setUpdating]     = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (user: UserRow) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Change ${user.username}'s role to ${newRole}?`)) return;
    setUpdating(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole });
      toast.success(`${user.username} is now ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="dashboard-header">
          <div>
            <h1>Admin Panel</h1>
            <p style={{ marginTop: '0.25rem' }}>Manage users and their roles</p>
          </div>
          <div className="card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="text-muted text-sm">Total Users:</span>
            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{users.length}</span>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">{u.username[0].toUpperCase()}</div>
                        <span className="font-semibold">{u.username}</span>
                      </div>
                    </td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-high' : 'badge-todo'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        id={`btn-role-${u.id}`}
                        className={`btn btn-sm ${u.role === 'ADMIN' ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => toggleRole(u)}
                        disabled={updating === u.id}
                      >
                        {updating === u.id ? '...' : u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <ToastContainer toasts={toast.toasts} remove={toast.remove} />
    </>
  );
};
