import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  LayoutList,
  TableProperties,
  Settings2,
  Edit2,
  Trash2,
  FolderPlus,
  FileSpreadsheet,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Transaction, CategoryItem, TransactionType, AppMode, HomeThemeColor } from '../types/finance';
import { formatVND, formatPercent } from '../utils/formatters';
import { getThemeConfig } from '../utils/themeConfig';

interface SpreadsheetViewProps {
  transactions: Transaction[];
  categories: CategoryItem[];
  onOpenNewTxWithCategory: (category: CategoryItem) => void;
  onFilterByCategory: (categoryId: string) => void;
  onOpenCategoryManager: () => void;
  onOpenAddCategoryModal: (type: TransactionType) => void;
  onOpenEditCategoryModal: (category: CategoryItem) => void;
  onDeleteCategory: (categoryId: string) => void;
  onExportExcel?: (type?: 'all' | 'thu' | 'chi') => void;
  onOpenImportExcel?: (type?: 'all' | 'thu' | 'chi') => void;
  mode?: AppMode;
  themeColor?: HomeThemeColor;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  transactions,
  categories,
  onOpenNewTxWithCategory,
  onFilterByCategory,
  onOpenCategoryManager,
  onOpenAddCategoryModal,
  onOpenEditCategoryModal,
  onDeleteCategory,
  onExportExcel,
  onOpenImportExcel,
  mode = 'business',
  themeColor,
}) => {
  const isBusiness = mode === 'business';
  const theme = getThemeConfig(themeColor);
  const [expandedSection, setExpandedSection] = useState<{ income: boolean; expense: boolean }>({
    income: true,
    expense: true,
  });

  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'table'>('list');

  // Dropdown states for top bar
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (importMenuRef.current && !importMenuRef.current.contains(e.target as Node)) {
        setIsImportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const incomeCategories = categories.filter((c) => c.type === 'thu');
  const expenseCategories = categories.filter((c) => c.type === 'chi');

  // Calculate totals by category
  const categoryMap: Record<string, { total: number; count: number; txs: Transaction[] }> = {};
  let totalRevenue = 0;
  let totalExpense = 0;

  transactions.forEach((tx) => {
    if (!categoryMap[tx.categoryId]) {
      categoryMap[tx.categoryId] = { total: 0, count: 0, txs: [] };
    }
    categoryMap[tx.categoryId].total += tx.amount;
    categoryMap[tx.categoryId].count += 1;
    categoryMap[tx.categoryId].txs.push(tx);

    if (tx.type === 'thu') {
      totalRevenue += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  });

  const profit = totalRevenue - totalExpense;
  const isProfitable = profit >= 0;
  const marginPercent = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  const handleDeletePrompt = (cat: CategoryItem) => {
    const data = categoryMap[cat.id];
    const count = data?.count || 0;
    const msg =
      count > 0
        ? `Hạng mục "${cat.name}" đang có ${count} giao dịch trong sổ thu chi.\n\nBạn có chắc chắn muốn xóa hạng mục này?`
        : `Bạn có chắc muốn xóa hạng mục "${cat.name}"?`;

    if (window.confirm(msg)) {
      onDeleteCategory(cat.id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Top Banner / Table Header */}
      <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/70">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
            <span>{isBusiness ? 'Bảng Kê Chi Tiết Thu Chi & Doanh Thu' : 'Bảng Kê Chi Tiết Thu Chi Gia Đình'}</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            {isBusiness
              ? 'Bảng thu chi chuẩn trường mầm non — có thể Thêm, Sửa tên, Xóa bất kỳ hạng mục nào'
              : 'Sổ thu chi tài chính tổ ấm — có thể Thêm, Sửa tên, Xóa bất kỳ hạng mục nào'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel Dropdown */}
          {onExportExcel && (
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsExportMenuOpen(!isExportMenuOpen);
                  setIsImportMenuOpen(false);
                }}
                title="Tùy chọn xuất bảng thu chi sang Excel"
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs ${
                  isBusiness
                    ? 'text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50'
                    : `${theme.accentText} bg-white border ${theme.accentBorderLight} hover:bg-slate-50`
                }`}
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 ${isBusiness ? 'text-emerald-700' : theme.accentText}`} />
                <span>Xuất Excel</span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 sm:left-0 sm:right-auto mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Xuất File Excel
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportExcel('all');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50/70 text-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-medium">Xuất Báo Cáo Toàn Bộ</span>
                    <span className="text-[10px] text-slate-500 font-mono">2 Sheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportExcel('thu');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50/70 text-emerald-900 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Chỉ xuất Khoản Thu (.xlsx)</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportExcel('chi');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-rose-50/70 text-rose-900 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                      <span>Chỉ xuất Khoản Chi (.xlsx)</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Import Excel Dropdown */}
          {onOpenImportExcel && (
            <div className="relative" ref={importMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsImportMenuOpen(!isImportMenuOpen);
                  setIsExportMenuOpen(false);
                }}
                title="Tùy chọn nhập giao dịch từ file Excel"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-amber-700" />
                <span>Nhập Excel</span>
                <ChevronDown className="w-3 h-3 text-amber-600" />
              </button>

              {isImportMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Chọn loại nhập Excel
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsImportMenuOpen(false);
                      onOpenImportExcel('thu');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-emerald-900 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-semibold">Nhập Khoản Thu riêng</div>
                      <div className="text-[10px] text-slate-500">File học phí, tiền ăn, phụ thu</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsImportMenuOpen(false);
                      onOpenImportExcel('chi');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-900 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <div>
                      <div className="font-semibold">Nhập Khoản Chi riêng</div>
                      <div className="text-[10px] text-slate-500">File thực phẩm, CSVC, hóa đơn</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsImportMenuOpen(false);
                      onOpenImportExcel('all');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-amber-50 text-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <div>
                      <div className="font-medium">Nhập Cả Thu & Chi</div>
                      <div className="text-[10px] text-slate-500">File tổng hợp đầy đủ 2 loại</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Category Management Button */}
          <button
            onClick={onOpenCategoryManager}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Settings2 className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Quản Lý Hạng Mục</span>
            <span className="sm:hidden">Hạng Mục</span>
          </button>

          {/* View Toggle on Mobile */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg md:hidden">
            <button
              onClick={() => setMobileViewMode('list')}
              className={`px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                mobileViewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Thẻ</span>
            </button>
            <button
              onClick={() => setMobileViewMode('table')}
              className={`px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                mobileViewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Bảng</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MOBILE TOUCH LIST VIEW (Optimized for Phones)                          */}
      {/* ========================================================================= */}
      <div className={`${mobileViewMode === 'list' ? 'block md:hidden' : 'hidden'} divide-y divide-slate-100`}>
        {/* SECTION 1: DOANH THU (THU) - MOBILE */}
        <div className="bg-emerald-50/70 border-b border-emerald-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpandedSection((prev) => ({ ...prev, income: !prev.income }))}
              className="flex items-center gap-2 text-left cursor-pointer flex-1"
            >
              {expandedSection.income ? (
                <ChevronDown className="w-4 h-4 text-emerald-800" />
              ) : (
                <ChevronRight className="w-4 h-4 text-emerald-800" />
              )}
              <span className="font-bold text-emerald-950 text-sm tracking-wide">
                DOANH THU (THU) ({incomeCategories.length} MỤC)
              </span>
            </button>
            <div className="text-right flex items-center gap-1.5">
              <span className="font-bold text-emerald-800 font-mono tabular-nums text-sm sm:text-base">
                {formatVND(totalRevenue)}
              </span>
              {onExportExcel && (
                <button
                  onClick={() => onExportExcel('thu')}
                  title="Xuất riêng Khoản Thu sang Excel .xlsx"
                  className="p-1 bg-white text-emerald-800 border border-emerald-300 rounded-md hover:bg-emerald-50 cursor-pointer text-xs flex items-center"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                </button>
              )}
              {onOpenImportExcel && (
                <button
                  onClick={() => onOpenImportExcel('thu')}
                  title="Nhập riêng Khoản Thu từ file Excel"
                  className="p-1 bg-white text-emerald-800 border border-emerald-300 rounded-md hover:bg-emerald-50 cursor-pointer text-xs flex items-center"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                </button>
              )}
              <button
                onClick={() => onOpenAddCategoryModal('thu')}
                title="Thêm hạng mục thu mới"
                className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer text-xs flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {expandedSection.income && (
          <div className="divide-y divide-slate-100">
            {incomeCategories.map((cat, idx) => {
              const data = categoryMap[cat.id] || { total: 0, count: 0, txs: [] };
              const sharePercent = totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0;

              return (
                <div
                  key={cat.id}
                  className="p-3 sm:p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                >
                  <div
                    onClick={() => onFilterByCategory(cat.id)}
                    className="flex-1 min-w-0 cursor-pointer pr-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                      <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                        {cat.name}
                      </span>
                      {data.count > 0 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                          {data.count} GD
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{cat.group || 'Chung'}</span>
                      <span>·</span>
                      <span>{sharePercent.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Actions on Category */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="text-right mr-1">
                      <div className="font-bold font-mono text-emerald-700 text-xs sm:text-sm">
                        {formatVND(data.total)}
                      </div>
                    </div>
                    {/* Sửa hạng mục */}
                    <button
                      onClick={() => onOpenEditCategoryModal(cat)}
                      title="Sửa tên hạng mục"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Xóa hạng mục */}
                    <button
                      onClick={() => handleDeletePrompt(cat)}
                      title="Xóa hạng mục"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Thêm số tiền thu */}
                    <button
                      onClick={() => onOpenNewTxWithCategory(cat)}
                      title={`Ghi khoản thu ${cat.name}`}
                      className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Direct Add Income Category Button */}
            <div className="p-3 bg-emerald-50/40 text-center">
              <button
                onClick={() => onOpenAddCategoryModal('thu')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-50 px-3 py-1.5 rounded-lg shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Thêm Hạng Mục Thu Mới</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: CHI PHÍ - MOBILE */}
        <div className="bg-indigo-50/70 border-y border-indigo-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpandedSection((prev) => ({ ...prev, expense: !prev.expense }))}
              className="flex items-center gap-2 text-left cursor-pointer flex-1"
            >
              {expandedSection.expense ? (
                <ChevronDown className="w-4 h-4 text-indigo-800" />
              ) : (
                <ChevronRight className="w-4 h-4 text-indigo-800" />
              )}
              <span className="font-bold text-indigo-950 text-sm tracking-wide">
                CHI PHÍ ({expenseCategories.length} MỤC)
              </span>
            </button>
            <div className="text-right flex items-center gap-1.5">
              <span className="font-bold text-rose-700 font-mono tabular-nums text-sm sm:text-base">
                {formatVND(totalExpense)}
              </span>
              {onExportExcel && (
                <button
                  onClick={() => onExportExcel('chi')}
                  title="Xuất riêng Khoản Chi sang Excel .xlsx"
                  className="p-1 bg-white text-rose-800 border border-rose-300 rounded-md hover:bg-rose-50 cursor-pointer text-xs flex items-center"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-rose-700" />
                </button>
              )}
              {onOpenImportExcel && (
                <button
                  onClick={() => onOpenImportExcel('chi')}
                  title="Nhập riêng Khoản Chi từ file Excel"
                  className="p-1 bg-white text-rose-800 border border-rose-300 rounded-md hover:bg-rose-50 cursor-pointer text-xs flex items-center"
                >
                  <Upload className="w-3.5 h-3.5 text-rose-700" />
                </button>
              )}
              <button
                onClick={() => onOpenAddCategoryModal('chi')}
                title="Thêm hạng mục chi mới"
                className="p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer text-xs flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {expandedSection.expense && (
          <div className="divide-y divide-slate-100">
            {expenseCategories.map((cat, idx) => {
              const data = categoryMap[cat.id] || { total: 0, count: 0, txs: [] };
              const sharePercent = totalExpense > 0 ? (data.total / totalExpense) * 100 : 0;

              return (
                <div
                  key={cat.id}
                  className="p-3 sm:p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                >
                  <div
                    onClick={() => onFilterByCategory(cat.id)}
                    className="flex-1 min-w-0 cursor-pointer pr-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                      <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                        {cat.name}
                      </span>
                      {data.count > 0 && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                          {data.count} GD
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{cat.group || 'Chung'}</span>
                      <span>·</span>
                      <span>{sharePercent.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Actions on Category */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="text-right mr-1">
                      <div className="font-bold font-mono text-rose-600 text-xs sm:text-sm">
                        {formatVND(data.total)}
                      </div>
                    </div>
                    {/* Sửa hạng mục */}
                    <button
                      onClick={() => onOpenEditCategoryModal(cat)}
                      title="Sửa tên hạng mục"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Xóa hạng mục */}
                    <button
                      onClick={() => handleDeletePrompt(cat)}
                      title="Xóa hạng mục"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Thêm số tiền chi */}
                    <button
                      onClick={() => onOpenNewTxWithCategory(cat)}
                      title={`Ghi khoản chi ${cat.name}`}
                      className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Direct Add Expense Category Button */}
            <div className="p-3 bg-rose-50/40 text-center">
              <button
                onClick={() => onOpenAddCategoryModal('chi')}
                className="text-xs font-semibold text-rose-800 hover:text-rose-900 bg-white border border-rose-300 hover:bg-rose-50 px-3 py-1.5 rounded-lg shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-rose-600" />
                <span>+ Thêm Hạng Mục Chi Mới</span>
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM SUMMARY: LỜI / LỖ & % ON REV - MOBILE */}
        <div className="p-4 bg-amber-50/70 border-t-2 border-amber-300">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 uppercase text-xs sm:text-sm">
              LỜI / LỖ (THẶNG DƯ)
            </span>
            <span
              className={`font-mono tabular-nums font-extrabold text-base sm:text-lg ${
                isProfitable ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatVND(profit)}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200 text-xs">
            <span className="text-slate-600 uppercase font-medium">
              % ON REV (TỶ SUẤT LN / DOANH THU)
            </span>
            <span
              className={`font-mono tabular-nums font-bold text-sm ${
                isProfitable ? 'text-sky-700' : 'text-rose-600'
              }`}
            >
              {formatPercent(marginPercent)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FULL DESKTOP SPREADSHEET TABLE                                         */}
      {/* ========================================================================= */}
      <div className={`${mobileViewMode === 'table' ? 'block' : 'hidden md:block'} overflow-x-auto`}>
        <table className="w-full text-left border-collapse text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600 bg-slate-100/70 uppercase tracking-wider">
              <th className="py-2.5 px-3 sm:px-4 w-12 text-center">STT</th>
              <th className="py-2.5 px-3 sm:px-4 min-w-[200px]">Hạng Mục Thu / Chi</th>
              <th className="py-2.5 px-3 sm:px-4 hidden sm:table-cell min-w-[130px]">Phân Nhóm</th>
              <th className="py-2.5 px-3 sm:px-4 text-center hidden md:table-cell w-20">Số GD</th>
              <th className="py-2.5 px-3 sm:px-4 text-right min-w-[140px]">Số Tiền (VNĐ)</th>
              <th className="py-2.5 px-3 sm:px-4 text-right w-24">% Tỷ Trọng</th>
              <th className="py-2.5 px-3 text-center w-28">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* DOANH THU HEADER */}
            <tr className="bg-emerald-100/80 border-y border-emerald-300 font-bold text-emerald-950">
              <td colSpan={2} className="py-2.5 px-3 sm:px-4">
                <button
                  onClick={() =>
                    setExpandedSection((prev) => ({ ...prev, income: !prev.income }))
                  }
                  className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {expandedSection.income ? (
                    <ChevronDown className="w-4 h-4 text-emerald-800" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-emerald-800" />
                  )}
                  <span className="tracking-wide">DOANH THU (THU)</span>
                </button>
              </td>
              <td className="py-2.5 px-3 sm:px-4 hidden sm:table-cell text-xs text-emerald-800 font-medium">
                Học phí & các khoản thu
              </td>
              <td className="py-2.5 px-3 sm:px-4 text-center hidden md:table-cell text-emerald-800 text-xs font-mono">
                {incomeCategories.reduce(
                  (sum, cat) => sum + (categoryMap[cat.id]?.count || 0),
                  0
                )}
              </td>
              <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums text-emerald-800 font-bold text-base">
                {formatVND(totalRevenue)}
              </td>
              <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums text-emerald-800 text-xs font-semibold">
                100%
              </td>
              <td className="py-2.5 px-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onOpenAddCategoryModal('thu')}
                    title="Thêm hạng mục thu mới"
                    className="px-2 py-0.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium cursor-pointer"
                  >
                    + Mục
                  </button>
                  {onExportExcel && (
                    <button
                      onClick={() => onExportExcel('thu')}
                      title="Xuất riêng Khoản Thu sang Excel .xlsx"
                      className="p-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
                      <span className="text-[10px]">Xuất</span>
                    </button>
                  )}
                  {onOpenImportExcel && (
                    <button
                      onClick={() => onOpenImportExcel('thu')}
                      title="Nhập file Excel chỉ gồm các khoản Thu"
                      className="p-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Upload className="w-3 h-3 text-emerald-700" />
                      <span className="text-[10px]">Nhập</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>

            {expandedSection.income &&
              incomeCategories.map((cat, idx) => {
                const data = categoryMap[cat.id] || { total: 0, count: 0, txs: [] };
                const sharePercent = totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0;

                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-emerald-50/40 transition-colors group text-slate-800"
                  >
                    <td className="py-2.5 px-3 sm:px-4 text-center font-mono text-xs text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4">
                      <button
                        onClick={() => onFilterByCategory(cat.id)}
                        className="font-medium text-slate-900 hover:text-emerald-700 text-left flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{cat.name}</span>
                        {data.count > 0 && (
                          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 hidden sm:table-cell text-xs text-slate-500">
                      {cat.group || 'Chung'}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-center hidden md:table-cell font-mono text-xs text-slate-500">
                      {data.count > 0 ? (
                        <span className="font-semibold text-slate-700">{data.count}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {data.total > 0 ? (
                        <span className="text-emerald-700">{formatVND(data.total)}</span>
                      ) : (
                        <span className="text-slate-300">0 ₫</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums text-xs text-slate-600">
                      {data.total > 0 ? `${sharePercent.toFixed(1)}%` : '0%'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenNewTxWithCategory(cat)}
                          title={`Ghi khoản thu ${cat.name}`}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenEditCategoryModal(cat)}
                          title={`Sửa tên hạng mục "${cat.name}"`}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(cat)}
                          title={`Xóa hạng mục "${cat.name}"`}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {/* Income Add Row */}
            {expandedSection.income && (
              <tr className="bg-emerald-50/20 hover:bg-emerald-50/40">
                <td colSpan={7} className="py-2 px-4 text-center">
                  <button
                    onClick={() => onOpenAddCategoryModal('thu')}
                    className="text-xs font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Thêm Hạng Mục Thu Mới</span>
                  </button>
                </td>
              </tr>
            )}

            {/* CHI PHÍ HEADER */}
            <tr className="bg-indigo-100/80 border-y border-indigo-200 font-bold text-indigo-950">
              <td colSpan={2} className="py-2.5 px-3 sm:px-4">
                <button
                  onClick={() =>
                    setExpandedSection((prev) => ({ ...prev, expense: !prev.expense }))
                  }
                  className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {expandedSection.expense ? (
                    <ChevronDown className="w-4 h-4 text-indigo-800" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-indigo-800" />
                  )}
                  <span className="tracking-wide">CHI PHÍ</span>
                </button>
              </td>
              <td className="py-2.5 px-3 sm:px-4 hidden sm:table-cell text-xs text-indigo-800 font-medium">
                Vận hành, nhân sự, cơ sở vật chất
              </td>
              <td className="py-2.5 px-3 sm:px-4 text-center hidden md:table-cell text-indigo-800 text-xs font-mono">
                {expenseCategories.reduce(
                  (sum, cat) => sum + (categoryMap[cat.id]?.count || 0),
                  0
                )}
              </td>
              <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums text-rose-700 font-bold text-base">
                {formatVND(totalExpense)}
              </td>
              <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums text-indigo-800 text-xs font-semibold">
                100%
              </td>
              <td className="py-2.5 px-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onOpenAddCategoryModal('chi')}
                    title="Thêm hạng mục chi mới"
                    className="px-2 py-0.5 text-xs bg-rose-700 hover:bg-rose-800 text-white rounded font-medium cursor-pointer"
                  >
                    + Mục
                  </button>
                  {onExportExcel && (
                    <button
                      onClick={() => onExportExcel('chi')}
                      title="Chỉ xuất các khoản Chi ra file Excel .xlsx"
                      className="p-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-rose-700" />
                      <span className="text-[10px]">Xuất</span>
                    </button>
                  )}
                  {onOpenImportExcel && (
                    <button
                      onClick={() => onOpenImportExcel('chi')}
                      title="Nhập file Excel chỉ gồm các khoản Chi"
                      className="p-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-rose-700" />
                      <span className="text-[10px]">Nhập</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>

            {expandedSection.expense &&
              expenseCategories.map((cat, idx) => {
                const data = categoryMap[cat.id] || { total: 0, count: 0, txs: [] };
                const sharePercent = totalExpense > 0 ? (data.total / totalExpense) * 100 : 0;

                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50 transition-colors group text-slate-800"
                  >
                    <td className="py-2.5 px-3 sm:px-4 text-center font-mono text-xs text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4">
                      <button
                        onClick={() => onFilterByCategory(cat.id)}
                        className="font-medium text-slate-900 hover:text-indigo-600 text-left flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{cat.name}</span>
                        {data.count > 0 && (
                          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 hidden sm:table-cell text-xs text-slate-500">
                      {cat.group || 'Chung'}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-center hidden md:table-cell font-mono text-xs text-slate-500">
                      {data.count > 0 ? (
                        <span className="font-semibold text-slate-700">{data.count}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {data.total > 0 ? (
                        <span className="text-rose-600">{formatVND(data.total)}</span>
                      ) : (
                        <span className="text-slate-300">0 ₫</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums text-xs text-slate-600">
                      {data.total > 0 ? `${sharePercent.toFixed(1)}%` : '0%'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenNewTxWithCategory(cat)}
                          title={`Ghi khoản chi ${cat.name}`}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenEditCategoryModal(cat)}
                          title={`Sửa tên hạng mục "${cat.name}"`}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(cat)}
                          title={`Xóa hạng mục "${cat.name}"`}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {/* Expense Add Row */}
            {expandedSection.expense && (
              <tr className="bg-rose-50/20 hover:bg-rose-50/40">
                <td colSpan={7} className="py-2 px-4 text-center">
                  <button
                    onClick={() => onOpenAddCategoryModal('chi')}
                    className="text-xs font-semibold text-rose-800 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-600" />
                    <span>Thêm Hạng Mục Chi Mới</span>
                  </button>
                </td>
              </tr>
            )}

            {/* RESULTS ROW */}
            <tr className="bg-amber-100/70 border-t-2 border-slate-300 font-bold text-slate-900 text-base">
              <td colSpan={2} className="py-3 px-3 sm:px-4">
                <span className="tracking-wide uppercase text-slate-900">LỜI / LỖ (THẶNG DƯ)</span>
              </td>
              <td colSpan={2} className="py-3 px-3 sm:px-4 hidden sm:table-cell text-xs text-slate-600 font-normal">
                Doanh thu trừ Chi phí
              </td>
              <td
                className={`py-3 px-3 sm:px-4 text-right font-mono tabular-nums font-extrabold text-base sm:text-lg ${
                  isProfitable ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {formatVND(profit)}
              </td>
              <td colSpan={2} className="py-3 px-3 sm:px-4 text-right">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    isProfitable ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {isProfitable ? 'CÓ LÃI' : 'THÂM HỤT'}
                </span>
              </td>
            </tr>

            <tr className="bg-slate-100 border-t border-slate-200 font-semibold text-slate-800">
              <td colSpan={2} className="py-2.5 px-3 sm:px-4">
                <span className="tracking-wide uppercase text-xs text-slate-600">
                  % ON REV (TỶ SUẤT LN / DOANH THU)
                </span>
              </td>
              <td colSpan={2} className="py-2.5 px-3 sm:px-4 hidden sm:table-cell text-xs text-slate-500 font-normal">
                Lợi nhuận chia Doanh thu
              </td>
              <td
                className={`py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums font-bold ${
                  isProfitable ? 'text-sky-700' : 'text-rose-600'
                }`}
              >
                {formatPercent(marginPercent)}
              </td>
              <td colSpan={2} className="py-2.5 px-3 sm:px-4 text-right text-xs text-slate-500">
                {marginPercent > 20
                  ? 'Hiệu quả cao'
                  : marginPercent > 0
                  ? 'Đạt mục tiêu'
                  : 'Cần cân đối chi phí'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
