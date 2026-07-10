import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import RegisterCalendar from '../../components/registers/RegisterCalendar';
import RegisterDetailsModal from '../../components/registers/RegisterDetailsModal';
import { formatDate } from '../../utils/dateUtils';
import {
  deleteRegister,
  getRegisterCalendarEvents,
  getRegisters,
  updateRegister,
  updateRegisterStatus,
} from '../../services/registerService';
import {
  REGISTER_CYCLES,
  REGISTER_PRIORITIES,
  REGISTER_STATUSES,
} from '../../types/register.types';
import type {
  Register,
  RegisterCalendarEvent,
  RegisterCycle,
  RegisterPriority,
  RegisterStatus,
} from '../../types/register.types';

const STATUS_BADGE: Record<RegisterStatus, 'gray' | 'green' | 'red'> = {
  IDLE: 'gray',
  OK: 'green',
  REJECTED: 'red',
};

const PRIORITY_BADGE: Record<RegisterPriority, 'red' | 'amber' | 'blue'> = {
  HIGH: 'red',
  MEDIUM: 'amber',
  LOW: 'blue',
};

const CYCLE_LABEL: Record<RegisterCycle, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-Yearly',
  YEARLY: 'Yearly',
};

type ViewTab = 'table' | 'calendar';

function RegisterMonitoring() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<ViewTab>('table');
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState<RegisterCycle | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<RegisterPriority | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<RegisterStatus | 'ALL'>('ALL');

  const [editingRegister, setEditingRegister] = useState<Register | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    register_no: string;
    head_name: string;
    cycle: RegisterCycle;
    priority: RegisterPriority;
    start_date: string;
  } | null>(null);

  const [statusTarget, setStatusTarget] = useState<Register | null>(null);
  const [pendingStatus, setPendingStatus] = useState<RegisterStatus>('OK');
  const [deleteTarget, setDeleteTarget] = useState<Register | null>(null);
  const [detailsRegister, setDetailsRegister] = useState<Register | null>(null);

  const { data: registers = [], isLoading } = useQuery({
    queryKey: ['registers', search, cycleFilter, priorityFilter, statusFilter],
    queryFn: () =>
      getRegisters({
        search: search || undefined,
        cycle: cycleFilter === 'ALL' ? undefined : cycleFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['register-calendar'],
    queryFn: () => getRegisterCalendarEvents(),
    enabled: tab === 'calendar',
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Register> }) => updateRegister(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registers'] });
      qc.invalidateQueries({ queryKey: ['register-calendar'] });
      toast.success('Register updated successfully');
      setEditingRegister(null);
      setEditForm(null);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update register';
      toast.error(message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RegisterStatus }) => updateRegisterStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registers'] });
      qc.invalidateQueries({ queryKey: ['register-calendar'] });
      toast.success('Register status updated');
      setStatusTarget(null);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRegister,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registers'] });
      qc.invalidateQueries({ queryKey: ['register-calendar'] });
      toast.success('Register deleted successfully');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete register'),
  });

  const openEdit = (register: Register) => {
    setEditingRegister(register);
    setEditForm({
      name: register.name,
      register_no: register.register_no,
      head_name: register.head_name,
      cycle: register.cycle,
      priority: register.priority,
      start_date: register.start_date,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegister || !editForm) return;
    if (!editForm.name || !editForm.register_no || !editForm.head_name || !editForm.start_date) {
      toast.error('All fields are required');
      return;
    }
    updateMutation.mutate({ id: editingRegister.id, data: editForm });
  };

  const openStatusModal = (register: Register) => {
    setStatusTarget(register);
    setPendingStatus(register.status);
  };

  const handleEventClick = (event: RegisterCalendarEvent) => {
    setDetailsRegister(event.register);
  };

  const emptyState = useMemo(() => !isLoading && registers.length === 0, [isLoading, registers]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1E293B]">Register Monitoring</h1>
          <p className="mt-1 text-sm text-[#5B6E8C]">Track register status and upcoming due dates</p>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-[#E4EAF2]">
          {(['table', 'calendar'] as ViewTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                'px-3.5 py-1.5 text-xs font-medium capitalize transition',
                tab === t ? 'bg-[#185FA5] text-white' : 'bg-white text-[#5B6E8C] hover:bg-[#F8F9FC]',
              ].join(' ')}
            >
              {t === 'table' ? 'List' : 'Calendar'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'table' ? (
        <>
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Register Name or No."
              className="min-w-[220px] flex-1 rounded-lg border border-[#E4EAF2] px-3 py-2 text-sm"
            />
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value as RegisterCycle | 'ALL')}
              className="rounded-lg border border-[#E4EAF2] px-3 py-2 text-sm"
            >
              <option value="ALL">All Cycles</option>
              {REGISTER_CYCLES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as RegisterPriority | 'ALL')}
              className="rounded-lg border border-[#E4EAF2] px-3 py-2 text-sm"
            >
              <option value="ALL">All Priorities</option>
              {REGISTER_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RegisterStatus | 'ALL')}
              className="rounded-lg border border-[#E4EAF2] px-3 py-2 text-sm"
            >
              <option value="ALL">All Status</option>
              {REGISTER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#EFF2F6] bg-white">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-[#8A99B0]">Loading…</div>
            ) : emptyState ? (
              <div className="py-12 text-center text-sm text-[#8A99B0]">No registers found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-[#EFF2F6] bg-[#F8F9FC]">
                  <tr>
                    {[
                      'Register Name',
                      'Register No.',
                      'Head Name',
                      'Cycle',
                      'Priority',
                      'Start Date',
                      'Status',
                      'Next Due Date',
                      'Actions',
                    ].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-[#8A99B0]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F4F9]">
                  {registers.map((r) => (
                    <tr key={r.id} className="transition hover:bg-[#F8F9FC]">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setDetailsRegister(r)}
                          className="font-medium text-[#185FA5] hover:underline"
                        >
                          {r.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#5B6E8C]">{r.register_no}</td>
                      <td className="px-4 py-3 text-[#5B6E8C]">{r.head_name}</td>
                      <td className="px-4 py-3 text-[#5B6E8C]">{CYCLE_LABEL[r.cycle]}</td>
                      <td className="px-4 py-3">
                        <Badge variant={PRIORITY_BADGE[r.priority]}>{r.priority}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[#5B6E8C]">{formatDate(r.start_date)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[#5B6E8C]">{formatDate(r.next_due_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openEdit(r)} className="text-xs text-blue-600 hover:underline" type="button">
                            Edit
                          </button>
                          <button
                            onClick={() => openStatusModal(r)}
                            className="text-xs text-emerald-600 hover:underline"
                            type="button"
                          >
                            Update Status
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="text-xs text-red-600 hover:underline"
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <RegisterCalendar events={calendarEvents} onEventClick={handleEventClick} />
      )}

      {/* Edit modal */}
      <Modal
        isOpen={!!editingRegister}
        onClose={() => {
          setEditingRegister(null);
          setEditForm(null);
        }}
        title="Edit Register"
      >
        {editForm ? (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Register Name *"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <Input
              label="Register No. *"
              value={editForm.register_no}
              onChange={(e) => setEditForm({ ...editForm, register_no: e.target.value })}
            />
            <Input
              label="Head Name *"
              value={editForm.head_name}
              onChange={(e) => setEditForm({ ...editForm, head_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-[#36506C]">Cycle *</span>
                <select
                  value={editForm.cycle}
                  onChange={(e) => setEditForm({ ...editForm, cycle: e.target.value as RegisterCycle })}
                  className="min-h-[38px] rounded-[10px] border-[0.5px] border-solid border-[#DCE2EA] bg-[#F8F9FC] px-3 text-sm"
                >
                  {REGISTER_CYCLES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-[#36506C]">Priority *</span>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as RegisterPriority })}
                  className="min-h-[38px] rounded-[10px] border-[0.5px] border-solid border-[#DCE2EA] bg-[#F8F9FC] px-3 text-sm"
                >
                  {REGISTER_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Input
              label="Start Date *"
              type="date"
              value={editForm.start_date}
              onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => { setEditingRegister(null); setEditForm(null); }}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* Update status modal */}
      <Modal isOpen={!!statusTarget} onClose={() => setStatusTarget(null)} title="Update Status">
        {statusTarget ? (
          <div className="space-y-4">
            <p className="text-sm text-[#5B6E8C]">
              Update status for <span className="font-semibold text-[#1E293B]">{statusTarget.name}</span> ({statusTarget.register_no})
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-[#36506C]">Status</span>
              <select
                value={pendingStatus}
                onChange={(e) => setPendingStatus(e.target.value as RegisterStatus)}
                className="min-h-[38px] rounded-[10px] border-[0.5px] border-solid border-[#DCE2EA] bg-[#F8F9FC] px-3 text-sm"
              >
                {REGISTER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setStatusTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: statusTarget.id, status: pendingStatus })}
              >
                Update
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Register">
        {deleteTarget ? (
          <div className="space-y-4">
            <p className="text-sm text-[#5B6E8C]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#1E293B]">{deleteTarget.name}</span> ({deleteTarget.register_no})? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                type="button"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <RegisterDetailsModal register={detailsRegister} onClose={() => setDetailsRegister(null)} />
    </div>
  );
}

export default RegisterMonitoring;
