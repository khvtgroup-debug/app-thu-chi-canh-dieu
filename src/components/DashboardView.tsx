import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  GraduationCap,
  FileSpreadsheet,
  ListOrdered,
  BarChart3,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  CreditCard,
  Banknote,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Layers,
  Sparkles,
  ChevronRight,
  Upload,
  FileDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Transaction,
  StudentTuition,
  CategoryItem,
  SchoolConfig,
  FamilyConfig,
  PaymentMethod,
  AppMode,
  HomeThemeColor,
} from '../types/finance';
import { formatVND, formatPercent, formatDateVN, getCurrentDateStr } from '../utils/formatters';
import { getThemeConfig, THEME_OPTIONS } from '../utils/themeConfig';

interface DashboardViewProps {
  currentMonth: string;
  transactions: Transaction[];
  currentMonthTransactions: Transaction[];
  students: StudentTuition[];
  categories: CategoryItem[];
  schoolConfig: SchoolConfig;
  familyConfig?: FamilyConfig;
  mode?: AppMode;
  onNavigateToTab: (
    tab: 'bang_tinh' | 'giao_dich' | 'hoc_phi' | 'thong_ke',
    categoryFilter?: string
  ) => void;
  onOpenNewTx: () => void;
  onOpenNewTxWithType?: (type: 'thu' | 'chi') => void;
  onOpenCategoryManager: () => void;
  onExportCSV: () => void;
  onPrintMonthReport: () => void;
  onOpenSettings: () => void;
  onConfirmTuitionPayment: (studentId: string, method: PaymentMethod, date: string) => void;
  onOpenImportExcel?: (type?: 'all' | 'thu' | 'chi') => void;
  onExportExcel?: (type?: 'all' | 'thu' | 'chi') => void;
  onChangeTheme?: (theme: HomeThemeColor) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentMonth,
  transactions,
  currentMonthTransactions,
  students,
  categories,
  schoolConfig,
  familyConfig,
  mode = 'business',
  onNavigateToTab,
  onOpenNewTx,
  onOpenNewTxWithType,
  onOpenCategoryManager,
  onExportCSV,
  onPrintMonthReport,
  onOpenSettings,
  onConfirmTuitionPayment,
  onOpenImportExcel,
  onExportExcel,
  onChangeTheme,
}) => {
  const isBusiness = mode === 'business';
  const theme = getThemeConfig(familyConfig?.themeColor);
  // 1. Current Month Financial Totals
  const {
    totalRevenue,
    totalExpense,
    profit,
    profitMargin,
    cashIn,
    bankIn,
    cashOut,
    bankOut,
    thuCount,
    chiCount,
  } = useMemo(() => {
    let rev = 0;
    let exp = 0;
    let cIn = 0;
    let bIn = 0;
    let cOut = 0;
    let bOut = 0;
    let tCount = 0;
    let cCount = 0;

    currentMonthTransactions.forEach((tx) => {
      if (tx.type === 'thu') {
        rev += tx.amount;
        tCount++;
        if (tx.paymentMethod === 'tien_mat') cIn += tx.amount;
        else bIn += tx.amount;
      } else {
        exp += tx.amount;
        cCount++;
        if (tx.paymentMethod === 'tien_mat') cOut += tx.amount;
        else bOut += tx.amount;
      }
    });

    const net = rev - exp;
    const margin = rev > 0 ? (net / rev) * 100 : 0;

    return {
      totalRevenue: rev,
      totalExpense: exp,
      profit: net,
      profitMargin: margin,
      cashIn: cIn,
      bankIn: bIn,
      cashOut: cOut,
      bankOut: bOut,
      thuCount: tCount,
      chiCount: cCount,
    };
  }, [currentMonthTransactions]);

  // 2. Student Tuition Stats for Current Month
  const tuitionStats = useMemo(() => {
    const monthStudents = students.filter((s) => s.month === currentMonth);
    const totalStudents = monthStudents.length;
    const paidList = monthStudents.filter((s) => s.isPaid);
    const unpaidList = monthStudents.filter((s) => !s.isPaid);

    const paidCount = paidList.length;
    const unpaidCount = unpaidList.length;
    const totalExpected = monthStudents.reduce((sum, s) => sum + s.total, 0);
    const totalCollected = paidList.reduce((sum, s) => sum + s.total, 0);
    const totalRemaining = totalExpected - totalCollected;
    const completionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    return {
      totalStudents,
      paidCount,
      unpaidCount,
      totalExpected,
      totalCollected,
      totalRemaining,
      completionRate,
      unpaidList: unpaidList.slice(0, 4), // show up to 4 pending students
    };
  }, [students, currentMonth]);

  // 3. Top Categories (Income & Expense)
  const { topIncomeCategories, topExpenseCategories } = useMemo(() => {
    const incMap: Record<string, { name: string; amount: number; count: number }> = {};
    const expMap: Record<string, { name: string; amount: number; count: number }> = {};

    currentMonthTransactions.forEach((tx) => {
      if (tx.type === 'thu') {
        if (!incMap[tx.categoryId]) {
          incMap[tx.categoryId] = { name: tx.categoryName, amount: 0, count: 0 };
        }
        incMap[tx.categoryId].amount += tx.amount;
        incMap[tx.categoryId].count++;
      } else {
        if (!expMap[tx.categoryId]) {
          expMap[tx.categoryId] = { name: tx.categoryName, amount: 0, count: 0 };
        }
        expMap[tx.categoryId].amount += tx.amount;
        expMap[tx.categoryId].count++;
      }
    });

    const incArr = Object.entries(incMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.amount - a.amount);

    const expArr = Object.entries(expMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.amount - a.amount);

    return {
      topIncomeCategories: incArr.slice(0, 5),
      topExpenseCategories: expArr.slice(0, 5),
    };
  }, [currentMonthTransactions]);

  // 4. Recent Transactions (latest 5)
  const recentTransactions = useMemo(() => {
    return [...currentMonthTransactions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [currentMonthTransactions]);

  // 5. 6-Month Trend Data for mini chart
  const sixMonthTrend = useMemo(() => {
    const [currYearStr, currMonthStr] = currentMonth.split('-');
    const currY = parseInt(currYearStr, 10);
    const currM = parseInt(currMonthStr, 10);

    const result = [];
    for (let i = 5; i >= 0; i--) {
      let targetM = currM - i;
      let targetY = currY;
      while (targetM <= 0) {
        targetM += 12;
        targetY -= 1;
      }
      const mKey = `${targetY}-${String(targetM).padStart(2, '0')}`;
      const label = `T${targetM}`;

      let rev = 0;
      let exp = 0;
      transactions.forEach((tx) => {
        if (tx.month === mKey) {
          if (tx.type === 'thu') rev += tx.amount;
          else exp += tx.amount;
        }
      });

      result.push({
        monthKey: mKey,
        name: label,
        fullName: `Tháng ${targetM}/${targetY}`,
        doanhThu: rev,
        chiPhi: exp,
        loiNhuan: rev - exp,
      });
    }
    return result;
  }, [transactions, currentMonth]);

  // Handle quick tuition collection
  const handleQuickPay = (studentId: string) => {
    onConfirmTuitionPayment(studentId, 'chuyen_khoan', getCurrentDateStr());
  };

  const isProfitable = profit >= 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ================= HERO BANNER ================= */}
      <div
        className={`relative overflow-hidden rounded-2xl text-white p-4 sm:p-6 shadow-md border transition-all ${
          isBusiness
            ? 'bg-gradient-to-br from-red-700 via-red-800 to-amber-900 border-red-900/30'
            : theme.heroBanner
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-xs border ${
                  isBusiness
                    ? 'bg-white/20 text-white border-white/20'
                    : `${theme.heroBadge} border`
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {isBusiness ? 'Bảng Điều Khiển Trường Học' : 'Sổ Thu Chi Gia Đình'}
              </span>
              <span className="text-xs text-amber-200/90 font-mono">
                {currentMonth}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-serif text-white">
              {isBusiness
                ? schoolConfig.schoolName || 'Trường Mầm Non Cánh Diều'
                : familyConfig?.familyName || 'Tổ Ấm Gia Đình'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-100 mt-1 max-w-2xl leading-relaxed">
              {isBusiness
                ? 'Theo dõi toàn diện tình hình tài chính, chỉ số học phí học sinh, cơ cấu thu - chi và sổ giao dịch trong tháng.'
                : 'Theo dõi chi tiêu sinh hoạt, ngân sách ăn uống, hóa đơn, con cái và tỷ lệ tích lũy gia đình với số liệu độc lập.'}
            </p>

            {/* Quick Theme Switcher on Home Banner */}
            {!isBusiness && onChangeTheme && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-white/10">
                <span className="text-[11px] font-semibold text-white/80 flex items-center gap-1 mr-1">
                  🎨 Tông màu:
                </span>
                {THEME_OPTIONS.map((opt) => {
                  const isSelected = (familyConfig?.themeColor || 'indigo') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onChangeTheme(opt.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-xs font-bold scale-105 ring-1 ring-white/70'
                          : 'bg-white/15 hover:bg-white/25 text-white/90'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs border border-white/40"
                        style={{ backgroundColor: opt.hex }}
                      />
                      <span>{opt.name.split(' (')[0]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenNewTxWithType ? onOpenNewTxWithType('thu') : onOpenNewTx()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-sm transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Ghi Khoản Thu (+)</span>
            </button>
            <button
              onClick={() => onOpenNewTxWithType ? onOpenNewTxWithType('chi') : onOpenNewTx()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-900 shadow-sm transition-all cursor-pointer"
            >
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <span>Ghi Khoản Chi (-)</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div
          className={`absolute -right-10 -bottom-10 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
            isBusiness ? 'bg-amber-500/20' : theme.heroGlow
          }`}
        />
        <div className="absolute right-1/3 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* ================= 4 CORE FINANCIAL KPI CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* CARD 1: TỔNG DOANH THU */}
        <div className={`bg-white p-3.5 sm:p-5 rounded-xl border shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
          !isBusiness ? theme.summaryCardBorder : 'border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isBusiness ? 'Tổng Thu Tháng' : 'Tổng Thu Nhập Gia Đình'}
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg xs:text-xl sm:text-2xl font-bold text-emerald-600 font-mono tabular-nums tracking-tight">
              {formatVND(totalRevenue)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
              <span>{thuCount} giao dịch</span>
              <span className="text-emerald-700 font-medium">
                {isBusiness ? 'Học phí & các khoản thu' : 'Lương, thưởng & thu phụ'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: TỔNG CHI PHÍ */}
        <div className={`bg-white p-3.5 sm:p-5 rounded-xl border shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
          !isBusiness ? theme.summaryCardBorder : 'border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isBusiness ? 'Tổng Chi Tháng' : 'Tổng Chi Tiêu Gia Đình'}
            </span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg xs:text-xl sm:text-2xl font-bold text-rose-600 font-mono tabular-nums tracking-tight">
              {formatVND(totalExpense)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
              <span>{chiCount} giao dịch</span>
              <span className="text-rose-700 font-medium">
                {isBusiness ? 'Lương, ăn, CSVC...' : 'Ăn uống, điện nước, con...'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: THẶNG DƯ (LỜI / LỖ) */}
        <div className={`bg-white p-3.5 sm:p-5 rounded-xl border shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
          !isBusiness ? theme.summaryCardBorder : 'border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isBusiness ? 'Thặng Dư Quỹ (Lời/Lỗ)' : 'Tiền Tích Lũy / Tiết Kiệm'}
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                isProfitable ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div
              className={`text-lg xs:text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${
                isProfitable ? (isBusiness ? 'text-slate-900' : theme.accentText) : 'text-rose-600'
              }`}
            >
              {formatVND(profit)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] sm:text-xs">
              <span className={isProfitable ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                {isProfitable ? (isBusiness ? 'Thặng dư an toàn' : 'Tích lũy tài chính tốt') : 'Chi vượt thu'}
              </span>
              <span className="text-slate-500">Tỷ suất: {formatPercent(profitMargin)}</span>
            </div>
          </div>
        </div>

        {/* CARD 4: TIỀN MẶT & TÀI KHOẢN */}
        <div className={`bg-white p-3.5 sm:p-5 rounded-xl border shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
          !isBusiness ? theme.summaryCardBorder : 'border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Phương Thức Dòng Tiền
            </span>
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <CreditCard className="w-3.5 h-3.5 text-sky-600" /> Chuyển khoản:
              </span>
              <span className="font-bold font-mono text-slate-800">
                {formatVND(bankIn - bankOut)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Banknote className="w-3.5 h-3.5 text-amber-600" /> Tiền mặt:
              </span>
              <span className="font-bold font-mono text-slate-800">
                {formatVND(cashIn - cashOut)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2-COLUMN SECTION: QUẢN LÝ HỌC PHÍ / CHI TIÊU GIA ĐÌNH & BIỂU ĐỒ XU HƯỚNG ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* MODULE 1: BUSINESS (HỌC PHÍ) HOẶC HOME (CHI TIÊU & TÍCH LŨY GIA ĐÌNH) (5 COLS ON DESKTOP) */}
        {isBusiness ? (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-50 text-red-700 rounded-lg">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Mục 1: Quản Lý Học Phí Học Sinh
                    </h3>
                    <p className="text-[11px] text-slate-500">Tiến độ thu học phí tháng {currentMonth}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateToTab('hoc_phi')}
                  className="text-xs font-semibold text-red-700 hover:text-red-800 inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tuition Progress & Summary Stats */}
              <div className="bg-slate-50 rounded-xl p-3.5 mb-3 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Tiến độ thanh toán:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {tuitionStats.paidCount}/{tuitionStats.totalStudents} học sinh (
                    {formatPercent(tuitionStats.completionRate)})
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, tuitionStats.completionRate)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Đã thu về</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {formatVND(tuitionStats.totalCollected)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Còn chưa nộp</span>
                    <span className="font-bold text-rose-600 font-mono">
                      {formatVND(tuitionStats.totalRemaining)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Unpaid Students List (Pending Collection) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Học sinh chưa nộp học phí ({tuitionStats.unpaidCount})
                  </span>
                </div>

                {tuitionStats.unpaidList.length === 0 ? (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-emerald-800">
                      Tất cả học sinh đã hoàn tất nộp học phí!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {tuitionStats.unpaidList.map((stu) => (
                      <div
                        key={stu.id}
                        className="p-2 sm:p-2.5 bg-white border border-slate-200/90 rounded-lg hover:border-amber-300 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {stu.studentName}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {stu.className} • Phí: {formatVND(stu.total)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickPay(stu.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors shrink-0 cursor-pointer"
                          title="Xác nhận thu tiền học phí nhanh"
                        >
                          Thu ngay
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigateToTab('hoc_phi')}
                className="w-full py-2 text-xs font-semibold text-slate-700 hover:text-red-700 bg-slate-50 hover:bg-red-50/50 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Mở Toàn Bộ Sổ Học Phí & In Phiếu Báo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* HOME MODE: KẾ HOẠCH & PHÂN BỔ CHI TIÊU GIA ĐÌNH */
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 ${theme.badgeBg} ${theme.badgeText} rounded-lg`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Mục 1: Kế Hoạch & Tích Lũy Tổ Ấm
                    </h3>
                    <p className="text-[11px] text-slate-500">Hiệu quả tài chính gia đình tháng {currentMonth}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateToTab('bang_tinh')}
                  className={`text-xs font-semibold ${theme.accentText} hover:opacity-80 inline-flex items-center gap-0.5 cursor-pointer`}
                >
                  <span>Chi tiết bảng tính</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Family Savings & Budget Progress */}
              <div className={`${theme.accentBgLight} rounded-xl p-3.5 mb-3 border ${theme.accentBorderLight} space-y-2.5`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Tỷ lệ tích lũy / Thặng dư:</span>
                  <span className={`font-bold ${theme.accentText} font-mono text-sm`}>
                    {formatPercent(profitMargin)}
                  </span>
                </div>
                {/* Savings Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      profit >= 0 ? theme.progressFill : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, profitMargin))}%`,
                    }}
                  />
                </div>
                <div className={`grid grid-cols-2 gap-2 pt-1 border-t ${theme.accentBorderLight} text-xs`}>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Thặng dư tích lũy</span>
                    <span
                      className={`font-bold font-mono ${
                        profit >= 0 ? theme.accentText : 'text-rose-600'
                      }`}
                    >
                      {formatVND(profit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Đánh giá tháng</span>
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {profit > 10000000
                        ? 'Tích lũy xuất sắc ⭐'
                        : profit >= 0
                        ? 'Chi tiêu an toàn 👍'
                        : 'Vượt ngân sách ⚠️'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Expense Categories Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    <Layers className={`w-3.5 h-3.5 ${theme.accentText}`} />
                    Các Nhóm Chi Lớn Nhất Tháng ({topExpenseCategories.length})
                  </span>
                </div>

                {topExpenseCategories.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-500">
                    Chưa có khoản chi nào được ghi nhận trong tháng này.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topExpenseCategories.slice(0, 4).map((cat) => {
                      const share = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
                      return (
                        <div
                          key={cat.id}
                          className="p-2 sm:p-2.5 bg-white border border-slate-200/90 rounded-lg hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                              {cat.name}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatVND(cat.amount)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`${theme.progressFill} h-1.5 rounded-full`}
                              style={{ width: `${Math.min(100, share)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                            <span>{cat.count} giao dịch</span>
                            <span>{formatPercent(share)} tổng chi</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigateToTab('bang_tinh')}
                className={`w-full py-2 text-xs font-semibold ${theme.accentText} ${theme.accentBgLight} ${theme.accentBorderLight} hover:opacity-90 rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Xem Bảng Phân Bổ Chi Tiêu Toàn Diện</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* MODULE 2: BIỂU ĐỒ XU HƯỚNG TÀI CHÍNH (7 COLS ON DESKTOP) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Mục 2: Xu Hướng Thu - Chi & Dòng Tiền
                  </h3>
                  <p className="text-[11px] text-slate-500">So sánh 6 tháng gần nhất</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToTab('thong_ke')}
                className="text-xs font-semibold text-red-700 hover:text-red-800 inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>Xem báo cáo 12 tháng</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-56 sm:h-64 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sixMonthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatVND(Number(value) || 0), '']}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullName || label;
                    }}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '11px',
                      border: 'none',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={32}
                    iconType="circle"
                    formatter={(value) => {
                      if (value === 'doanhThu') return <span className="text-xs text-slate-700">Doanh thu</span>;
                      if (value === 'chiPhi') return <span className="text-xs text-slate-700">Chi phí</span>;
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
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="text-slate-500">
              {isBusiness
                ? 'Tổng quan xu hướng cân đối dòng tiền trường mầm non.'
                : 'Tổng quan xu hướng cân đối ngân sách và dòng tiền tổ ấm.'}
            </div>
            <button
              onClick={() => onNavigateToTab('thong_ke')}
              className={`font-semibold ${isBusiness ? 'text-red-700 hover:text-red-800' : `${theme.accentText} hover:opacity-80`} inline-flex items-center gap-1 cursor-pointer`}
            >
              <span>Phân tích chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2-COLUMN SECTION: CƠ CẤU HẠNG MỤC & SỔ GIAO DỊCH ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* MODULE 3: CƠ CẤU HẠNG MỤC THU - CHI (6 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isBusiness ? 'bg-emerald-50 text-emerald-700' : `${theme.badgeBg} ${theme.badgeText}`}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Mục 3: Cơ Cấu Hạng Mục Thu & Chi
                  </h3>
                  <p className="text-[11px] text-slate-500">Top các khoản chi phí và nguồn thu lớn</p>
                </div>
              </div>
              <button
                onClick={onOpenCategoryManager}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer"
              >
                Quản lý hạng mục
              </button>
            </div>

            {/* Split Top Thu vs Top Chi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TOP KHOẢN THU */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <span>Top Khoản Thu</span>
                  <span>{formatVND(totalRevenue)}</span>
                </div>
                {topIncomeCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Chưa có giao dịch thu</p>
                ) : (
                  <div className="space-y-1.5">
                    {topIncomeCategories.map((cat) => {
                      const pct = totalRevenue > 0 ? (cat.amount / totalRevenue) * 100 : 0;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => onNavigateToTab('giao_dich', cat.id)}
                          className="p-2 bg-emerald-50/40 hover:bg-emerald-50 rounded-lg border border-emerald-100/80 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-slate-800 truncate">{cat.name}</span>
                            <span className="text-emerald-700 font-mono font-bold shrink-0">
                              {formatVND(cat.amount)}
                            </span>
                          </div>
                          <div className="w-full bg-emerald-200/50 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TOP KHOẢN CHI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                  <span>Top Khoản Chi</span>
                  <span>{formatVND(totalExpense)}</span>
                </div>
                {topExpenseCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Chưa có giao dịch chi</p>
                ) : (
                  <div className="space-y-1.5">
                    {topExpenseCategories.map((cat) => {
                      const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => onNavigateToTab('giao_dich', cat.id)}
                          className="p-2 bg-rose-50/40 hover:bg-rose-50 rounded-lg border border-rose-100/80 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-slate-800 truncate">{cat.name}</span>
                            <span className="text-rose-700 font-mono font-bold shrink-0">
                              {formatVND(cat.amount)}
                            </span>
                          </div>
                          <div className="w-full bg-rose-200/50 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className="bg-rose-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('bang_tinh')}
              className={`w-full py-2 text-xs font-semibold text-slate-700 ${isBusiness ? 'hover:text-red-700 hover:bg-red-50/50' : `${theme.accentText} hover:bg-slate-100`} bg-slate-50 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xem Bảng Tính Thu Chi Toàn Bộ Theo Ngày & Tháng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* MODULE 4: SỔ GIAO DỊCH GẦN ĐÂY (6 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-700 rounded-lg">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Mục 4: Giao Dịch Gần Đây Nhất
                  </h3>
                  <p className="text-[11px] text-slate-500">Các khoản thu chi vừa phát sinh</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToTab('giao_dich')}
                className={`text-xs font-semibold ${isBusiness ? 'text-red-700 hover:text-red-800' : `${theme.accentText} hover:opacity-80`} inline-flex items-center gap-0.5 cursor-pointer`}
              >
                <span>Xem sổ giao dịch</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of 5 recent transactions */}
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có giao dịch nào được ghi nhận trong tháng {currentMonth}.
              </div>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onNavigateToTab('giao_dich')}
                    className="p-2 sm:p-2.5 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          tx.type === 'thu' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tx.type === 'thu' ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {tx.categoryName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {formatDateVN(tx.date)} {tx.payerOrReceiver ? `• ${tx.payerOrReceiver}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs sm:text-sm font-bold font-mono ${
                          tx.type === 'thu' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'thu' ? '+' : '-'}{formatVND(tx.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {tx.paymentMethod === 'tien_mat' ? 'Tiền mặt' : 'CK'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('giao_dich')}
              className={`w-full py-2 text-xs font-semibold text-slate-700 ${isBusiness ? 'hover:text-red-700 hover:bg-red-50/50' : `${theme.accentText} hover:bg-slate-100`} bg-slate-50 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Mở Sổ Giao Dịch & Tìm Kiếm Chi Tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODULE 5: TIỆN ÍCH & THAO TÁC NHANH (QUICK HUB) ================= */}
      <div className="bg-slate-100/80 rounded-2xl p-4 sm:p-5 border border-slate-200">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
          Mục 5: Tiện Ích & Thao Tác Nhanh Toàn Hệ Thống
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Print/PDF */}
          <button
            onClick={onPrintMonthReport}
            className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-left transition-all hover:shadow-2xs cursor-pointer flex flex-col justify-between"
          >
            <Printer className="w-4 h-4 text-slate-600 mb-1.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">In & Tải PDF Báo Cáo</div>
              <div className="text-[10px] text-slate-500">Xuất file PDF hoặc in phiếu trực tiếp</div>
            </div>
          </button>

          {/* Export All Excel */}
          <button
            onClick={onExportCSV}
            className="p-3 bg-white hover:bg-emerald-50/60 rounded-xl border border-emerald-200 text-left transition-all hover:shadow-2xs cursor-pointer flex flex-col justify-between"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 mb-1.5" />
            <div>
              <div className="text-xs font-bold text-emerald-950">Báo Cáo Excel Toàn Bộ</div>
              <div className="text-[10px] text-emerald-700">Tệp .xlsx gồm 2 Sheet Tổng hợp & Chi tiết</div>
            </div>
          </button>

          {/* Export Thu Only */}
          {onExportExcel && (
            <button
              onClick={() => onExportExcel('thu')}
              className="p-3 bg-white hover:bg-emerald-50/60 rounded-xl border border-emerald-200 text-left transition-all hover:shadow-2xs cursor-pointer flex flex-col justify-between"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600 mb-1.5" />
              <div>
                <div className="text-xs font-bold text-emerald-900">Chỉ Xuất Khoản Thu (.xlsx)</div>
                <div className="text-[10px] text-emerald-700">Tải riêng các khoản tiền vào trường</div>
              </div>
            </button>
          )}

          {/* Export Chi Only */}
          {onExportExcel && (
            <button
              onClick={() => onExportExcel('chi')}
              className="p-3 bg-white hover:bg-rose-50/60 rounded-xl border border-rose-200 text-left transition-all hover:shadow-2xs cursor-pointer flex flex-col justify-between"
            >
              <ArrowDownRight className="w-4 h-4 text-rose-600 mb-1.5" />
              <div>
                <div className="text-xs font-bold text-rose-900">Chỉ Xuất Khoản Chi (.xlsx)</div>
                <div className="text-[10px] text-rose-700">Tải riêng các khoản chi phí, mua sắm</div>
              </div>
            </button>
          )}

          {/* Import Thu Only */}
          {onOpenImportExcel && (
            <button
              onClick={() => onOpenImportExcel('thu')}
              className="p-3 bg-white hover:bg-emerald-50/70 rounded-xl border border-emerald-300 text-left transition-all hover:shadow-2xs cursor-pointer flex flex-col justify-between"
            >
              <Upload className="w-4 h-4 text-emerald-700 mb-1.5" />
              <div>
                <div className="text-xs font-bold text-emerald-950">Nhập Khoản Thu Từ Excel</div>
                <div className="text-[10px] text-emerald-700">File học phí, tiền ăn, phụ thu</div>
              </div>
            </button>
          )}

          {/* Import Chi Only */}
          {onOpenImportExcel && (
            <button
              onClick={() => onOpenImportExcel('chi')}
              className="p-3 bg-white hover:bg-rose-50/70 rounded-xl border border-rose-300 text-left transition-all hover:shadow-2xs cursor-pointer flex flex-col justify-between"
            >
              <Upload className="w-4 h-4 text-rose-700 mb-1.5" />
              <div>
                <div className="text-xs font-bold text-rose-950">Nhập Khoản Chi Từ Excel</div>
                <div className="text-[10px] text-rose-700">File thực phẩm, cơ sở vật chất, hóa đơn</div>
              </div>
            </button>
          )}

          {/* Import All */}
          {onOpenImportExcel && (
            <button
              onClick={() => onOpenImportExcel('all')}
              className="p-3 bg-white hover:bg-amber-50/60 rounded-xl border border-amber-200 text-left transition-all hover:shadow-2xs cursor-pointer flex flex-col justify-between"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-700 mb-1.5" />
              <div>
                <div className="text-xs font-bold text-amber-950">Nhập Cả Thu & Chi</div>
                <div className="text-[10px] text-amber-700">File tổng hợp đầy đủ 2 loại giao dịch</div>
              </div>
            </button>
          )}

          {/* Category Management */}
          <button
            onClick={onOpenCategoryManager}
            className="p-3 bg-white hover:bg-orange-50/60 rounded-xl border border-orange-200 text-left transition-all hover:shadow-2xs cursor-pointer flex flex-col justify-between"
          >
            <Layers className="w-4 h-4 text-orange-700 mb-1.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">Danh Mục Thu / Chi</div>
              <div className="text-[10px] text-slate-500">Thêm, sửa, xóa các hạng mục</div>
            </div>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-left transition-all hover:shadow-2xs cursor-pointer flex flex-col justify-between"
          >
            <Sparkles className="w-4 h-4 text-red-600 mb-1.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">Cài Đặt & Sao Lưu</div>
              <div className="text-[10px] text-slate-500">Tên trường, thủ quỹ, sao lưu dữ liệu</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
