import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { TaskCard } from '../components/TaskCard';
import { type Task } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { type TaskFormData } from '../components/TaskForm';

import { ToastContainer, useToast } from '../components/Toast';

const STATUSES = ['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const;

export const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (filter !== 'ALL') params.status = filter;
      const { data } = await api.get('/tasks', { params });
      setTasks(data.data.tasks);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleCreate = async (form: TaskFormData) => {
    await api.post('/tasks', {
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    });
    toast.success('Task created!');
    fetchTasks();
  };

  const handleUpdate = async (form: TaskFormData) => {
    await api.put(`/tasks/${editTask!.id}`, {
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    });
    toast.success('Task updated!');
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const openEdit = (task: Task) => { setEditTask(task); setShowModal(true); };
  const openCreate = () => { setEditTask(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditTask(null); };

  // Stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'TODO').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    done: tasks.filter((t) => t.status === 'DONE').length,
  };

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="dashboard-header">
          <div>
            <h1>My Tasks {user?.role === 'ADMIN' && <span className="nav-badge" style={{ fontSize: '0.75rem' }}>ALL USERS</span>}</h1>
            <p style={{ marginTop: '0.25rem' }}>Welcome back, {user?.username} 👋</p>
          </div>
          <button id="btn-new-task" className="btn btn-primary" onClick={openCreate}>
            + New Task
          </button>
        </div>

        <div className="dashboard-stats">
          <div className="card stat-card stat-total">
            <p className="stat-label">Total</p>
            <p className="stat-value">{stats.total}</p>
          </div>
          <div className="card stat-card stat-todo">
            <p className="stat-label">To Do</p>
            <p className="stat-value">{stats.todo}</p>
          </div>
          <div className="card stat-card stat-progress">
            <p className="stat-label">In Progress</p>
            <p className="stat-value">{stats.inProgress}</p>
          </div>
          <div className="card stat-card stat-done">
            <p className="stat-label">Done</p>
            <p className="stat-value">{stats.done}</p>
          </div>
        </div>

        <div className="filters-bar">
          {STATUSES.map((s) => (
            <button
              key={s}
              id={`filter-${s.toLowerCase()}`}
              className={`filter-pill ${filter === s ? 'active' : ''}`}
              onClick={() => { setFilter(s); setPage(1); }}
            >
              {s === 'ALL' ? 'All Tasks' : s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No tasks yet</h3>
            <p>Create your first task to get started</p>
            <button id="btn-create-first" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>
              + Create Task
            </button>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
            <button className="page-btn active">{page}</button>
            <button className="page-btn" onClick={() => setPage((p) => p + 1)}>›</button>
          </div>
        )}
      </main>

      {showModal && (
        <TaskForm
          task={editTask}
          onSubmit={editTask ? handleUpdate : handleCreate}
          onClose={closeModal}
        />
      )}

      <ToastContainer toasts={toast.toasts} remove={toast.remove} />
    </>
  );
};
