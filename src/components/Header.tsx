import React, { useState, useRef, useEffect } from 'react';
import {
  PlusCircle,
  FileSpreadsheet,
  Settings,
  Printer,
  Table,
  ListOrdered,
  GraduationCap,
  BarChart3,
  ArrowLeft,
  Settings2,
  LayoutDashboard,
  Building2,
  Home,
  Palette,
} from 'lucide-react';
import { SchoolConfig, FamilyConfig, AppMode, HomeThemeColor } from '../types/finance';
import { KiteLogo } from './KiteLogo';
import { getThemeConfig, THEME_OPTIONS } from '../utils/themeConfig';

export type TabType = 'dashboard' | 'bang_tinh' | 'giao_dich' | 'hoc_phi' | 'thong_ke';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  mode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
  onOpenNewTx: () => void;
  onOpenSettings: () => void;
  onExportCSV: () => void;
  onPrintMonthReport: () => void;
  onOpenCategoryManager: () => void;
  schoolConfig: SchoolConfig;
  familyConfig: FamilyConfig;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onChangeTheme?: (theme: HomeThemeColor) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  mode,
  onSwitchMode,
  onOpenNewTx,
  onOpenSettings,
  onExportCSV,
  onPrintMonthReport,
  onOpenCategoryManager,
  schoolConfig,
  familyConfig,
  canGoBack,
  onGoBack,
  onChangeTheme,
}) => {
  const isBusiness = mode === 'business';
  const theme = getThemeConfig(familyConfig?.themeColor);

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* ================= TOP HEADER (DESKTOP & MOBILE COMPACT) ================= */}
      <header
        className={`bg-white sticky top-0 z-30 shadow-2xs print:hidden transition-colors ${
          isBusiness ? 'border-b border-orange-100/90' : theme.headerBorder
        }`}
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Zone 1: Brand & Logo with Back Button */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 pr-1">
              {canGoBack && onGoBack && (
                <button
                  onClick={onGoBack}
                  title="Quay lại thao tác trước"
                  className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden xs:inline">Quay lại</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-left group cursor-pointer focus:outline-hidden flex items-center gap-2 min-w-0"
              >
                {/* Dynamic Brand Logo */}
                {isBusiness ? (
                  <KiteLogo size={36} className="shrink-0" />
                ) : (
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0 ${theme.headerLogoBg} ${theme.headerLogoRing}`}
                  >
                    <Home className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <div
                    className={`text-sm sm:text-base md:text-lg font-bold tracking-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-md font-serif ${
                      isBusiness ? 'text-red-700' : theme.headerBrandTitle
                    }`}
                  >
                    {isBusiness
                      ? schoolConfig.schoolName || 'Mẫu Giáo Cánh Diều'
                      : familyConfig.familyName || 'Tổ Ấm Gia Đình'}
                  </div>
                  <div
                    className={`text-[10px] font-medium tracking-wider uppercase truncate hidden sm:block ${
                      isBusiness ? 'text-amber-700' : theme.headerBrandSub
                    }`}
                  >
                    {isBusiness
                      ? schoolConfig.branchName || 'Luyện nhân cách ươm mầm tài năng'
                      : familyConfig.subTitle || 'Sổ Thu Chi & Kế Hoạch Tài Chính'}
                  </div>
                </div>
              </button>
            </div>

            {/* Mode Switcher Pill (Interactive Tab Switcher between Business & Home) */}
            <div className="flex items-center p-0.5 sm:p-1 bg-slate-100/90 rounded-xl border border-slate-200/90 shadow-2xs shrink-0">
              <button
                onClick={() => onSwitchMode('business')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isBusiness
                    ? 'bg-white text-red-700 shadow-2xs ring-1 ring-slate-900/5'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Chế độ Quản lý Thu Chi & Học Phí Trường Học (Business)"
              >
                <Building2 className={`w-3.5 h-3.5 ${isBusiness ? 'text-red-600' : 'text-slate-400'}`} />
                <span className="hidden xs:inline">Trường Học</span>
                <span className="xs:hidden">Trường</span>
              </button>
              <button
                onClick={() => onSwitchMode('home')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isBusiness
                    ? theme.modeActiveBtn
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Chế độ Sổ Thu Chi Gia Đình (Home)"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Gia Đình</span>
                <span className="xs:hidden">Gia đình</span>
              </button>
            </div>

            {/* Zone 2: Navigation Links (Desktop / MacBook only) */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'dashboard'
                    ? isBusiness
                      ? 'bg-red-700 text-white shadow-2xs font-semibold'
                      : theme.activeNavTab
                    : isBusiness
                    ? 'text-slate-600 hover:text-red-700 hover:bg-orange-50/60'
                    : theme.inactiveNavHover
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Tổng Quan</span>
              </button>

              <button
                onClick={() => setActiveTab('bang_tinh')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'bang_tinh'
                    ? isBusiness
                      ? 'bg-red-700 text-white shadow-2xs font-semibold'
                      : theme.activeNavTab
                    : isBusiness
                    ? 'text-slate-600 hover:text-red-700 hover:bg-orange-50/60'
                    : theme.inactiveNavHover
                }`}
              >
                Bảng Thu Chi Tháng
              </button>

              <button
                onClick={() => setActiveTab('giao_dich')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'giao_dich'
                    ? isBusiness
                      ? 'bg-red-700 text-white shadow-2xs font-semibold'
                      : theme.activeNavTab
                    : isBusiness
                    ? 'text-slate-600 hover:text-red-700 hover:bg-orange-50/60'
                    : theme.inactiveNavHover
                }`}
              >
                Sổ Giao Dịch
              </button>

              {/* School Tuition Tab only for Business mode */}
              {isBusiness && (
                <button
                  onClick={() => setActiveTab('hoc_phi')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'hoc_phi'
                      ? 'bg-red-700 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-red-700 hover:bg-orange-50/60'
                  }`}
                >
                  Quản Lý Học Phí
                </button>
              )}

              <button
                onClick={() => setActiveTab('thong_ke')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'thong_ke'
                    ? isBusiness
                      ? 'bg-red-700 text-white shadow-2xs font-semibold'
                      : theme.activeNavTab
                    : isBusiness
                    ? 'text-slate-600 hover:text-red-700 hover:bg-orange-50/60'
                    : theme.inactiveNavHover
                }`}
              >
                Thống Kê 12 Tháng
              </button>
            </nav>

            {/* Zone 3: Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Color Theme Selector Popover for Home Mode */}
              {!isBusiness && onChangeTheme && (
                <div className="relative" ref={themeMenuRef}>
                  <button
                    onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                    title="Đổi tông màu phong cách sổ Gia Đình"
                    className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white shadow-2xs text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" style={{ color: theme.hex }} />
                    <span className="hidden lg:inline">{theme.shortName}</span>
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs border border-white"
                      style={{ backgroundColor: theme.hex }}
                    />
                  </button>

                  {isThemeMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in duration-100">
                      <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
                        <span>Tông màu sổ Gia Đình</span>
                        <span className="text-[10px] font-medium text-slate-400">5 Style</span>
                      </div>
                      <div className="space-y-1">
                        {THEME_OPTIONS.map((opt) => {
                          const isSelected = (familyConfig?.themeColor || 'indigo') === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => {
                                onChangeTheme(opt.id);
                                setIsThemeMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-100 font-bold text-slate-900'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-4 h-4 rounded-full shrink-0 border border-black/10 shadow-2xs"
                                  style={{ backgroundColor: opt.hex }}
                                />
                                <span>{opt.name}</span>
                              </div>
                              {isSelected && <span className="text-xs font-bold">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Category Manager button */}
              <button
                onClick={onOpenCategoryManager}
                title="Quản lý danh mục (Thêm, Sửa, Xóa)"
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Settings2 className={`w-3.5 h-3.5 ${isBusiness ? 'text-amber-600' : theme.accentText}`} />
                <span>Danh Mục Thu/Chi</span>
              </button>

              {/* Desktop print / PDF button */}
              <button
                onClick={onPrintMonthReport}
                title="In hoặc tải tệp PDF báo cáo thu chi tháng"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>In / Tải PDF</span>
              </button>

              {/* Desktop export CSV */}
              <button
                onClick={onExportCSV}
                title="Xuất file Excel / CSV"
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  isBusiness
                    ? 'text-amber-900 bg-amber-50 border-amber-200 hover:bg-amber-100'
                    : `${theme.accentText} ${theme.accentBgLight} ${theme.accentBorderLight} hover:opacity-90`
                }`}
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 ${isBusiness ? 'text-amber-700' : theme.accentText}`} />
                <span className="hidden md:inline">Xuất Excel</span>
              </button>

              {/* Primary Action Button (+) */}
              <button
                onClick={onOpenNewTx}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  isBusiness
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                    : theme.heroButtonPrimary
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden xs:inline">Thêm Thu / Chi</span>
                <span className="xs:hidden">Thêm</span>
              </button>

              {/* Settings button */}
              <button
                onClick={onOpenSettings}
                title={isBusiness ? 'Cài đặt thông tin trường & Dữ liệu' : 'Cài đặt thông tin gia đình & Dữ liệu'}
                className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM TAB BAR ================= */}
      <nav
        aria-label="Điều hướng chính trên điện thoại"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-1 pb-safe print:hidden"
      >
        <div
          className={`grid items-center h-15 max-w-md mx-auto ${
            isBusiness ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
          {/* Tab 0: Tổng Quan (Dashboard) */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? isBusiness
                  ? 'text-red-600 font-bold'
                  : `${theme.accentText} font-bold`
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">Tổng Quan</span>
          </button>

          {/* Tab 1: Bảng Tính */}
          <button
            onClick={() => setActiveTab('bang_tinh')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'bang_tinh'
                ? isBusiness
                  ? 'text-red-600 font-bold'
                  : `${theme.accentText} font-bold`
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">Bảng Tính</span>
          </button>

          {/* Tab 2: Sổ Giao Dịch */}
          <button
            onClick={() => setActiveTab('giao_dich')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'giao_dich'
                ? isBusiness
                  ? 'text-red-600 font-bold'
                  : `${theme.accentText} font-bold`
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListOrdered className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">Giao Dịch</span>
          </button>

          {/* Tab 3: Học Phí (Chỉ hiển thị ở chế độ Trường Học) */}
          {isBusiness && (
            <button
              onClick={() => setActiveTab('hoc_phi')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                activeTab === 'hoc_phi' ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">Học Phí</span>
            </button>
          )}

          {/* Tab 4: Thống Kê */}
          <button
            onClick={() => setActiveTab('thong_ke')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'thong_ke'
                ? isBusiness
                  ? 'text-red-600 font-bold'
                  : `${theme.accentText} font-bold`
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">Thống Kê</span>
          </button>
        </div>
      </nav>
    </>
  );
};
