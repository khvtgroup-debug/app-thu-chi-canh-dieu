import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit3,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowLeft,
  X,
  Sparkles,
  FileSpreadsheet,
  Upload,
  ChevronDown,
} from 'lucide-react';
import { Transaction, CategoryItem, AppMode, HomeThemeColor } from '../types/finance';
import { formatVND, formatDateVN, normalizeVietnamese } from '../utils/formatters';
import { exportTransactionsExcel } from '../utils/excelExport';
import { getThemeConfig } from '../utils/themeConfig';

function highlightMatch(text: string | undefined, query: string) {
  if (!text) return null;
  if (!query.trim()) return text;
  const qNorm = normalizeVietnamese(query);
  const tNorm = normalizeVietnamese(text);
  const idx = tNorm.indexOf(qNorm);
  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <>
      {before}
      <span className="bg-amber-200/90 text-amber-950 font-bold px-0.5 rounded shadow-2xs">
        {match}
      </span>
      {after}
    </>
  );
}

interface TransactionListProps {
  transactions: Transaction[];
  categories: CategoryItem[];
  onOpenNewTx: () => void;
  onEditTx: (tx: Transaction) => void;
  onDeleteTx: (id: string) => void;
  onPrintTxReceipt: (tx: Transaction) => void;
  initialCategoryFilter?: string;
  onClearCategoryFilter?: () => void;
  onBackToSpreadsheet?: () => void;
  onOpenImportExcel?: (type?: 'all' | 'thu' | 'chi') => void;
  onExportExcel?: (type?: 'all' | 'thu' | 'chi') => void;
  mode?: AppMode;
  themeColor?: HomeThemeColor;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  onOpenNewTx,
  onEditTx,
  onDeleteTx,
  onPrintTxReceipt,
  initialCategoryFilter,
  onClearCategoryFilter,
  onBackToSpreadsheet,
  onOpenImportExcel,
  onExportExcel,
  mode = 'business',
  themeColor,
}) => {
  const isBusiness = mode === 'business';
  const theme = getThemeConfig(themeColor);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'thu' | 'chi'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter || 'all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'tien_mat' | 'chuyen_khoan'>('all');

  // Dropdown states for separate Export & Import
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

  React.useEffect(() => {
    if (initialCategoryFilter) {
      setCategoryFilter(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  const selectedCategoryObj = useMemo(() => {
    return categories.find((c) => c.id === categoryFilter);
  }, [categories, categoryFilter]);

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const queryNorm = normalizeVietnamese(query);

    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
      if (paymentFilter !== 'all' && tx.paymentMethod !== paymentFilter) return false;

      if (query !== '') {
        const note = (tx.note || '').toLowerCase();
        const noteNorm = normalizeVietnamese(tx.note || '');

        const person = (tx.payerOrReceiver || '').toLowerCase();
        const personNorm = normalizeVietnamese(tx.payerOrReceiver || '');

        const cat = tx.categoryName.toLowerCase();
        const catNorm = normalizeVietnamese(tx.categoryName);

        const student = (tx.studentName || '').toLowerCase();
        const studentNorm = normalizeVietnamese(tx.studentName || '');

        const matchNote = note.includes(query) || noteNorm.includes(queryNorm);
        const matchPerson = person.includes(query) || personNorm.includes(queryNorm);
        const matchCat = cat.includes(query) || catNorm.includes(queryNorm);
        const matchStudent = student.includes(query) || studentNorm.includes(queryNorm);

        if (!matchNote && !matchPerson && !matchCat && !matchStudent) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, paymentFilter, searchTerm]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    });
  }, [filteredTransactions]);

  const totalFilteredThu = filteredTransactions
    .filter((t) => t.type === 'thu')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredChi = filteredTransactions
    .filter((t) => t.type === 'chi')
    .reduce((sum, t) => sum + t.amount, 0);

  const thuCount = transactions.filter((t) => t.type === 'thu').length;
  const chiCount = transactions.filter((t) => t.type === 'chi').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header and Filter Controls */}
      <div className="p-3.5 sm:p-5 border-b border-slate-200 space-y-3.5">
        {/* Top Header Row with Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {onBackToSpreadsheet && (
              <button
                onClick={onBackToSpreadsheet}
                title="Quay lại Bảng Thu Chi"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Quay lại Bảng tính</span>
              </button>
            )}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Sổ Nhật Ký Giao Dịch</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                  {transactions.length} GD
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Tìm kiếm và theo dõi chi tiết từng khoản thu - chi phát sinh trong tháng
              </p>
            </div>
          </div>

          {/* Action buttons: Excel Export, Excel Import, and Add Transaction */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Export Excel Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsExportMenuOpen(!isExportMenuOpen);
                  setIsImportMenuOpen(false);
                }}
                title="Tùy chọn xuất file Excel (Toàn bộ, Thu riêng, hoặc Chi riêng)"
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer border ${
                  isBusiness
                    ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                    : `${theme.accentText} ${theme.accentBgLight} ${theme.accentBorderLight} hover:opacity-90`
                }`}
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 ${isBusiness ? 'text-emerald-700' : theme.accentText}`} />
                <span>Xuất Excel</span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 sm:left-0 sm:right-auto mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Tùy chọn xuất Excel
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      if (onExportExcel) {
                        onExportExcel('all');
                      } else {
                        exportTransactionsExcel(sortedTransactions, 'So_Giao_Dich.xlsx');
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50/70 text-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-medium">Xuất danh sách hiện tại</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {sortedTransactions.length} GD
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      if (onExportExcel) {
                        onExportExcel('thu');
                      } else {
                        exportTransactionsExcel(
                          sortedTransactions.filter((t) => t.type === 'thu'),
                          'Danh_Sach_Khoan_Thu.xlsx'
                        );
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50/70 text-emerald-900 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Chỉ xuất Khoản Thu</span>
                    </span>
                    <span className="text-[11px] text-emerald-700 font-mono">{thuCount} GD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      if (onExportExcel) {
                        onExportExcel('chi');
                      } else {
                        exportTransactionsExcel(
                          sortedTransactions.filter((t) => t.type === 'chi'),
                          'Danh_Sach_Khoan_Chi.xlsx'
                        );
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-rose-50/70 text-rose-900 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                      <span>Chỉ xuất Khoản Chi</span>
                    </span>
                    <span className="text-[11px] text-rose-700 font-mono">{chiCount} GD</span>
                  </button>
                </div>
              )}
            </div>

            {/* Import Excel Dropdown */}
            {onOpenImportExcel && (
              <div className="relative" ref={importMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportMenuOpen(!isImportMenuOpen);
                    setIsExportMenuOpen(false);
                  }}
                  title="Nhập giao dịch từ Excel (Toàn bộ, Thu riêng, hoặc Chi riêng)"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
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
                        <div className="text-[10px] text-slate-500">Cho file chỉ gồm học phí, phụ thu...</div>
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
                        <div className="text-[10px] text-slate-500">Cho file chi phí, thực phẩm, hóa đơn...</div>
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
                        <div className="text-[10px] text-slate-500">File chứa đồng thời cả hai loại</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Primary Add Transaction Button */}
            <button
              onClick={onOpenNewTx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Giao Dịch</span>
            </button>
          </div>
        </div>

        {/* THANH TÌM KIẾM CHÍNH (PROMINENT SEARCH BAR) */}
        <div className="space-y-2 bg-slate-50/70 p-2.5 sm:p-3 rounded-xl border border-slate-200/80">
          <div className="relative flex items-center">
            <Search className="w-4 sm:w-5 h-4 sm:h-5 text-red-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="🔍 Tìm nhanh theo tên người nhận/nộp (Phụ huynh, Giáo viên, NCC...) hoặc nội dung ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-24 sm:pr-28 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all shadow-2xs"
            />
            {/* Inside Right Controls */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  title="Xóa từ khóa tìm kiếm"
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {searchTerm && (
                <span className="text-[11px] font-semibold bg-red-100/90 text-red-800 px-2 py-0.5 rounded-full border border-red-200 hidden xs:inline-block">
                  {filteredTransactions.length} GD
                </span>
              )}
            </div>
          </div>

          {/* Quick Filter Tags / Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Gợi ý tìm nhanh:</span>
            </span>
            {['Học phí', 'Tiền ăn', 'Lương', 'Thực phẩm', 'Phụ huynh', 'CSVC', 'Chuyển khoản'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchTerm(tag === searchTerm ? '' : tag)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
                  searchTerm.toLowerCase() === tag.toLowerCase()
                    ? 'bg-red-600 text-white border-red-600 font-semibold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tag}
              </button>
            ))}
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-[11px] text-red-600 hover:underline font-semibold ml-auto cursor-pointer"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
          {/* Type Segmented Buttons */}
          <div className="flex items-center p-0.5 sm:p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất Cả ({transactions.length})
            </button>
            <button
              onClick={() => setTypeFilter('thu')}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                typeFilter === 'thu'
                  ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Thu ({thuCount})
            </button>
            <button
              onClick={() => setTypeFilter('chi')}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                typeFilter === 'chi'
                  ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Chi ({chiCount})
            </button>
          </div>

          {/* Dynamic Category Dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                if (e.target.value === 'all' && onClearCategoryFilter) {
                  onClearCategoryFilter();
                }
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-emerald-500 bg-slate-50 hover:bg-white focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả danh mục ({categories.length})</option>
              <optgroup label="Khoản Thu">
                {categories.filter((c) => c.type === 'thu').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Khoản Chi">
                {categories.filter((c) => c.type === 'chi').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Payment Method Dropdown */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-emerald-500 bg-slate-50 hover:bg-white focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả hình thức thanh toán</option>
              <option value="chuyen_khoan">Chuyển khoản</option>
              <option value="tien_mat">Tiền mặt</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Back Banner */}
        {(categoryFilter !== 'all' || searchTerm.trim() !== '' || typeFilter !== 'all' || paymentFilter !== 'all') && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50/80 p-2.5 rounded-lg text-xs text-slate-700 border border-emerald-200">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {searchTerm.trim() ? (
                  <>
                    Kết quả tìm kiếm cho &ldquo;<strong>{searchTerm}</strong>&rdquo;: Tìm thấy{' '}
                    <strong>{filteredTransactions.length}</strong> GD (Thu:{' '}
                    <strong className="text-emerald-700 font-mono">{formatVND(totalFilteredThu)}</strong> | Chi:{' '}
                    <strong className="text-rose-700 font-mono">{formatVND(totalFilteredChi)}</strong>)
                  </>
                ) : selectedCategoryObj ? (
                  <>
                    Đang xem danh mục: <strong>{selectedCategoryObj.name}</strong> (
                    {filteredTransactions.length} GD - Tổng:{' '}
                    <strong className="font-mono text-emerald-700">
                      {formatVND(totalFilteredThu + totalFilteredChi)}
                    </strong>)
                  </>
                ) : (
                  <>
                    Tìm thấy <strong>{filteredTransactions.length}</strong> GD: Thu{' '}
                    <strong className="text-emerald-700 font-mono">{formatVND(totalFilteredThu)}</strong> | Chi{' '}
                    <strong className="text-rose-700 font-mono">{formatVND(totalFilteredChi)}</strong>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onBackToSpreadsheet && categoryFilter !== 'all' && (
                <button
                  onClick={onBackToSpreadsheet}
                  className="text-xs text-emerald-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại Bảng Tính</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setCategoryFilter('all');
                  setPaymentFilter('all');
                  if (onClearCategoryFilter) onClearCategoryFilter();
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List / Table */}
      {sortedTransactions.length === 0 ? (
        <div className="py-12 sm:py-16 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-500 mb-3 shadow-2xs">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {searchTerm.trim()
              ? `Không tìm thấy giao dịch nào chứa từ khóa "${searchTerm}"`
              : 'Không có giao dịch nào phù hợp'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm.trim()
              ? 'Hãy kiểm tra lại chính tả tên người nhận/nộp hoặc nội dung ghi chú, hoặc bấm nút dưới để xóa tìm kiếm.'
              : selectedCategoryObj
              ? `Chưa có khoản thu chi nào thuộc mục "${selectedCategoryObj.name}" trong tháng này.`
              : 'Thử thay đổi bộ lọc tìm kiếm hoặc bấm nút bên dưới để thêm giao dịch mới.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {searchTerm.trim() && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
              >
                Xóa từ khóa tìm kiếm
              </button>
            )}
            {onBackToSpreadsheet && (
              <button
                onClick={onBackToSpreadsheet}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay Lại Bảng Tính</span>
              </button>
            )}
            <button
              onClick={onOpenNewTx}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Giao Dịch</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW */}
          <div className="md:hidden divide-y divide-slate-100">
            {sortedTransactions.map((tx) => {
              const isThu = tx.type === 'thu';
              return (
                <div key={tx.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5 ${
                          isThu ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isThu ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-sm truncate">
                          {highlightMatch(tx.categoryName, searchTerm)}
                        </div>
                        {tx.note && (
                          <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                            {highlightMatch(tx.note, searchTerm)}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="font-mono">{formatDateVN(tx.date)}</span>
                          <span>·</span>
                          <span>{tx.paymentMethod === 'chuyen_khoan' ? 'Chuyển khoản' : 'Tiền mặt'}</span>
                          {tx.payerOrReceiver && (
                            <>
                              <span>·</span>
                              <span className="text-slate-600 font-medium">
                                {highlightMatch(tx.payerOrReceiver, searchTerm)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono tabular-nums font-bold text-sm ${
                          isThu ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isThu ? '+' : '-'}
                        {formatVND(tx.amount)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => onPrintTxReceipt(tx)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>In phiếu</span>
                    </button>
                    <button
                      onClick={() => onEditTx(tx)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded-md cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Bạn có chắc muốn xóa khoản "${tx.categoryName} - ${formatVND(tx.amount)}"?`)) {
                          onDeleteTx(tx.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50/70 uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-28">Ngày</th>
                  <th className="py-2.5 px-3 w-16 text-center">Loại</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Hạng Mục & Nội Dung</th>
                  <th className="py-2.5 px-4 min-w-[140px]">Người Nộp / Nhận</th>
                  <th className="py-2.5 px-3 w-28">Hình Thức</th>
                  <th className="py-2.5 px-4 text-right min-w-[140px]">Số Tiền (VNĐ)</th>
                  <th className="py-2.5 px-3 text-center w-28">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTransactions.map((tx) => {
                  const isThu = tx.type === 'thu';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {formatDateVN(tx.date)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${
                            isThu ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isThu ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {highlightMatch(tx.categoryName, searchTerm)}
                        </div>
                        {tx.note && (
                          <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                            {highlightMatch(tx.note, searchTerm)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {tx.payerOrReceiver ? (
                          highlightMatch(tx.payerOrReceiver, searchTerm)
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                        {tx.paymentMethod === 'chuyen_khoan' ? 'Chuyển khoản' : 'Tiền mặt'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-sm whitespace-nowrap">
                        <span className={isThu ? 'text-emerald-600' : 'text-rose-600'}>
                          {isThu ? '+' : '-'}
                          {formatVND(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => onPrintTxReceipt(tx)}
                            title="In phiếu"
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTx(tx)}
                            title="Sửa"
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc muốn xóa khoản "${tx.categoryName} - ${formatVND(tx.amount)}"?`)) {
                                onDeleteTx(tx.id);
                              }
                            }}
                            title="Xóa"
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
