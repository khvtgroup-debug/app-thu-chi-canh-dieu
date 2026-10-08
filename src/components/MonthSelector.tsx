import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthVN } from '../utils/formatters';

interface MonthSelectorProps {
  currentMonth: string; // YYYY-MM
  onChangeMonth: (newMonth: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentMonth,
  onChangeMonth,
}) => {
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const formatted = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onChangeMonth(formatted);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const formatted = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onChangeMonth(formatted);
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    onChangeMonth(formatted);
  };

  return (
    <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        {/* Left: Current Month Label */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 bg-orange-50 text-orange-700 rounded-lg shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Kỳ Báo Cáo
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 font-mono tabular-nums leading-tight block">
              {formatMonthVN(currentMonth)}
            </span>
          </div>
        </div>

        {/* Right: Controls (< > input & Tháng này) */}
        <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
          <button
            onClick={handlePrevMonth}
            title="Tháng trước"
            aria-label="Tháng trước"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="month"
            value={currentMonth}
            onChange={(e) => {
              if (e.target.value) onChangeMonth(e.target.value);
            }}
            className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm font-medium border border-slate-200 rounded-lg text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-emerald-500 cursor-pointer font-mono tabular-nums"
          />

          <button
            onClick={handleNextMonth}
            title="Tháng tiếp theo"
            aria-label="Tháng tiếp theo"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleSetCurrentMonth}
            className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Hiện Tại
          </button>
        </div>
      </div>
    </div>
  );
};
