import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { useSocket } from '../../hooks/useSocket';
import * as taskService from '../../services/taskService';
import { useAppSelector } from '../../store/hooks';
import type { Task, TaskHistory, TaskStatus } from '../../types/task.types';

const statusVariant: Record<TaskStatus, 'blue' | 'amber' | 'green' | 'red' | 'gray'> = {
  PENDING: 'blue',
  IN_PROGRESS: 'amber',
  COMPLETED: 'green',
  DELAYED: 'red',
  ESCALATED: 'gray'
};

const priorityVariant = {
  HIGH: 'red',
  MEDIUM: 'amber',
  LOW: 'green'
} as const;

const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getStatusNodeColor = (status: TaskStatus) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-[#2E9B67]';
    case 'DELAYED':
      return 'bg-[#D64545]';
    case 'IN_PROGRESS':
      return 'bg-[#D89B17]';
    case 'PENDING':
      return 'bg-[#185FA5]';
    default:
      return 'bg-[#7B879C]';
  }
};

function TimelineItem({ entry, isLast }: { entry: TaskHistory; isLast: boolean }) {
  const oldLabel = entry.old_status ? formatLabel(entry.old_status) : 'Created';
  const newLabel = formatLabel(entry.new_status);

  return (
    <div className="relative flex gap-4">
      <div className="relative flex w-6 justify-center">
        {!isLast ? <div className="absolute top-3 h-full w-px bg-[#EFF2F6]" /> : null}
        <span
          className={[
            'relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm',
            getStatusNodeColor(entry.new_status)
          ].join(' ')}
        />
      </div>

      <div className="flex-1 rounded-[16px] border border-[#EFF2F6] bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={entry.old_status ? statusVariant[entry.old_status] : 'gray'}>
            {oldLabel}
          </Badge>
          <span className="text-sm text-[#8A99B0]">to</span>
          <Badge variant={statusVariant[entry.new_status]}>{newLabel}</Badge>
        </div>
        <p className="mt-3 text-sm font-medium text-[#1E293B]">
          {entry.updatedBy?.name ?? entry.updatedByName ?? 'System'}
        </p>
        {entry.comment ? <p className="mt-2 text-sm leading-6 text-[#36506C]">{entry.comment}</p> : null}
        <p className="mt-3 text-xs text-[#8A99B0]">{formatTimestamp(entry.updated_at)}</p>
      </div>
    </div>
  );
}

function StatusChangeModal({
  task,
  onClose,
  onConfirm
}: {
  task: Task;
  onClose: () => void;
  onConfirm: (newStatus: TaskStatus, proof?: File) => Promise<void>;
}) {
  const [newStatus, setNewStatus] = useState<TaskStatus>(task.status);
  const [proof, setProof] = useState<File | undefined>();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const needsProof = newStatus === 'COMPLETED';

  const handleConfirm = async () => {
    if (needsProof && !proof) {
      setErr('Please upload task proof before marking as Completed.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(newStatus, proof);
      onClose();
    } catch {
      setErr('Failed to update status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Change Task Status">
      <p className="text-xs text-[#8A99B0] truncate mb-4">{task.title}</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-[#36506C]">New Status</span>
        <select
          className="min-h-[38px] rounded-[10px] border-[0.5px] border-[#DCE2EA] bg-[#F8F9FC] px-3 text-sm text-[#1E293B] outline-none focus:border-[#185FA5]"
          onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
          value={newStatus}
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="DELAYED">Delayed</option>
        </select>
      </label>
      {needsProof && (
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-[#36506C]">
            Proof of Completion <span className="text-[#D64545]">*</span>
          </span>
          <input
            accept="image/*,application/pdf"
            className="text-sm text-[#36506C]"
            onChange={(e) => setProof(e.target.files?.[0])}
            type="file"
          />
        </label>
      )}
      {err && <p className="mt-3 text-xs text-[#D64545]">{err}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose} variant="ghost">Cancel</Button>
        <Button loading={saving} onClick={() => void handleConfirm()}>Save</Button>
      </div>
    </Modal>
  );
}

function TaskDetailContent() {
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [showStatusModal, setShowStatusModal] = useState(false);

  const taskQuery = useQuery({
    queryKey: ['task-detail', id],
    queryFn: () => taskService.getTaskById(Number(id)),
    enabled: Boolean(id)
  });

  const task = taskQuery.data;

  const handleStatusChange = async (newStatus: TaskStatus, proof?: File) => {
    if (!task) return;
    await taskService.updateTaskStatus(task.id, newStatus, proof);
    await queryClient.invalidateQueries({ queryKey: ['task-detail', id] });
    toast.success('Task status updated.');
  };

  const attachmentUrl = useMemo(() => {
    if (!task?.attachment_path) {
      return null;
    }
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
    const baseUrl = apiBase.replace(/\/api\/?$/, '');
    return `${baseUrl}/${task.attachment_path.replace(/^\/+/, '')}`;
  }, [task?.attachment_path]);

  const proofUrl = useMemo(() => {
    if (!task?.proof_path) {
      return null;
    }
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
    const baseUrl = apiBase.replace(/\/api\/?$/, '');
    return `${baseUrl}/${task.proof_path.replace(/^\/+/, '')}`;
  }, [task?.proof_path]);

  const fallbackPath =
    user?.role === 'CHAIRMAN'
      ? '/chairman/task-monitor'
      : user?.role === 'DIRECTOR'
        ? '/director'
        : '/department/my-tasks';

  if (taskQuery.isLoading) {
    return <Loader />;
  }

  if (taskQuery.isError || !task) {
    return (
      <section className="p-5">
        <div className="rounded-[20px] border border-[#EFF2F6] bg-white p-6">
          <p className="text-lg font-semibold text-[#1E293B]">Task not found</p>
          <p className="mt-2 text-sm text-[#5B6E8C]">
            The requested task could not be loaded right now.
          </p>
          <Link className="mt-4 inline-flex text-sm font-semibold text-[#185FA5]" to={fallbackPath}>
            Back to tasks
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5 p-5">
      <div className="rounded-[20px] border border-[#EFF2F6] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[18px] font-medium text-[#1E293B]">{task.title}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={priorityVariant[task.priority]}>
                {formatLabel(task.priority)} Priority
              </Badge>
              <Badge variant={statusVariant[task.status]}>{formatLabel(task.status)}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setShowStatusModal(true)} variant="ghost">
              Change Status
            </Button>
            <Link className="text-sm font-semibold text-[#185FA5]" to={fallbackPath}>
              Back to tasks
            </Link>
          </div>
        </div>

        {showStatusModal && task && (
          <StatusChangeModal
            onClose={() => setShowStatusModal(false)}
            onConfirm={handleStatusChange}
            task={task}
          />
        )}

        <div className="mt-6 grid gap-4 rounded-[16px] bg-[#F8F9FC] p-4 text-sm sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A99B0]">Assigned to</p>
            <p className="mt-1 font-medium text-[#1E293B]">
              {task.assignedTo?.name ?? task.assignedToName ?? '--'}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A99B0]">Department</p>
            <p className="mt-1 font-medium text-[#1E293B]">
              {task.department?.name ?? task.departmentName ?? '--'}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A99B0]">Due date</p>
            <p className="mt-1 font-medium text-[#1E293B]">{formatTimestamp(task.due_date)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A99B0]">Assign date</p>
            <p className="mt-1 font-medium text-[#1E293B]">{formatTimestamp(task.start_date)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A99B0]">Attachment</p>
            {attachmentUrl ? (
              <a
                className="mt-1 inline-flex font-medium text-[#185FA5]"
                href={attachmentUrl}
                rel="noreferrer"
                target="_blank"
              >
                Download brief
              </a>
            ) : (
              <p className="mt-1 font-medium text-[#1E293B]">No attachment</p>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A99B0]">Completion proof</p>
            {proofUrl ? (
              <a
                className="mt-1 inline-flex font-medium text-[#185FA5]"
                href={proofUrl}
                rel="noreferrer"
                target="_blank"
              >
                Download proof
              </a>
            ) : task.status === 'COMPLETED' ? (
              <p className="mt-1 text-sm font-medium text-[#D64545]">No proof uploaded</p>
            ) : (
              <p className="mt-1 font-medium text-[#1E293B]">--</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#EFF2F6] bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#185FA5]">
              Task History
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#1E293B]">Timeline</h2>
          </div>
          <p className="text-sm text-[#8A99B0]">
            {task.history?.length ?? 0} update{(task.history?.length ?? 0) === 1 ? '' : 's'}
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {task.history?.length ? (
            task.history.map((entry, index) => (
              <TimelineItem
                entry={entry}
                isLast={index === task.history!.length - 1}
                key={entry.id}
              />
            ))
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#DCE2EA] p-5 text-sm text-[#8A99B0]">
              No history entries available for this task yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TaskDetail() {
  useSocket();

  return (
    <div className="flex min-h-screen bg-[#F1F4F9] text-[#1E293B]">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Navbar />
        <TaskDetailContent />
      </main>
    </div>
  );
}

export default TaskDetail;
