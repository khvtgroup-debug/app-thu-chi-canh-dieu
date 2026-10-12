import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Plus,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Eye,
  Trash2,
  RefreshCw,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, CategoryItem, AppMode } from '../types/finance';
import { getCurrentDateStr, formatNumber, numberToVietnameseWords } from '../utils/formatters';
import { compressImageFile } from '../utils/imageCompressor';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  editingTx?: Transaction | null;
  defaultCategory?: CategoryItem | null;
  defaultType?: TransactionType;
  currentMonth: string;
  categories: CategoryItem[];
  onOpenAddCategory?: (type: TransactionType) => void;
  mode?: AppMode;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTx,
  defaultCategory,
  defaultType,
  currentMonth,
  categories,
  onOpenAddCategory,
  mode = 'business',
}) => {
  const isBusiness = mode === 'business';
  const [type, setType] = useState<TransactionType>('chi');
  const [categoryId, setCategoryId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(getCurrentDateStr());
  const [payerOrReceiver, setPayerOrReceiver] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('chuyen_khoan');
  const [note, setNote] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSummary, setScanSummary] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    setErrorMsg(null);
    setScanSummary(null);
    if (editingTx) {
      setType(editingTx.type);
      setCategoryId(editingTx.categoryId);
      setAmountStr(String(editingTx.amount));
      setDate(editingTx.date);
      setPayerOrReceiver(editingTx.payerOrReceiver || '');
      setPaymentMethod(editingTx.paymentMethod || 'chuyen_khoan');
      setNote(editingTx.note || '');
      setReferenceCode(editingTx.referenceCode || '');
      setReceiptImage(editingTx.receiptImage);
      if (editingTx.receiptImage) {
        const base64Len = editingTx.receiptImage.length;
        setImageSizeKb(Math.round((base64Len * 3) / 4 / 1024));
      } else {
        setImageSizeKb(null);
      }
    } else {
      const initialType = defaultCategory ? defaultCategory.type : (defaultType || 'chi');
      setType(initialType);

      const targetCats = categories.filter((c) => c.type === initialType);
      setCategoryId(defaultCategory ? defaultCategory.id : targetCats[0]?.id || '');

      const today = getCurrentDateStr();
      if (today.startsWith(currentMonth)) {
        setDate(today);
      } else {
        setDate(`${currentMonth}-01`);
      }

      setAmountStr('');
      setPayerOrReceiver('');
      setPaymentMethod('chuyen_khoan');
      setNote('');
      setReferenceCode('');
      setReceiptImage(undefined);
      setImageSizeKb(null);
    }
  }, [editingTx, defaultCategory, isOpen, currentMonth, categories, defaultType]);

  if (!isOpen) return null;

  const numAmount = parseInt(amountStr.replace(/\D/g, '') || '0', 10);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const targetCats = categories.filter((c) => c.type === newType);
    setCategoryId(targetCats[0]?.id || '');
  };

  const handleAddPreset = (addValue: number) => {
    const nextVal = numAmount + addValue;
    setAmountStr(String(nextVal));
  };

  // Image Processing & Compression
  const handleProcessImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file hình ảnh (JPEG, PNG, WebP).');
      return;
    }
    setIsCompressing(true);
    setErrorMsg(null);
    setScanSummary(null);

    try {
      const compressed = await compressImageFile(file, 1280, 1280, 0.8);
      setReceiptImage(compressed.dataUrl);
      setImageSizeKb(compressed.sizeKb);

      // Auto-trigger AI Scan to extract details
      triggerAIScan(compressed.dataUrl);
    } catch (err: any) {
      console.error('Lỗi nén ảnh:', err);
      setErrorMsg('Không thể xử lý hình ảnh này. Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsCompressing(false);
      // Reset input values so user can re-select same file if needed
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Scan receipt with AI backend
  const triggerAIScan = async (imgDataUrl: string) => {
    setIsScanning(true);
    setScanSummary(null);

    try {
      const res = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imgDataUrl,
          mode,
          currentCategories: categories,
        }),
      });

      const data = await res.json();
      if (data.success && data.extracted) {
        const ext = data.extracted;

        if (typeof ext.amount === 'number' && ext.amount > 0) {
          setAmountStr(String(ext.amount));
        }

        if (ext.type === 'thu' || ext.type === 'chi') {
          setType(ext.type);
        }

        if (ext.date && /^\d{4}-\d{2}-\d{2}$/.test(ext.date)) {
          setDate(ext.date);
        }

        if (ext.payerOrReceiver) {
          setPayerOrReceiver(ext.payerOrReceiver);
        }

        if (ext.note) {
          setNote(ext.note);
        }

        if (ext.referenceCode) {
          setReferenceCode(ext.referenceCode);
        }

        if (ext.paymentMethod) {
          setPaymentMethod(ext.paymentMethod);
        }

        if (ext.matchedCategoryId) {
          const found = categories.find((c) => c.id === ext.matchedCategoryId);
          if (found) {
            setCategoryId(found.id);
          }
        }

        setScanSummary(
          ext.aiSummary ||
            `✨ AI đã đọc thành công: ${ext.amount ? formatNumber(ext.amount) + ' đ' : ''} - ${
              ext.note || 'Biên lai'
            }`
        );
      }
    } catch (scanErr) {
      console.error('AI Scan Error:', scanErr);
      // Keep receipt image attached even if AI scanning fails
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveImage = () => {
    setReceiptImage(undefined);
    setImageSizeKb(null);
    setScanSummary(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMsg('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }
    setErrorMsg(null);

    const selectedCat = categories.find((c) => c.id === categoryId);
    const categoryName = selectedCat ? selectedCat.name : 'Khác';
    const txMonth = date.substring(0, 7);

    onSave(
      {
        date,
        month: txMonth,
        type,
        categoryId,
        categoryName,
        amount: numAmount,
        note: note.trim(),
        payerOrReceiver: payerOrReceiver.trim(),
        paymentMethod,
        referenceCode: referenceCode.trim() || undefined,
        receiptImage: receiptImage || undefined,
      },
      editingTx ? editingTx.id : undefined
    );
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
          {/* Header with Back button */}
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                title="Quay lại"
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {editingTx ? 'Chỉnh Sửa Giao Dịch' : 'Thêm Khoản Thu / Chi Mới'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {isBusiness ? 'Sổ tài chính trường mầm non' : 'Sổ thu chi & kế hoạch tài chính gia đình'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden file inputs for Camera and Gallery */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessImage(e.target.files[0]);
              }
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessImage(e.target.files[0]);
              }
            }}
          />

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 text-sm">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-rose-500 hover:text-rose-800 font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* SEPARATE SECTION: Chụp hình hoặc tải lên hóa đơn / biên nhận chuyển khoản */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Hóa Đơn / Biên Nhận Chuyển Khoản
                  </span>
                </div>
                {receiptImage && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Đã lưu ảnh {imageSizeKb ? `(${imageSizeKb} KB)` : ''}</span>
                  </span>
                )}
              </div>

              {!receiptImage ? (
                <div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Chụp hình hóa đơn giấy hoặc tải ảnh chụp màn hình chuyển khoản ngân hàng. AI sẽ tự động đọc số tiền & nội dung!
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isCompressing || isScanning}
                      onClick={() => cameraInputRef.current?.click()}
                      className="py-2 px-3 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Chụp Ảnh Ngay</span>
                    </button>
                    <button
                      type="button"
                      disabled={isCompressing || isScanning}
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Tải Ảnh Lên</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                    <div
                      onClick={() => setIsPreviewModalOpen(true)}
                      className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group"
                      title="Bấm để xem ảnh lớn"
                    >
                      <img
                        src={receiptImage}
                        alt="Biên nhận / Hóa đơn"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 text-xs">
                      <div className="font-semibold text-slate-900 truncate">Ảnh chứng từ đính kèm</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Dung lượng tối ưu: ~{imageSizeKb || 120} KB
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setIsPreviewModalOpen(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Xem ảnh lớn</span>
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => triggerAIScan(receiptImage)}
                          disabled={isScanning}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-800 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Quét lại AI</span>
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa ảnh</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Status / Notification */}
                  {isScanning && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-800 rounded-lg text-xs animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      <span>AI đang quét và trích xuất số tiền & nội dung từ hóa đơn...</span>
                    </div>
                  )}

                  {scanSummary && !isScanning && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs animate-in fade-in">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-relaxed">{scanSummary}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Type Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Loại Giao Dịch
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('thu')}
                  className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'thu'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Thu (Doanh Thu / Thu Tiền)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('chi')}
                  className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'chi'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Chi (Khoản Chi / Mua Sắm)</span>
                </button>
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Số Tiền (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  required
                  placeholder="0"
                  value={numAmount > 0 ? formatNumber(numAmount) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setAmountStr(raw);
                  }}
                  className="w-full text-right font-mono text-xl sm:text-2xl font-bold px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-xl focus:outline-emerald-500 bg-white text-slate-900"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-semibold text-slate-400">
                  VNĐ
                </span>
              </div>

              {numAmount > 0 && (
                <div className="text-[11px] sm:text-xs text-emerald-700 font-medium italic mt-1.5 px-1 bg-emerald-50/60 py-1 rounded">
                  Bằng chữ: {numberToVietnameseWords(numAmount)}
                </div>
              )}

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => handleAddPreset(100000)}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono cursor-pointer"
                >
                  +100k
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset(500000)}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono cursor-pointer"
                >
                  +500k
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset(1000000)}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono cursor-pointer"
                >
                  +1tr
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset(2000000)}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono cursor-pointer"
                >
                  +2tr
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset(5000000)}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono cursor-pointer"
                >
                  +5tr
                </button>
                <button
                  type="button"
                  onClick={() => setAmountStr('0')}
                  className="px-2 py-1 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md cursor-pointer ml-auto"
                >
                  Xóa
                </button>
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Hạng Mục ({type === 'thu' ? 'Khoản Thu' : 'Khoản Chi'}) <span className="text-rose-500">*</span>
                </label>
                {onOpenAddCategory && (
                  <button
                    type="button"
                    onClick={() => onOpenAddCategory(type)}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm hạng mục mới</span>
                  </button>
                )}
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 bg-white text-slate-900 cursor-pointer font-medium"
              >
                {currentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.group || 'Chung'})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ngày Giao Dịch
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hình Thức Thanh Toán
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 bg-white cursor-pointer"
                >
                  <option value="chuyen_khoan">Chuyển khoản (App/QR)</option>
                  <option value="tien_mat">Tiền mặt</option>
                  <option value="khac">Khác</option>
                </select>
              </div>
            </div>

            {/* Payer or Receiver */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {type === 'thu'
                  ? isBusiness
                    ? 'Người Nộp Tiền (Phụ huynh / Học sinh)'
                    : 'Người Đóng / Nguồn Thu (Vợ / Chồng / Khách)'
                  : isBusiness
                  ? 'Người Nhận Tiền / Nhà Cung Cấp'
                  : 'Nơi Chi / Người Nhận Tiền'}
              </label>
              <input
                type="text"
                placeholder={
                  type === 'thu'
                    ? isBusiness
                      ? 'Ví dụ: Phụ huynh bé Tuấn Kiệt...'
                      : 'Ví dụ: Lương công ty, Chồng gửi sinh hoạt phí...'
                    : isBusiness
                    ? 'Ví dụ: Thầy David tiếng Anh, HTX rau sạch...'
                    : 'Ví dụ: Siêu thị WinMart, Tiền điện EVN, Chợ đầu mối...'
                }
                value={payerOrReceiver}
                onChange={(e) => setPayerOrReceiver(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 bg-white"
              />
            </div>

            {/* Note & Reference Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nội Dung Ghi Chú / Diễn Giải
              </label>
              <textarea
                rows={2}
                placeholder="Ghi rõ chi tiết khoản thu/chi để tiện đối soát và tìm kiếm nhanh..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã Giao Dịch / Số Hóa Đơn <span className="text-slate-400 font-normal">(Tùy chọn)</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: FT24101189495, HD00234, Mã GD Vietcombank..."
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 bg-white font-mono text-xs"
              />
            </div>

            {/* Footer Actions */}
            <div className="pt-2 sm:pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay Lại</span>
              </button>
              <button
                type="submit"
                className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  type === 'thu'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{editingTx ? 'Lưu Thay Đổi' : 'Xác Nhận Thêm'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FULL-SIZE IMAGE PREVIEW MODAL */}
      {isPreviewModalOpen && receiptImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="px-4 py-3 bg-slate-800/90 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Chi tiết hóa đơn / Chứng từ ({imageSizeKb || 120} KB)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center bg-black/50 flex-1">
              <img
                src={receiptImage}
                alt="Hóa đơn phóng to"
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
            <div className="px-4 py-2.5 bg-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>Biên lai được lưu an toàn cùng giao dịch.</span>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
