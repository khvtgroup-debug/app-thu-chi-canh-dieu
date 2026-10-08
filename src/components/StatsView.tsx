import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart2, PieChart } from 'lucide-react';
import { Transaction, CategoryItem } from '../types/finance';
import { DEFAULT_EXPENSE_CATEGORIES } from '../data/defaultCategories';
import { formatVND, formatPercent } from '../utils/formatters';

interface StatsViewProps {
  transactions: Transaction[];
  currentYear: number;
  categories?: CategoryItem[];
}

const PIE_COLORS = [
  '#0284c7', // Sky
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export const StatsView: React.FC<StatsViewProps> = ({
  transactions,
  currentYear,
  categories,
}) => {
  const [showProfitBar, setShowProfitBar] = useState(true);

  // Compute monthly data for 12 months of currentYear
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthKey = `${currentYear}-${String(monthNum).padStart(2, '0')}`;
      return {
        monthNumber: monthNum,
        monthKey,
        name: `T${monthNum}`,
        monthFull: `Tháng ${monthNum}/${currentYear}`,
        doanhThu: 0,
        chiPhi: 0,
        loiNhuan: 0,
        margin: 0,
      };
    });

    transactions.forEach((tx) => {
      const [txYear, txMonth] = tx.month.split('-');
      if (parseInt(txYear, 10) === currentYear) {
        const mIdx = parseInt(txMonth, 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          if (tx.type === 'thu') {
            months[mIdx].doanhThu += tx.amount;
          } else {
            months[mIdx].chiPhi += tx.amount;
          }
        }
      }
    });

    months.forEach((m) => {
      m.loiNhuan = m.doanhThu - m.chiPhi;
      m.margin = m.doanhThu > 0 ? (m.loiNhuan / m.doanhThu) * 100 : 0;
    });

    return months;
  }, [transactions, currentYear]);

  // Aggregate year totals
  const yearRevenue = monthlyData.reduce((sum, m) => sum + m.doanhThu, 0);
  const yearExpense = monthlyData.reduce((sum, m) => sum + m.chiPhi, 0);
  const yearProfit = yearRevenue - yearExpense;
  const yearMargin = yearRevenue > 0 ? (yearProfit / yearRevenue) * 100 : 0;

  // Active months count
  const activeMonths = monthlyData.filter((m) => m.doanhThu > 0 || m.chiPhi > 0).length || 1;
  const avgMonthlyProfit = yearProfit / activeMonths;

  // Expense grouping distribution for the entire year
  const expenseGroupTotals = useMemo(() => {
    const groups: Record<string, number> = {};
    const availableCats = categories && categories.length > 0 ? categories : DEFAULT_EXPENSE_CATEGORIES;
    const catMap = new Map(availableCats.map((c) => [c.id, c.group || 'Khác']));

    transactions.forEach((tx) => {
      if (tx.type === 'chi' && tx.month.startsWith(String(currentYear))) {
        const group = catMap.get(tx.categoryId) || 'Khác';
        groups[group] = (groups[group] || 0) + tx.amount;
      }
    });

    return Object.entries(groups)
      .map(([name, amount]) => ({
        name,
        value: amount,
        percentage: yearExpense > 0 ? (amount / yearExpense) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, currentYear, yearExpense]);

  // Custom Tooltip for Recharts Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-md">
          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1.5 mb-2">
            {data.monthFull}
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
                <span>Doanh Thu:</span>
              </span>
              <strong className="text-emerald-400">{formatVND(data.doanhThu)}</strong>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span>
                <span>Chi Phí:</span>
              </span>
              <strong className="text-rose-400">{formatVND(data.chiPhi)}</strong>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-400"></span>
                <span>Lợi Nhuận:</span>
              </span>
              <strong className={data.loiNhuan >= 0 ? 'text-amber-300' : 'text-rose-400'}>
                {formatVND(data.loiNhuan)}
              </strong>
            </div>

            <div className="text-[11px] text-slate-400 text-right mt-1 font-sans">
              Tỷ suất: <span className="font-semibold text-sky-400">{formatPercent(data.margin)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-sans">
          <div className="font-semibold text-slate-200">{data.name}</div>
          <div className="font-mono text-emerald-400 font-bold mt-1">
            {formatVND(data.value)} ({data.payload.percentage.toFixed(1)}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Year Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
            Doanh Thu Năm {currentYear}
          </span>
          <div className="mt-1.5 sm:mt-2 text-base xs:text-lg sm:text-2xl font-bold text-emerald-600 font-mono tabular-nums truncate">
            {formatVND(yearRevenue)}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
            TB: {formatVND(yearRevenue / activeMonths)}/tháng
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
            Chi Phí Năm {currentYear}
          </span>
          <div className="mt-1.5 sm:mt-2 text-base xs:text-lg sm:text-2xl font-bold text-rose-600 font-mono tabular-nums truncate">
            {formatVND(yearExpense)}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
            TB: {formatVND(yearExpense / activeMonths)}/tháng
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
            Lợi Nhuận Năm {currentYear}
          </span>
          <div
            className={`mt-1.5 sm:mt-2 text-base xs:text-lg sm:text-2xl font-bold font-mono tabular-nums truncate ${
              yearProfit >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatVND(yearProfit)}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
            TB: {formatVND(avgMonthlyProfit)}/tháng
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
            Tỷ Suất (% on Rev)
          </span>
          <div className="mt-1.5 sm:mt-2 text-base xs:text-lg sm:text-2xl font-bold text-sky-600 font-mono tabular-nums truncate">
            {formatPercent(yearMargin)}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
            Đánh giá hiệu quả
          </div>
        </div>
      </div>

      {/* ================= RECHARTS BAR CHART (MONTHLY COMPARISON) ================= */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 sm:mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
              <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span>Biểu Đồ So Sánh Tổng Thu & Tổng Chi 12 Tháng Năm {currentYear}</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Tích hợp Recharts phân tích xu hướng thu chi và thặng dư tài chính trường mầm non
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showProfitBar}
                onChange={(e) => setShowProfitBar(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium">Hiện cột Lợi Nhuận</span>
            </label>
          </div>
        </div>

        {/* Responsive Recharts Container */}
        <div className="w-full overflow-x-auto pb-1">
          <div className="min-w-[550px] sm:min-w-0 h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barGap={3}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}tr`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return `${val}`;
                  }}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    if (value === 'doanhThu') return <span className="text-xs text-slate-700 font-medium">Tổng Thu</span>;
                    if (value === 'chiPhi') return <span className="text-xs text-slate-700 font-medium">Tổng Chi</span>;
                    if (value === 'loiNhuan') return <span className="text-xs text-slate-700 font-medium">Lợi Nhuận</span>;
                    return value;
                  }}
                />
                <Bar
                  dataKey="doanhThu"
                  name="doanhThu"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="chiPhi"
                  name="chiPhi"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                {showProfitBar && (
                  <Bar
                    dataKey="loiNhuan"
                    name="loiNhuan"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={18}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: 12-Month Table & Expense Recharts Pie Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Table of 12 Months */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-200">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Chi Tiết Báo Cáo 12 Tháng Năm {currentYear}
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[450px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Tháng</th>
                  <th className="py-2.5 px-3 text-right">Doanh Thu (Thu)</th>
                  <th className="py-2.5 px-3 text-right">Tổng Chi Phí</th>
                  <th className="py-2.5 px-3 text-right">Lời / Lỗ</th>
                  <th className="py-2.5 px-3 text-right">% on Rev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {monthlyData.map((m) => (
                  <tr key={m.monthKey} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                      Tháng {m.monthNumber}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-medium">
                      {formatVND(m.doanhThu)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-700 font-medium">
                      {formatVND(m.chiPhi)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        m.loiNhuan >= 0 ? 'text-slate-900' : 'text-rose-600'
                      }`}
                    >
                      {formatVND(m.loiNhuan)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {formatPercent(m.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Structure Breakdown with Recharts PieChart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Cơ Cấu Chi Phí Theo Nhóm
              </h4>
            </div>

            {/* Recharts Pie Chart visual */}
            {yearExpense > 0 && expenseGroupTotals.length > 0 && (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={expenseGroupTotals}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {expenseGroupTotals.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* List breakdown */}
            <div className="space-y-2 mt-2">
              {expenseGroupTotals.slice(0, 5).map((group, idx) => (
                <div key={group.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      ></span>
                      <span className="truncate max-w-[140px]">{group.name}</span>
                    </span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {formatVND(group.value)} ({group.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3.5 sm:p-4 rounded-b-xl text-[11px] sm:text-xs text-slate-500">
            <span className="font-semibold text-slate-700 block mb-1">
              Gợi ý cân đối tài chính mầm non:
            </span>
            Lương nhân sự chiếm 40-50%, Bếp ăn 15-20%, Mặt bằng 15-20% là tỷ lệ chuẩn giúp trường sinh lời bền vững.
          </div>
        </div>
      </div>
    </div>
  );
};
