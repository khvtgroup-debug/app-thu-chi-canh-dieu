import React, { useRef, useState } from 'react';
import { X, Printer, FileDown, FileSpreadsheet, Loader2, Home } from 'lucide-react';
import { Transaction, StudentTuition, SchoolConfig, FamilyConfig, CategoryItem, AppMode } from '../types/finance';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../data/defaultCategories';
import { KiteLogo } from './KiteLogo';
import { getThemeConfig } from '../utils/themeConfig';
import {
  formatVND,
  formatDateVN,
  formatMonthVN,
  numberToVietnameseWords,
} from '../utils/formatters';
import { exportElementToPDF } from '../utils/pdfExport';
import { exportMonthlyReportExcel } from '../utils/excelExport';

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'transaction' | 'student' | 'month_report';
  transaction?: Transaction | null;
  student?: StudentTuition | null;
  monthStr?: string;
  transactions?: Transaction[];
  schoolConfig: SchoolConfig;
  familyConfig?: FamilyConfig;
  mode?: AppMode;
  categories?: CategoryItem[];
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  isOpen,
  onClose,
  type,
  transaction,
  student,
  monthStr = '',
  transactions = [],
  schoolConfig,
  familyConfig,
  mode = 'business',
  categories,
}) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string>('');

  if (!isOpen) return null;

  const isBusiness = mode === 'business';
  const theme = getThemeConfig(familyConfig?.themeColor);

  const incomeCategories = categories
    ? categories.filter((c) => c.type === 'thu')
    : DEFAULT_INCOME_CATEGORIES;
  const expenseCategories = categories
    ? categories.filter((c) => c.type === 'chi')
    : DEFAULT_EXPENSE_CATEGORIES;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!paperRef.current) return;
    setIsExportingPDF(true);

    let docName = 'Bao_Cao';
    if (type === 'transaction') {
      docName = `Phieu_${transaction?.type === 'thu' ? 'Thu' : 'Chi'}_${transaction?.date || ''}`;
    } else if (type === 'student') {
      docName = `Bien_Lai_${(student?.studentName || '').replace(/\s+/g, '_')}_${monthStr}`;
    } else {
      docName = `Bao_Cao_Thu_Chi_${monthStr}`;
    }

    try {
      await exportElementToPDF(paperRef.current, {
        filename: `${docName}.pdf`,
        margin: 8,
        onProgress: setPdfStatus,
      });
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      alert('Không thể tạo file PDF. Bạn có thể sử dụng nút "In Ngay" và chọn "Lưu dưới dạng PDF".');
    } finally {
      setIsExportingPDF(false);
      setPdfStatus('');
    }
  };

  const handleDownloadExcel = () => {
    if (type === 'month_report') {
      exportMonthlyReportExcel(monthStr, transactions, schoolConfig, categories);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      {/* Floating Action Header (Hidden in Print) */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-4 sm:my-8 max-h-[95vh] flex flex-col">
        <div className="px-3 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-100 print:hidden shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Printer className="w-4 h-4 text-slate-700" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
              {type === 'transaction' &&
                (transaction?.type === 'thu' ? 'Phiếu Thu' : 'Phiếu Chi')}
              {type === 'student' && 'Biên Lai Học Phí'}
              {type === 'month_report' && `Báo Cáo ${formatMonthVN(monthStr)}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Download PDF button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
              title="Tải tệp PDF về máy tính hoặc điện thoại"
            >
              {isExportingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span className="hidden xs:inline">{isExportingPDF ? 'Đang xuất PDF...' : 'Tải PDF'}</span>
              <span className="xs:hidden">PDF</span>
            </button>

            {/* Download Excel button (for month report) */}
            {type === 'month_report' && (
              <button
                onClick={handleDownloadExcel}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Tải tệp Excel .xlsx"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Tải Excel</span>
                <span className="xs:hidden">Excel</span>
              </button>
            )}

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">In Ngay</span>
              <span className="xs:hidden">In</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status indicator during PDF generation */}
        {pdfStatus && (
          <div className="bg-amber-50 px-4 py-1.5 text-[11px] text-amber-800 font-medium border-b border-amber-200 flex items-center gap-2 print:hidden">
            <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
            <span>{pdfStatus}</span>
          </div>
        )}

        {/* Printable Paper Area (Styled like A4 sheet) */}
        <div
          ref={paperRef}
          className="p-4 sm:p-8 md:p-12 bg-white text-slate-900 print:p-0 print:m-0 font-sans overflow-y-auto flex-1"
        >
          {/* Header of Receipt with Kite Logo or Home Badge */}
          <div className="flex items-start justify-between border-b-2 border-slate-300 pb-3 sm:pb-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              {isBusiness ? (
                <KiteLogo size={48} className="shrink-0" />
              ) : (
                <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm ${theme.headerLogoBg}`}>
                  <Home className="w-6 h-6" />
                </div>
              )}
              <div>
                <div
                  className={`font-extrabold text-sm sm:text-lg uppercase font-serif tracking-wide ${
                    isBusiness ? 'text-red-700' : theme.headerBrandTitle
                  }`}
                >
                  {isBusiness
                    ? schoolConfig.schoolName || 'TRƯỜNG MẪU GIÁO CÁNH DIỀU'
                    : familyConfig?.familyName?.toUpperCase() || 'SỔ THU CHI GIA ĐÌNH'}
                </div>
                <div
                  className={`text-[11px] sm:text-xs font-semibold tracking-wider uppercase mt-0.5 ${
                    isBusiness ? 'text-amber-700' : theme.headerBrandSub
                  }`}
                >
                  {isBusiness
                    ? schoolConfig.branchName || 'Luyện nhân cách ươm mầm tài năng'
                    : familyConfig?.subTitle || 'Quản lý thu chi & Kế hoạch tài chính tổ ấm'}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                  Địa chỉ: {isBusiness ? schoolConfig.address : familyConfig?.address}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500">
                  Hotline / ĐT: {isBusiness ? schoolConfig.phone : familyConfig?.phone}
                </div>
              </div>
            </div>
            <div className="text-right text-[10px] sm:text-xs text-slate-500 shrink-0">
              <div className="font-semibold text-slate-700">
                {isBusiness ? 'Mẫu số: 01-TT' : 'Sổ Chi Tiêu'}
              </div>
              <div className="hidden xs:block">
                {isBusiness ? 'Theo TT 133/2016/TT-BTC' : 'Hệ Thống Quản Lý Độc Lập'}
              </div>
              <div className="font-mono mt-0.5 text-[10px]">
                Mã: {isBusiness ? 'REC' : 'FAM'}-{Date.now().toString().slice(-6)}
              </div>
            </div>
          </div>

          {/* ================= CASE 1: INDIVIDUAL TRANSACTION (PHIẾU THU / CHI) ================= */}
          {type === 'transaction' && transaction && (
            <div>
              <div className="text-center my-4 sm:my-6">
                <h1 className="text-base sm:text-xl font-bold tracking-wide uppercase text-slate-900">
                  {transaction.type === 'thu' ? 'PHIẾU THU TIỀN' : 'PHIẾU CHI TIỀN'}
                </h1>
                <div className="text-xs text-slate-500 mt-1 italic">
                  Ngày {transaction.date.split('-')[2]} tháng {transaction.date.split('-')[1]} năm{' '}
                  {transaction.date.split('-')[0]}
                </div>
              </div>

              <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm my-4 sm:my-6">
                <div className="flex items-baseline">
                  <span className="w-36 sm:w-48 text-slate-600 shrink-0">
                    {transaction.type === 'thu' ? 'Họ tên người nộp:' : 'Họ tên người nhận:'}
                  </span>
                  <span className="font-semibold text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {transaction.payerOrReceiver || '(Không ghi)'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-36 sm:w-48 text-slate-600 shrink-0">Hạng mục:</span>
                  <span className="font-medium text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {transaction.categoryName}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-36 sm:w-48 text-slate-600 shrink-0">Nội dung:</span>
                  <span className="text-slate-800 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {transaction.note || transaction.categoryName}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-36 sm:w-48 text-slate-600 shrink-0">Số tiền:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm sm:text-base border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {formatVND(transaction.amount)}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-36 sm:w-48 text-slate-600 shrink-0">Bằng chữ:</span>
                  <span className="italic font-medium text-slate-800 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {numberToVietnameseWords(transaction.amount)}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-36 sm:w-48 text-slate-600 shrink-0">Hình thức:</span>
                  <span className="text-slate-800 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                    {transaction.paymentMethod === 'chuyen_khoan'
                      ? 'Chuyển khoản qua ngân hàng'
                      : 'Tiền mặt'}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div
                className={`grid text-center mt-8 sm:mt-12 pt-4 text-[11px] sm:text-xs ${
                  isBusiness ? 'grid-cols-3' : 'grid-cols-2'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {transaction.type === 'thu' ? 'Người Nộp Tiền' : 'Người Nhận Tiền'}
                  </div>
                  <div className="italic text-slate-400 mt-0.5">(Ký, họ tên)</div>
                  <div className="mt-12 sm:mt-16 font-medium text-slate-800 truncate">
                    {transaction.payerOrReceiver || ''}
                  </div>
                </div>

                {isBusiness ? (
                  <>
                    <div>
                      <div className="font-bold text-slate-800">Thủ Quỹ</div>
                      <div className="italic text-slate-400 mt-0.5">(Ký, họ tên)</div>
                      <div className="mt-12 sm:mt-16 font-medium text-slate-800 truncate">
                        {schoolConfig.treasurerName}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-800">Hiệu Trưởng</div>
                      <div className="italic text-slate-400 mt-0.5">(Ký, đóng dấu)</div>
                      <div className="mt-12 sm:mt-16 font-medium text-slate-800 truncate">
                        {schoolConfig.principalName}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="font-bold text-slate-800">Người Quản Lý / Ghi Sổ</div>
                    <div className="italic text-slate-400 mt-0.5">(Ký, họ tên)</div>
                    <div className="mt-12 sm:mt-16 font-medium text-slate-800 truncate">
                      {familyConfig?.managerName || 'Người ghi sổ'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= CASE 2: STUDENT TUITION RECEIPT ================= */}
          {type === 'student' && student && (
            <div>
              <div className="text-center my-4 sm:my-6">
                <h1 className="text-base sm:text-xl font-bold tracking-wide uppercase text-slate-900">
                  PHIẾU THU HỌC PHÍ & BÁN TRÚ
                </h1>
                <div className="text-xs text-slate-600 mt-1 font-medium">
                  {formatMonthVN(student.month)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs mb-4 p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-slate-500">Họ tên bé:</span>{' '}
                  <strong className="text-slate-900 ml-1">{student.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Lớp:</span>{' '}
                  <strong className="text-slate-900 ml-1">{student.className}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Phụ huynh:</span>{' '}
                  <span className="text-slate-800 ml-1">{student.parentPhone || 'Chưa cập nhật'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Trạng thái:</span>{' '}
                  <span className="text-emerald-700 font-semibold ml-1">
                    {student.isPaid ? 'ĐÃ ĐÓNG PHÍ' : 'CHƯA NỘP'}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300 border-collapse my-3">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-700">
                      <th className="p-2 border-r border-slate-300 w-10 text-center">STT</th>
                      <th className="p-2 border-r border-slate-300">Khoản Thu Chi Tiết</th>
                      <th className="p-2 text-right w-32">Thành Tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="p-1.5 sm:p-2 text-center border-r border-slate-300">1</td>
                      <td className="p-1.5 sm:p-2 font-sans border-r border-slate-300">Học phí cơ bản trong tháng</td>
                      <td className="p-1.5 sm:p-2 text-right">{formatVND(student.tuitionFee)}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 sm:p-2 text-center border-r border-slate-300">2</td>
                      <td className="p-1.5 sm:p-2 font-sans border-r border-slate-300">Tiền ăn bán trú</td>
                      <td className="p-1.5 sm:p-2 text-right">{formatVND(student.mealFee)}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 sm:p-2 text-center border-r border-slate-300">3</td>
                      <td className="p-1.5 sm:p-2 font-sans border-r border-slate-300">Phí CSVC & học liệu</td>
                      <td className="p-1.5 sm:p-2 text-right">{formatVND(student.facilityFee)}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 sm:p-2 text-center border-r border-slate-300">4</td>
                      <td className="p-1.5 sm:p-2 font-sans border-r border-slate-300">Môn năng khiếu (Anh văn, Võ...)</td>
                      <td className="p-1.5 sm:p-2 text-right">{formatVND(student.extraActivitiesFee)}</td>
                    </tr>
                    {student.otherFee > 0 && (
                      <tr>
                        <td className="p-1.5 sm:p-2 text-center border-r border-slate-300">5</td>
                        <td className="p-1.5 sm:p-2 font-sans border-r border-slate-300">Các khoản phụ phí khác</td>
                        <td className="p-1.5 sm:p-2 text-right">{formatVND(student.otherFee)}</td>
                      </tr>
                    )}
                    {student.discount > 0 && (
                      <tr className="text-emerald-700">
                        <td className="p-1.5 sm:p-2 text-center border-r border-slate-300">-</td>
                        <td className="p-1.5 sm:p-2 font-sans border-r border-slate-300 font-medium">Miễn giảm / Hoàn trừ</td>
                        <td className="p-1.5 sm:p-2 text-right">-{formatVND(student.discount)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-100 font-bold font-sans text-xs sm:text-sm border-t-2 border-slate-400">
                      <td colSpan={2} className="p-2 sm:p-2.5 uppercase text-slate-900 border-r border-slate-300">
                        TỔNG PHẢI NỘP
                      </td>
                      <td className="p-2 sm:p-2.5 text-right font-mono text-emerald-800 font-extrabold text-sm sm:text-base">
                        {formatVND(student.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] sm:text-xs italic text-slate-700 my-2">
                Bằng chữ: <strong>{numberToVietnameseWords(student.total)}</strong>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center mt-8 sm:mt-12 pt-4 text-[11px] sm:text-xs">
                <div>
                  <div className="font-bold text-slate-800">Phụ Huynh Học Sinh</div>
                  <div className="italic text-slate-400 mt-0.5">(Ký, họ tên)</div>
                </div>

                <div>
                  <div className="font-bold text-slate-800">Thủ Quỹ / Ban Giám Hiệu</div>
                  <div className="italic text-slate-400 mt-0.5">(Ký, họ tên)</div>
                  <div className="mt-12 font-medium text-slate-800">
                    {schoolConfig.treasurerName}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= CASE 3: MONTHLY FINANCIAL REPORT ================= */}
          {type === 'month_report' && (
            <div>
              <div className="text-center my-4 sm:my-6">
                <h1 className="text-base sm:text-xl font-bold tracking-wide uppercase text-slate-900">
                  BÁO CÁO TỔNG HỢP THU CHI & DOANH THU
                </h1>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                  {formatMonthVN(monthStr)}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-6 min-w-[400px]">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-300 font-semibold text-slate-700 uppercase">
                      <th className="p-2 border-r border-slate-300">Khoản Mục Thu Chi</th>
                      <th className="p-2 border-r border-slate-300 text-center w-16">Số GD</th>
                      <th className="p-2 text-right w-36">Thành Tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {/* DOANH THU */}
                    <tr className="bg-emerald-100 font-bold font-sans text-emerald-950">
                      <td colSpan={2} className="p-2 border-r border-slate-300 uppercase">
                        DOANH THU (THU)
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-800">
                        {formatVND(
                          transactions
                            .filter((t) => t.type === 'thu')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )}
                      </td>
                    </tr>
                    {incomeCategories.map((cat) => {
                      const catTxs = transactions.filter((t) => t.categoryId === cat.id);
                      const sum = catTxs.reduce((s, t) => s + t.amount, 0);
                      return (
                        <tr key={cat.id}>
                          <td className="p-1.5 pl-4 sm:pl-6 font-sans border-r border-slate-300">{cat.name}</td>
                          <td className="p-1.5 text-center border-r border-slate-300">{catTxs.length || '-'}</td>
                          <td className="p-1.5 text-right">{formatVND(sum)}</td>
                        </tr>
                      );
                    })}

                    {/* CHI PHÍ */}
                    <tr className="bg-indigo-100 font-bold font-sans text-indigo-950">
                      <td colSpan={2} className="p-2 border-r border-slate-300 uppercase">
                        CHI PHÍ
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-rose-700">
                        {formatVND(
                          transactions
                            .filter((t) => t.type === 'chi')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )}
                      </td>
                    </tr>
                    {expenseCategories.map((cat) => {
                      const catTxs = transactions.filter((t) => t.categoryId === cat.id);
                      const sum = catTxs.reduce((s, t) => s + t.amount, 0);
                      return (
                        <tr key={cat.id}>
                          <td className="p-1.5 pl-4 sm:pl-6 font-sans border-r border-slate-300">{cat.name}</td>
                          <td className="p-1.5 text-center border-r border-slate-300">{catTxs.length || '-'}</td>
                          <td className="p-1.5 text-right">{formatVND(sum)}</td>
                        </tr>
                      );
                    })}

                    {/* LỜI LỖ */}
                    {(() => {
                      const rev = transactions
                        .filter((t) => t.type === 'thu')
                        .reduce((s, t) => s + t.amount, 0);
                      const exp = transactions
                        .filter((t) => t.type === 'chi')
                        .reduce((s, t) => s + t.amount, 0);
                      const profit = rev - exp;
                      const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0';
                      return (
                        <>
                          <tr className="bg-amber-100 font-bold font-sans border-t-2 border-slate-400">
                            <td colSpan={2} className="p-2 uppercase border-r border-slate-300">
                              LỜI / LỖ (THẶNG DƯ)
                            </td>
                            <td
                              className={`p-2 text-right font-mono font-extrabold text-sm sm:text-base ${
                                profit >= 0 ? 'text-emerald-800' : 'text-rose-700'
                              }`}
                            >
                              {formatVND(profit)}
                            </td>
                          </tr>
                          <tr className="bg-slate-50 font-semibold font-sans text-xs">
                            <td colSpan={2} className="p-2 uppercase border-r border-slate-300">
                              % ON REV (TỶ SUẤT)
                            </td>
                            <td className="p-2 text-right font-mono font-bold">{margin}%</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center mt-8 sm:mt-12 pt-4 text-[11px] sm:text-xs">
                <div>
                  <div className="font-bold text-slate-800">
                    {isBusiness ? 'Người Lập Biểu / Thủ Quỹ' : 'Người Ghi Chép / Lập Sổ'}
                  </div>
                  <div className="italic text-slate-400 mt-0.5">(Ký, họ tên)</div>
                  <div className="mt-12 font-medium text-slate-800">
                    {isBusiness ? schoolConfig.treasurerName : familyConfig?.managerName || 'Người lập sổ'}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-800">
                    {isBusiness ? 'Hiệu Trưởng / Chủ Trường' : 'Chủ Hộ / Vợ Chồng Phê Duyệt'}
                  </div>
                  <div className="italic text-slate-400 mt-0.5">(Ký, họ tên)</div>
                  <div className="mt-12 font-medium text-slate-800">
                    {isBusiness ? schoolConfig.principalName : familyConfig?.approverName || 'Chủ hộ'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
