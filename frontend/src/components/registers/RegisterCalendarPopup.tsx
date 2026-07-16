import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '../common/Modal';
import { getRegisterCalendarFor } from '../../services/registerService';
import type { Register, RegisterDotColor } from '../../types/register.types';

interface RegisterCalendarPopupProps {
  register: Register | null;
  onClose: () => void;
}

const DOT_CLASS: Record<RegisterDotColor, string> = {
  green: 'bg-[#22C55E]',
  yellow: 'bg-[#EAB308]',
  red: 'bg-[#EF4444]',
  gray: 'bg-[#CBD5E1]',
};

const LEGEND: { color: RegisterDotColor; label: string }[] = [
  { color: 'green', label: 'Completed' },
  { color: 'yellow', label: 'Pending' },
  { color: 'red', label: 'Missed' },
  { color: 'gray', label: 'Future' },
];

function startOfMonthGrid(anchor: Date): Date {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(start.getDate() - first.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/**
 * Small popup calendar for a single Register (Section 4/5 of the spec).
 * Only shows a colored dot inside each date cell — never status text.
 */
function RegisterCalendarPopup({ register, onClose }: RegisterCalendarPopupProps) {
  const [anchor, setAnchor] = useState(() => new Date());

  const monthKey = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}`;

  const { data, isLoading } = useQuery({
    // 'single' scopes this cache entry to just this one register, so that
    // updating another register's status never invalidates/refetches this popup.
    queryKey: ['register-calendar', 'single', register?.id, monthKey],
    queryFn: () => getRegisterCalendarFor(register!.id, monthKey),
    enabled: !!register,
  });

  const dotsByDate = useMemo(() => {
    const map = new Map<string, RegisterDotColor>();
    for (const entry of data?.entries ?? []) {
      map.set(entry.date, entry.dot_color);
    }
    return map;
  }, [data]);

  const days = useMemo(() => {
    const start = startOfMonthGrid(anchor);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [anchor]);

  const currentMonth = anchor.getMonth();
  const todayKey = toKey(new Date());

  return (
    <Modal isOpen={!!register} onClose={onClose} title={register ? `${register.name} — Calendar` : 'Calendar'}>
      {register ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E4EAF2] text-[#5B6E8C] hover:bg-[#F8F9FC]"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-[#1E293B]">
              {anchor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E4EAF2] text-[#5B6E8C] hover:bg-[#F8F9FC]"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-[#EFF2F6] bg-[#EFF2F6] text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="bg-[#F8F9FC] py-1.5 text-center font-semibold text-[#8A99B0]">
                {d}
              </div>
            ))}
            {days.map((day) => {
              const key = toKey(day);
              const dot = dotsByDate.get(key);
              const isCurrentMonth = day.getMonth() === currentMonth;
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={['flex h-11 flex-col items-center bg-white py-1', isCurrentMonth ? '' : 'bg-[#FAFBFD] text-[#C3CCDA]'].join(' ')}
                  title={dot ? `${key}` : undefined}
                >
                  <span
                    className={[
                      'flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
                      isToday ? 'bg-[#185FA5] text-white' : 'text-[#5B6E8C]',
                    ].join(' ')}
                  >
                    {day.getDate()}
                  </span>
                  {dot ? <span className={['mt-1 h-2 w-2 rounded-full', DOT_CLASS[dot]].join(' ')} /> : null}
                </div>
              );
            })}
          </div>

          {isLoading ? <p className="text-center text-xs text-[#8A99B0]">Loading…</p> : null}

          <div className="flex flex-wrap justify-center gap-3 border-t border-[#EFF2F6] pt-3 text-xs text-[#5B6E8C]">
            {LEGEND.map((item) => (
              <span key={item.color} className="flex items-center gap-1.5">
                <span className={['h-2.5 w-2.5 rounded-full', DOT_CLASS[item.color]].join(' ')} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default RegisterCalendarPopup;
