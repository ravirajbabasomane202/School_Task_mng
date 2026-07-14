export type RegisterCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
export type RegisterPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RegisterStatus = 'IDLE' | 'OK' | 'REJECTED';

// Auto-derived status shown on the calendar (Section 7 of the spec):
// COMPLETED (on time), PENDING (due date passed, no record), FAILED (rejected),
// UPCOMING (future scheduled date).
export type RegisterComputedStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'UPCOMING';
export type RegisterDotColor = 'green' | 'yellow' | 'red' | 'gray';

export const STATUS_DOT_COLOR: Record<RegisterComputedStatus, RegisterDotColor> = {
  COMPLETED: 'green',
  PENDING: 'yellow',
  FAILED: 'red',
  UPCOMING: 'gray',
};

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
  head_id?: number | null;
  head_name: string;
  /** Preferred field going forward — see task: rename "Cycle" to "Checking Cycle". */
  checking_cycle: RegisterCycle;
  /** @deprecated use checking_cycle */
  cycle: RegisterCycle;
  priority: RegisterPriority;
  status: RegisterStatus;
  computed_status: RegisterComputedStatus;
  dot_color: RegisterDotColor;
  start_date: string;
  next_due_date: string;
  last_completed_date?: string | null;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at?: string;
}

/** A user eligible to be selected as a Register's Head Name. */
export interface RegisterHead {
  id: number;
  name: string;
  role: string;
  department_id?: number | null;
  department_name?: string | null;
}

export interface CreateRegisterPayload {
  name: string;
  register_no: string;
  head_id: number | '';
  checking_cycle: RegisterCycle;
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
  computed_status: RegisterComputedStatus;
  color: 'gray' | 'green' | 'red';
  dot_color: RegisterDotColor;
  is_future_or_pending: boolean;
  register: Register;
}

export interface RegisterCalendarEntry {
  date: string;
  status: RegisterComputedStatus;
  dot_color: RegisterDotColor;
}

export interface RegisterCalendarResponse {
  register: Register;
  month: string;
  entries: RegisterCalendarEntry[];
}
