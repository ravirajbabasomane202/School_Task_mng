export type RegisterCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
export type RegisterPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RegisterStatus = 'IDLE' | 'OK' | 'REJECTED';

export const REGISTER_CYCLES: { value: RegisterCycle; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half-Yearly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export const REGISTER_PRIORITIES: { value: RegisterPriority; label: string }[] = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export const REGISTER_STATUSES: { value: RegisterStatus; label: string }[] = [
  { value: 'IDLE', label: 'Idle' },
  { value: 'OK', label: 'OK' },
  { value: 'REJECTED', label: 'Rejected' },
];

export interface Register {
  id: number;
  name: string;
  register_no: string;
  head_name: string;
  cycle: RegisterCycle;
  priority: RegisterPriority;
  status: RegisterStatus;
  start_date: string;
  next_due_date: string;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateRegisterPayload {
  name: string;
  register_no: string;
  head_name: string;
  cycle: RegisterCycle;
  priority: RegisterPriority;
  start_date: string;
}

export interface RegisterFilters {
  search?: string;
  cycle?: RegisterCycle;
  priority?: RegisterPriority;
  status?: RegisterStatus;
}

export interface RegisterCalendarEvent {
  id: number;
  title: string;
  date: string;
  status: RegisterStatus;
  color: 'gray' | 'green' | 'red';
  is_future_or_pending: boolean;
  register: Register;
}
