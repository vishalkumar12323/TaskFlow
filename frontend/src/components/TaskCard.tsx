

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  userId: string;
  createdAt: string;
}

const statusLabel: Record<Task['status'], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const statusClass: Record<Task['status'], string> = {
  TODO: 'badge-todo',
  IN_PROGRESS: 'badge-in-progress',
  DONE: 'badge-done',
};

const priorityClass: Record<Task['priority'], string> = {
  LOW: 'badge-low',
  MEDIUM: 'badge-medium',
  HIGH: 'badge-high',
};

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard = ({ task, onEdit, onDelete }: Props) => {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = due && due < new Date() && task.status !== 'DONE';

  return (
    <div className="card task-card">
      <div className="task-card-header">
        <p className="task-title">{task.title}</p>
        <span className={`badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        <span className={`badge ${priorityClass[task.priority]}`}>
          {task.priority === 'HIGH' ? '🔴' : task.priority === 'MEDIUM' ? '🟡' : '🟢'} {task.priority}
        </span>
        {due && (
          <span className={`badge ${isOverdue ? 'badge-high' : 'badge-todo'}`}>
            📅 {due.toLocaleDateString()}
            {isOverdue && ' • Overdue'}
          </span>
        )}
      </div>

      <div className="task-actions">
        <button
          id={`btn-edit-${task.id}`}
          className="btn btn-secondary btn-sm"
          onClick={() => onEdit(task)}
        >
          ✏️ Edit
        </button>
        <button
          id={`btn-delete-${task.id}`}
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(task.id)}
        >
          🗑️ Delete
        </button>
        <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
