import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Loader2,
  Filter,
} from 'lucide-react';
import { Transaction, CategoryItem } from '../types/finance';
import { parseTransactionsExcelFile, ParseResult, ParsedTransaction } from '../utils/excelImport';
import { downloadTransactionImportTemplate } from '../utils/excelExport';
import { formatVND, formatDateVN } from '../utils/formatters';

export type ImportTypeFilter = 'all' | 'thu' | 'chi';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    transactions: Omit<Transaction, 'id' | 'createdAt'>[],
    mode: 'append' | 'replace',
    targetMonth: string
  ) => void;
  categories: CategoryItem[];
  currentMonth: string;
  initialType?: ImportTypeFilter;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  onImport,
  categories,
  currentMonth,
  initialType = 'all',
}) => {
  const [targetType, setTargetType] = useState<ImportTypeFilter>(initialType);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialType when modal opens or initialType changes
  useEffect(() => {
    if (isOpen) {
      setTargetType(initialType || 'all');
    }
  }, [isOpen, initialType]);

  // Filtered transactions currently ready to be imported (Hooks called unconditionally)
  const activeTransactionsToImport = useMemo(() => {
    if (!parseResult) return [];
    if (targetType === 'all') return parseResult.validTransactions;
    return parseResult.validTransactions.filter((t) => t.type === targetType);
  }, [parseResult, targetType]);

  const activeIncomeTotal = useMemo(() => {
    return activeTransactionsToImport
      .filter((t) => t.type === 'thu')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [activeTransactionsToImport]);

  const activeExpenseTotal = useMemo(() => {
    return activeTransactionsToImport
      .filter((t) => t.type === 'chi')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [activeTransactionsToImport]);

  const parseFileWithMode = async (selectedFile: File, mode: ImportTypeFilter) => {
    setIsParsing(true);
    setParseError(null);

    try {
      const result = await parseTransactionsExcelFile(selectedFile, categories, {
        mode,
        defaultTypeIfMissing: mode === 'all' ? undefined : mode,
      });

      if (result.validTransactions.length === 0 && result.allTransactions.length === 0) {
        setParseError('Không tìm thấy dòng giao dịch hợp lệ nào trong tệp Excel.');
        setParseResult(null);
      } else {
        setParseResult(result);
      }
    } catch (err: any) {
      setParseError(err.message || 'Lỗi khi đọc tệp Excel. Vui lòng kiểm tra định dạng tệp.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    await parseFileWithMode(selectedFile, targetType);
  };

  const handleTypeChange = async (newType: ImportTypeFilter) => {
    setTargetType(newType);
    if (file) {
      await parseFileWithMode(file, newType);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (activeTransactionsToImport.length === 0) return;

    const formatted: Omit<Transaction, 'id' | 'createdAt'>[] = activeTransactionsToImport.map(
      (pt) => ({
        date: pt.date,
        month: pt.month,
        type: pt.type,
        categoryId: pt.categoryId,
        categoryName: pt.categoryName,
        amount: pt.amount,
        payerOrReceiver: pt.payerOrReceiver,
        paymentMethod: pt.paymentMethod,
        note: pt.note,
      })
    );

    onImport(formatted, importMode, currentMonth);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setIsParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Nhập Thu - Chi Từ File Excel (.xlsx / .csv)
                </h3>
                {targetType === 'thu' && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                    Chỉ Nhập Thu
                  </span>
                )}
                {targetType === 'chi' && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-800 rounded-full">
                    Chỉ Nhập Chi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Linh hoạt nhập riêng khoản Chi, riêng khoản Thu hoặc cả hai từ file Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* STEP 1: SELECT IMPORT TYPE FILTER */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-600" />
                <span>1. Chọn loại giao dịch bạn muốn nhập:</span>
              </span>
              <span className="text-[11px] text-slate-500">
                {targetType === 'thu' && 'Chỉ nhận khoản Thu (tiền vào)'}
                {targetType === 'chi' && 'Chỉ nhận khoản Chi (tiền ra)'}
                {targetType === 'all' && 'Nhận đồng thời cả Thu và Chi'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Button All */}
              <button
                type="button"
                onClick={() => handleTypeChange('all')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  targetType === 'all'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>Cả Thu & Chi</span>
              </button>

              {/* Button Thu */}
              <button
                type="button"
                onClick={() => handleTypeChange('thu')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  targetType === 'thu'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Chỉ Khoản Thu</span>
              </button>

              {/* Button Chi */}
              <button
                type="button"
                onClick={() => handleTypeChange('chi')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  targetType === 'chi'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Chỉ Khoản Chi</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200">
              {targetType === 'thu' && (
                <span>
                  💡 <b>Chế độ Thu riêng:</b> Nếu file Excel của bạn chỉ gồm các khoản thu (không có cột "Loại"), hệ thống sẽ tự động gán toàn bộ dữ liệu là <b>Khoản Thu</b> và đối chiếu với danh mục thu.
                </span>
              )}
              {targetType === 'chi' && (
                <span>
                  💡 <b>Chế độ Chi riêng:</b> Nếu file Excel là bảng kê chi phí / hóa đơn (không có cột "Loại"), hệ thống sẽ tự động gán toàn bộ dữ liệu là <b>Khoản Chi</b> và đối chiếu với danh mục chi.
                </span>
              )}
              {targetType === 'all' && (
                <span>
                  💡 <b>Chế độ Chung:</b> Hệ thống tự động nhận diện theo cột "Loại" (Thu hoặc Chi) trong file hoặc theo tên hạng mục khớp tương ứng.
                </span>
              )}
            </div>
          </div>

          {/* STEP 2: DOWNLOAD TEMPLATE ACCORDING TO USER'S NEED */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>2. Tải tệp Excel mẫu chuẩn nhập liệu:</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadTransactionImportTemplate(categories, 'thu')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tải Mẫu Khoản Thu (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => downloadTransactionImportTemplate(categories, 'chi')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-800 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-rose-700" />
                <span>Tải Mẫu Khoản Chi (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => downloadTransactionImportTemplate(categories, 'all')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                <span>Tải Mẫu Cả Thu & Chi</span>
              </button>
            </div>
          </div>

          {/* STEP 3: UPLOAD FILE AREA */}
          <div>
            <div className="text-xs font-bold text-slate-800 mb-1.5">
              3. Chọn tệp Excel dữ liệu của bạn:
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-red-500 bg-red-50/50'
                  : file
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center">
                <div
                  className={`p-3 rounded-full mb-2 ${
                    file ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {file ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>
                <div className="font-semibold text-slate-800">
                  {file ? file.name : 'Kéo thả file Excel (.xlsx, .xls, .csv) vào đây'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {file
                    ? `Kích thước: ${(file.size / 1024).toFixed(1)} KB (Nhấp để chọn file khác)`
                    : 'hoặc nhấp chuột để chọn tệp từ máy tính / điện thoại'}
                </div>
              </div>
            </div>
          </div>

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="flex items-center justify-center gap-2 py-4 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin text-red-600" />
              <span className="text-xs font-medium">Đang đọc và phân tích dữ liệu Excel...</span>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <div className="font-semibold text-xs">Lỗi đọc file:</div>
                <div className="text-xs mt-0.5">{parseError}</div>
              </div>
            </div>
          )}

          {/* STEP 4: PARSED DATA SUMMARY & PREVIEW */}
          {parseResult && (
            <div className="space-y-3">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    {targetType === 'thu'
                      ? 'Khoản Thu'
                      : targetType === 'chi'
                      ? 'Khoản Chi'
                      : 'Tổng Số GD'}
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                    {activeTransactionsToImport.length}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Tổng Thu Nhập</div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-800 font-mono">
                    {formatVND(activeIncomeTotal)}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <div className="text-[10px] uppercase font-bold text-rose-700">Tổng Chi Nhập</div>
                  <div className="text-xs sm:text-sm font-bold text-rose-800 font-mono">
                    {formatVND(activeExpenseTotal)}
                  </div>
                </div>
              </div>

              {/* Warning for skipped/invalid rows */}
              {parseResult.invalidRows.length > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Bỏ qua {parseResult.invalidRows.length} dòng không hợp lệ:
                    </span>
                  </div>
                  <ul className="list-disc pl-5 mt-1 text-[11px] space-y-0.5 text-amber-900 max-h-20 overflow-y-auto">
                    {parseResult.invalidRows.slice(0, 5).map((inv, idx) => (
                      <li key={idx}>
                        Dòng {inv.rowNumber}: {inv.reason}
                      </li>
                    ))}
                    {parseResult.invalidRows.length > 5 && (
                      <li>...và {parseResult.invalidRows.length - 5} dòng khác</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Notice if user filtered by type and some rows were skipped */}
              {targetType !== 'all' &&
                parseResult.allTransactions.length > activeTransactionsToImport.length && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between">
                    <span>
                      Đang lọc chỉ lấy <b>{activeTransactionsToImport.length}</b> khoản {targetType === 'thu' ? 'Thu' : 'Chi'} (đã tự động bỏ qua {parseResult.allTransactions.length - activeTransactionsToImport.length} khoản {targetType === 'thu' ? 'Chi' : 'Thu'}).
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('all')}
                      className="text-[11px] font-bold text-blue-700 underline ml-2 shrink-0 cursor-pointer"
                    >
                      Nhập cả hai
                    </button>
                  </div>
                )}

              {/* Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Xem trước ({Math.min(8, activeTransactionsToImport.length)}/{activeTransactionsToImport.length} dòng):
                  </span>
                </div>
                {activeTransactionsToImport.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
                    Không có dòng giao dịch nào khớp với bộ lọc &quot;{targetType === 'thu' ? 'Chỉ Khoản Thu' : 'Chỉ Khoản Chi'}&quot;.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase sticky top-0">
                        <tr>
                          <th className="p-2">Ngày</th>
                          <th className="p-2">Loại</th>
                          <th className="p-2">Hạng Mục</th>
                          <th className="p-2 text-right">Số Tiền</th>
                          <th className="p-2">Người Nộp/Nhận</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeTransactionsToImport.slice(0, 10).map((tx, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-2 font-mono text-[11px]">{formatDateVN(tx.date)}</td>
                            <td className="p-2">
                              <span
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                  tx.type === 'thu'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {tx.type === 'thu' ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3" />
                                )}
                                {tx.type === 'thu' ? 'Thu' : 'Chi'}
                              </span>
                            </td>
                            <td className="p-2 font-medium text-slate-800 truncate max-w-[120px]">
                              {tx.categoryName}
                            </td>
                            <td className="p-2 text-right font-mono font-bold">
                              <span className={tx.type === 'thu' ? 'text-emerald-700' : 'text-rose-700'}>
                                {formatVND(tx.amount)}
                              </span>
                            </td>
                            <td className="p-2 text-slate-600 truncate max-w-[120px]">
                              {tx.payerOrReceiver || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Import Mode Radio Options */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-slate-800">Phương thức nhập vào sổ:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800">Thêm mới (Khuyên dùng)</div>
                      <div className="text-[10px] text-slate-500">Giữ nguyên các giao dịch đã có</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800">Thay thế trong tháng</div>
                      <div className="text-[10px] text-slate-500">Ghi đè giao dịch tháng {currentMonth}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={handleReset}
            disabled={!file}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 disabled:opacity-40 cursor-pointer"
          >
            Làm lại
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={activeTransactionsToImport.length === 0}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-40 rounded-lg shadow-xs cursor-pointer transition-all"
            >
              {targetType === 'thu' && `Xác Nhận Nhập (${activeTransactionsToImport.length} Khoản Thu)`}
              {targetType === 'chi' && `Xác Nhận Nhập (${activeTransactionsToImport.length} Khoản Chi)`}
              {targetType === 'all' && `Xác Nhận Nhập (${activeTransactionsToImport.length} Giao Dịch)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
