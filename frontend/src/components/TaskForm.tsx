import React, { useState, useEffect } from 'react';
import type { Task } from './TaskCard';

interface Props {
  task?:      Task | null;  // null = create mode
  onSubmit:   (data: TaskFormData) => Promise<void>;
  onClose:    () => void;
}

export interface TaskFormData {
  title:       string;
  description: string;
  status:      'TODO' | 'IN_PROGRESS' | 'DONE';
  priority:    'LOW' | 'MEDIUM' | 'HIGH';
  dueDate:     string;
}

export const TaskForm = ({ task, onSubmit, onClose }: Props) => {
  const [form, setForm]       = useState<TaskFormData>({
    title:       task?.title       ?? '',
    description: task?.description ?? '',
    status:      task?.status      ?? 'TODO',
    priority:    task?.priority    ?? 'MEDIUM',
    dueDate:     task?.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true); setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card modal">
        <div className="modal-header">
          <h3>{task ? 'Edit Task' : 'Create New Task'}</h3>
          <button className="modal-close" onClick={onClose} id="btn-modal-close">✕</button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Title *</label>
            <input
              id="task-title"
              name="title"
              className="form-input"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={handle}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              name="description"
              className="form-textarea"
              placeholder="Add more details..."
              value={form.description}
              onChange={handle}
            />
          </div>

          <div className="modal-form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="task-status">Status</label>
              <select id="task-status" name="status" className="form-select" value={form.status} onChange={handle}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">Priority</label>
              <select id="task-priority" name="priority" className="form-select" value={form.priority} onChange={handle}>
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="HIGH">🔴 High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-due">Due Date</label>
            <input
              id="task-due"
              name="dueDate"
              type="date"
              className="form-input"
              value={form.dueDate}
              onChange={handle}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" id="btn-cancel-task" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" id="btn-submit-task" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
