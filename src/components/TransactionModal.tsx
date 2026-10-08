import React, { useState, useEffect } from 'react';
import { X, Check, ArrowUpRight, ArrowDownRight, ArrowLeft, Plus } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, CategoryItem } from '../types/finance';
import { getCurrentDateStr, formatNumber, numberToVietnameseWords } from '../utils/formatters';

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
}) => {
  const [type, setType] = useState<TransactionType>('chi');
  const [categoryId, setCategoryId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(getCurrentDateStr());
  const [payerOrReceiver, setPayerOrReceiver] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('chuyen_khoan');
  const [note, setNote] = useState('');

  const currentCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (editingTx) {
      setType(editingTx.type);
      setCategoryId(editingTx.categoryId);
      setAmountStr(String(editingTx.amount));
      setDate(editingTx.date);
      setPayerOrReceiver(editingTx.payerOrReceiver || '');
      setPaymentMethod(editingTx.paymentMethod || 'chuyen_khoan');
      setNote(editingTx.note || '');
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
    }
  }, [editingTx, defaultCategory, isOpen, currentMonth, categories]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      alert('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

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
      },
      editingTx ? editingTx.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header with Back button */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
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
                {editingTx ? 'Chỉnh Sửa Giao Dịch' : 'Thêm Khoản Thu / Chi'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Cập nhật vào sổ tài chính trường mầm non
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 text-sm">
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
                <span>Thu (Doanh Thu)</span>
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
                <span>Chi (Chi Phí)</span>
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
                <option value="chuyen_khoan">Chuyển khoản</option>
                <option value="tien_mat">Tiền mặt</option>
                <option value="khac">Khác</option>
              </select>
            </div>
          </div>

          {/* Payer or Receiver */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {type === 'thu' ? 'Người Nộp Tiền (Phụ huynh / Học sinh)' : 'Người Nhận Tiền / Nhà Cung Cấp'}
            </label>
            <input
              type="text"
              placeholder={
                type === 'thu'
                  ? 'Ví dụ: Phụ huynh bé Tuấn Kiệt...'
                  : 'Ví dụ: Thầy David tiếng Anh, HTX rau sạch...'
              }
              value={payerOrReceiver}
              onChange={(e) => setPayerOrReceiver(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 bg-white"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nội Dung Ghi Chú / Diễn Giải
            </label>
            <textarea
              rows={2}
              placeholder="Ghi rõ chi tiết khoản thu/chi để tiện đối soát..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 bg-white resize-none"
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
  );
};
