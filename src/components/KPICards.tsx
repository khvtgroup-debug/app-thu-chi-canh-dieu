import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, PieChart, Sparkles } from 'lucide-react';
import { formatVND, formatPercent } from '../utils/formatters';
import { AppMode, HomeThemeColor } from '../types/finance';
import { getThemeConfig } from '../utils/themeConfig';

interface KPICardsProps {
  totalRevenue: number;
  totalExpense: number;
  txCount: number;
  mode?: AppMode;
  themeColor?: HomeThemeColor;
}

export const KPICards: React.FC<KPICardsProps> = ({
  totalRevenue,
  totalExpense,
  txCount,
  mode = 'business',
  themeColor,
}) => {
  const isBusiness = mode === 'business';
  const theme = getThemeConfig(themeColor);
  const profit = totalRevenue - totalExpense;
  const isProfitable = profit >= 0;
  const marginPercent = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* CARD 1: THU / DOANH THU */}
      <div className={`bg-white p-3 sm:p-4.5 rounded-xl border shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between ${
        !isBusiness ? theme.summaryCardBorder : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {isBusiness ? 'Tổng Doanh Thu' : 'Tổng Thu Nhập Gia Đình'}
          </span>
          <div className="p-1 sm:p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-base xs:text-lg sm:text-2xl font-bold text-emerald-600 font-mono tabular-nums tracking-tight truncate">
            {formatVND(totalRevenue)}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
            {isBusiness ? 'Học phí, ăn, CSVC' : 'Lương, thưởng & thu phụ'}
          </div>
        </div>
      </div>

      {/* CARD 2: CHI / CHI PHÍ */}
      <div className={`bg-white p-3 sm:p-4.5 rounded-xl border shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between ${
        !isBusiness ? theme.summaryCardBorder : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {isBusiness ? 'Tổng Chi Phí' : 'Tổng Chi Tiêu Gia Đình'}
          </span>
          <div className="p-1 sm:p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
            <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-base xs:text-lg sm:text-2xl font-bold text-rose-600 font-mono tabular-nums tracking-tight truncate">
            {formatVND(totalExpense)}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
            {isBusiness ? 'Lương, thực phẩm, nhà...' : 'Ăn uống, điện nước, con cái...'}
          </div>
        </div>
      </div>

      {/* CARD 3: LỜI / LỖ / TÍCH LŨY */}
      <div className={`bg-white p-3 sm:p-4.5 rounded-xl border shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between ${
        !isBusiness ? theme.summaryCardBorder : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {isBusiness ? 'Lời / Lỗ (Thặng Dư)' : 'Tiền Tích Lũy / Tiết Kiệm'}
          </span>
          <div
            className={`p-1 sm:p-1.5 rounded-lg shrink-0 ${
              isProfitable ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isBusiness ? <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div
            className={`text-base xs:text-lg sm:text-2xl font-bold font-mono tabular-nums tracking-tight truncate ${
              isProfitable ? (isBusiness ? 'text-slate-900' : theme.accentText) : 'text-rose-600'
            }`}
          >
            {formatVND(profit)}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs truncate hidden xs:block">
            {isProfitable ? (
              <span className="text-emerald-600 font-medium">
                {isBusiness ? 'Đạt thặng dư' : 'Tích lũy tài chính tốt'}
              </span>
            ) : (
              <span className="text-rose-600 font-medium">Chi vượt thu</span>
            )}
          </div>
        </div>
      </div>

      {/* CARD 4: % TỶ LỆ */}
      <div className={`bg-white p-3 sm:p-4.5 rounded-xl border shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between ${
        !isBusiness ? theme.summaryCardBorder : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {isBusiness ? '% Trên Doanh Thu' : 'Tỷ Lệ Tích Lũy (%)'}
          </span>
          <div className="p-1 sm:p-1.5 bg-sky-50 text-sky-600 rounded-lg shrink-0">
            <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div
            className={`text-base xs:text-lg sm:text-2xl font-bold font-mono tabular-nums tracking-tight truncate ${
              isProfitable ? 'text-sky-600' : 'text-rose-600'
            }`}
          >
            {formatPercent(marginPercent)}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
            {txCount} khoản giao dịch
          </div>
        </div>
      </div>
    </div>
  );
};
