import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import RegistryCycleChart from '../charts/RegistryCycleChart';
import Badge from '../common/Badge';
import { getRegisterCalendarEvents, getRegisters } from '../../services/registerService';
import { todayISO } from '../../utils/dateUtils';
import type { Register, RegisterCycle, RegisterDotColor } from '../../types/register.types';

const CYCLE_LABEL: Record<RegisterCycle, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-Yearly',
  YEARLY: 'Yearly',
};

const CYCLE_ORDER: RegisterCycle[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'];

const DOT_CLASS: Record<RegisterDotColor, string> = {
  green: 'bg-[#22C55E]',
  yellow: 'bg-[#EAB308]',
  red: 'bg-[#EF4444]',
  gray: 'bg-[#E2E8F0]',
};

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

interface RegistrySummary {
  register: Register;
  completed: number;
  missed: number;
  rejected: number;
  total: number;
  completionRate: number;
  /** Chronological dot colors for the last ~30 days, oldest first — this IS
   * the per-registry "activity graph": a daily register shows ~30 dots, a
   * weekly one shows ~4, a monthly one shows ~1, etc., because each register
   * only has an occurrence on the days its own Checking Cycle actually falls
   * due. */
  strip: { date: string; color: RegisterDotColor }[];
}

function RegistryPerformancePanel() {
  const today = todayISO();
  const rangeStart = daysAgoISO(90);

  const { data: registers = [], isLoading: registersLoading } = useQuery({
    queryKey: ['registers', 'performance-panel'],
    queryFn: () => getRegisters(),
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['register-calendar', 'performance-panel', rangeStart, today],
    queryFn: () => getRegisterCalendarEvents({ start: rangeStart, end: today }),
  });

  const summaries = useMemo<RegistrySummary[]>(() => {
    const byRegister = new Map<number, RegistrySummary>();
    for (const register of registers) {
      byRegister.set(register.id, {
        register,
        completed: 0,
        missed: 0,
        rejected: 0,
        total: 0,
        completionRate: 0,
        strip: [],
      });
    }

    for (const event of events) {
      // Only past + today occurrences count as "activity" — a future/UPCOMING
      // date hasn't happened yet, so it can't be counted as completed or missed.
      if (event.date > today) continue;
      const summary = byRegister.get(event.register_id);
      if (!summary) continue;

      summary.strip.push({ date: event.date, color: event.dot_color });
      if (event.computed_status === 'COMPLETED') summary.completed += 1;
      else if (event.computed_status === 'FAILED') summary.rejected += 1;
      else if (event.computed_status === 'PENDING') summary.missed += 1;
    }

    for (const summary of byRegister.values()) {
      summary.total = summary.completed + summary.missed + summary.rejected;
      summary.completionRate = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0;
      summary.strip.sort((a, b) => a.date.localeCompare(b.date));
      summary.strip = summary.strip.slice(-30);
    }

    return Array.from(byRegister.values()).sort((a, b) => a.completionRate - b.completionRate);
  }, [registers, events, today]);

  const cycleChartData = useMemo(() => {
    return CYCLE_ORDER.map((cycle) => {
      const rows = summaries.filter((s) => s.register.checking_cycle === cycle);
      const totalCompleted = rows.reduce((sum, r) => sum + r.completed, 0);
      const totalDue = rows.reduce((sum, r) => sum + r.total, 0);
      return {
        cycle: CYCLE_LABEL[cycle],
        completionRate: totalDue ? Math.round((totalCompleted / totalDue) * 100) : 0,
        registerCount: rows.length,
      };
    }).filter((row) => row.registerCount > 0);
  }, [summaries]);

  const isLoading = registersLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="rounded-[20px] border border-[#EFF2F6] bg-white p-6">
        <p className="text-sm text-[#8A99B0]">Loading registry performance…</p>
      </div>
    );
  }

  if (registers.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#EFF2F6] bg-white p-6">
        <h2 className="mb-1 text-xl font-semibold text-[#1E293B]">Registry performance</h2>
        <p className="text-sm text-[#8A99B0]">No registers have been created yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[20px] border border-[#EFF2F6] bg-white p-6">
        <h2 className="mb-1 text-xl font-semibold text-[#1E293B]">Registry completion by checking cycle</h2>
        <p className="mb-4 text-sm text-[#8A99B0]">
          How reliably each cycle (Daily / Weekly / Monthly / …) is being kept up to date, over the last 90 days.
        </p>
        <RegistryCycleChart data={cycleChartData} />
      </div>

      <div className="rounded-[20px] border border-[#EFF2F6] bg-white p-6">
        <h2 className="mb-1 text-xl font-semibold text-[#1E293B]">Registry activity report</h2>
        <p className="mb-4 text-sm text-[#8A99B0]">
          Every register, however it's assigned (daily, weekly, monthly…), with its own recent activity.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EFF2F6]">
                <th className="px-4 py-3 text-left font-medium text-[#5B6E8C]">Register</th>
                <th className="px-4 py-3 text-left font-medium text-[#5B6E8C]">Head</th>
                <th className="px-4 py-3 text-left font-medium text-[#5B6E8C]">Cycle</th>
                <th className="px-4 py-3 text-left font-medium text-[#5B6E8C]">Recent activity</th>
                <th className="px-4 py-3 text-left font-medium text-[#5B6E8C]">Completed</th>
                <th className="px-4 py-3 text-left font-medium text-[#5B6E8C]">Missed</th>
                <th className="px-4 py-3 text-left font-medium text-[#5B6E8C]">Rejected</th>
                <th className="px-4 py-3 text-left font-medium text-[#5B6E8C]">Completion</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.register.id} className="border-b border-[#EFF2F6]">
                  <td className="px-4 py-3 font-medium text-[#1E293B]">{s.register.name}</td>
                  <td className="px-4 py-3 text-[#5B6E8C]">{s.register.head_name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="blue">{CYCLE_LABEL[s.register.checking_cycle]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {s.strip.length ? (
                      <div className="flex items-center gap-[3px]" title="Oldest → most recent">
                        {s.strip.map((entry) => (
                          <span
                            key={entry.date}
                            className={['h-2.5 w-2.5 rounded-sm', DOT_CLASS[entry.color]].join(' ')}
                            title={entry.date}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[#C3CCDA]">No activity yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#1E293B]">{s.completed}</td>
                  <td className="px-4 py-3 text-[#1E293B]">{s.missed}</td>
                  <td className="px-4 py-3 text-[#1E293B]">{s.rejected}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-gray-200">
                        <div
                          className={[
                            'h-2 rounded-full',
                            s.completionRate >= 75 ? 'bg-emerald-500' : s.completionRate < 50 ? 'bg-red-500' : 'bg-amber-500',
                          ].join(' ')}
                          style={{ width: `${s.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#1E293B]">{s.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RegistryPerformancePanel;
