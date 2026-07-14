import api from './api';
import { REGISTER_ENDPOINTS } from '../constants/apiEndpoints';
import type {
  CreateRegisterPayload,
  Register,
  RegisterCalendarEvent,
  RegisterCalendarResponse,
  RegisterFilters,
  RegisterHead,
  RegisterStatus,
} from '../types/register.types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getRegisters(filters?: RegisterFilters): Promise<Register[]> {
  const res = await api.get<ApiResponse<Register[]>>(REGISTER_ENDPOINTS.list, { params: filters });
  return res.data.data;
}

export async function getRegisterCalendarEvents(range?: { start?: string; end?: string }): Promise<RegisterCalendarEvent[]> {
  const res = await api.get<ApiResponse<RegisterCalendarEvent[]>>(REGISTER_ENDPOINTS.calendar, { params: range });
  return res.data.data;
}

/** Calendar entries (dots only) for a single register — used by the Calendar popup. */
export async function getRegisterCalendarFor(id: number, month?: string): Promise<RegisterCalendarResponse> {
  const res = await api.get<ApiResponse<RegisterCalendarResponse>>(REGISTER_ENDPOINTS.calendarFor(id), {
    params: month ? { month } : undefined,
  });
  return res.data.data;
}

/** Active users available to be selected as a Register's Head Name. */
export async function getRegisterHeads(): Promise<RegisterHead[]> {
  const res = await api.get<ApiResponse<RegisterHead[]>>(REGISTER_ENDPOINTS.heads);
  return res.data.data;
}

export async function createRegister(payload: CreateRegisterPayload): Promise<Register> {
  const res = await api.post<ApiResponse<Register>>(REGISTER_ENDPOINTS.create, payload);
  return res.data.data;
}

export async function updateRegister(id: number, payload: Partial<CreateRegisterPayload>): Promise<Register> {
  const res = await api.put<ApiResponse<Register>>(REGISTER_ENDPOINTS.update(id), payload);
  return res.data.data;
}

export async function deleteRegister(id: number): Promise<void> {
  await api.delete(REGISTER_ENDPOINTS.delete(id));
}

export async function updateRegisterStatus(id: number, status: RegisterStatus): Promise<Register> {
  const res = await api.patch<ApiResponse<Register>>(REGISTER_ENDPOINTS.updateStatus(id), { status });
  return res.data.data;
}
