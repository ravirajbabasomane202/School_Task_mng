import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Badge from '../../components/common/Badge';
import RegisterCalendar from '../../components/registers/RegisterCalendar';
import RegisterDetailsModal from '../../components/registers/RegisterDetailsModal';
import { formatDate } from '../../utils/dateUtils';
import { getRegisterCalendarEvents, getRegisters } from '../../services/registerService';
import type { Register, RegisterCalendarEvent, RegisterCycle, RegisterPriority, RegisterStatus } from '../../types/register.types';

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

function RegistersPage() {
  const [tab, setTab] = useState<ViewTab>('table');
  const [detailsRegister, setDetailsRegister] = useState<Register | null>(null);

  const { data: registers = [], isLoading } = useQuery({
    queryKey: ['registers', 'view-only'],
    queryFn: () => getRegisters(),
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['register-calendar', 'view-only'],
    queryFn: () => getRegisterCalendarEvents(),
    enabled: tab === 'calendar',
  });

  const handleEventClick = (event: RegisterCalendarEvent) => {
    setDetailsRegister(event.register);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1E293B]">Registers</h1>
          <p className="mt-1 text-sm text-[#5B6E8C]">View-only access to all registers and their schedules</p>
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
        <div className="overflow-x-auto rounded-xl border border-[#EFF2F6] bg-white">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-[#8A99B0]">Loading…</div>
          ) : registers.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#8A99B0]">No registers found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-[#EFF2F6] bg-[#F8F9FC]">
                <tr>
                  {['Register Name', 'Register No.', 'Head Name', 'Checking Cycle', 'Priority', 'Start Date', 'Status', 'Next Due Date'].map(
                    (h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-[#8A99B0]">
                        {h}
                      </th>
                    )
                  )}
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
                    <td className="px-4 py-3 text-[#5B6E8C]">{CYCLE_LABEL[r.checking_cycle]}</td>
                    <td className="px-4 py-3">
                      <Badge variant={PRIORITY_BADGE[r.priority]}>{r.priority}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#5B6E8C]">{formatDate(r.start_date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#5B6E8C]">{formatDate(r.next_due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <RegisterCalendar events={calendarEvents} onEventClick={handleEventClick} />
      )}

      <RegisterDetailsModal register={detailsRegister} onClose={() => setDetailsRegister(null)} />
    </div>
  );
}

export default RegistersPage;
