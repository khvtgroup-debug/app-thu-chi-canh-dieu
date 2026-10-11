import React, { useState, useEffect } from 'react';
import { X, Check, ArrowLeft, Target, AlertTriangle } from 'lucide-react';
import { CategoryItem, TransactionType } from '../types/finance';
import { formatVND } from '../utils/formatters';

interface CategoryQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    cat: { name: string; type: TransactionType; group: string; monthlyBudget?: number },
    existingId?: string
  ) => void;
  editingCategory?: CategoryItem | null;
  defaultType?: TransactionType;
}

export const CategoryQuickModal: React.FC<CategoryQuickModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCategory,
  defaultType = 'chi',
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [group, setGroup] = useState('');
  const [monthlyBudgetStr, setMonthlyBudgetStr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setErrorMsg(null);
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setGroup(editingCategory.group || '');
      setMonthlyBudgetStr(
        editingCategory.monthlyBudget && editingCategory.monthlyBudget > 0
          ? String(editingCategory.monthlyBudget)
          : ''
      );
    } else {
      setName('');
      setType(defaultType);
      setGroup(defaultType === 'thu' ? 'Khoản thu chính' : 'Chi phí vận hành');
      setMonthlyBudgetStr('');
    }
  }, [editingCategory, defaultType, isOpen]);

  if (!isOpen) return null;

  const budgetNum = Number(monthlyBudgetStr) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên hạng mục');
      return;
    }
    setErrorMsg(null);

    const budgetVal = budgetNum > 0 ? budgetNum : undefined;

    onSave(
      {
        name: name.trim(),
        type,
        group: group.trim() || (type === 'thu' ? 'Khoản thu' : 'Chi phí'),
        monthlyBudget: budgetVal,
      },
      editingCategory ? editingCategory.id : undefined
    );
    onClose();
  };

  const BUDGET_PRESETS = [
    { label: 'Không giới hạn', value: 0 },
    { label: '1 Triệu', value: 1000000 },
    { label: '2 Triệu', value: 2000000 },
    { label: '3 Triệu', value: 3000000 },
    { label: '5 Triệu', value: 5000000 },
    { label: '10 Triệu', value: 10000000 },
    { label: '15 Triệu', value: 15000000 },
    { label: '20 Triệu', value: 20000000 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {editingCategory ? 'Sửa Hạng Mục & Hạn Mức' : 'Thêm Hạng Mục Mới'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Cài đặt tên và ngân sách chi tiêu tối đa hàng tháng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-sm overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
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
          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Phân Loại Hạng Mục
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('thu')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  type === 'thu'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Hạng Mục Thu (Doanh Thu)
              </button>
              <button
                type="button"
                onClick={() => setType('chi')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  type === 'chi'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Hạng Mục Chi (Chi Phí)
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tên Hạng Mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder={
                type === 'thu'
                  ? 'Ví dụ: Lương, Thưởng, Bán hàng, Tiền phòng...'
                  : 'Ví dụ: Đi chợ, Tiền điện, Học phí, Xăng xe, Sữa bỉm...'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white"
            />
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nhóm Phân Loại
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Bếp ăn, Tiện ích, Con cái, Đi lại, Sức khỏe..."
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white"
            />
          </div>

          {/* Monthly Budget Setting */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-800 uppercase flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Hạn Mức Ngân Sách Tháng (VNĐ)</span>
              </label>
              {budgetNum > 0 && (
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  {formatVND(budgetNum)}/tháng
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Hệ thống sẽ tự động kích hoạt cảnh báo màu vàng khi chi chạm 80% và màu đỏ khi vượt 100% hạn mức này trên Bảng Tính.
            </p>

            <div className="relative">
              <input
                type="number"
                min="0"
                step="100000"
                placeholder="Nhập số tiền hạn mức (e.g. 5000000) hoặc bấm chọn nhanh bên dưới"
                value={monthlyBudgetStr}
                onChange={(e) => setMonthlyBudgetStr(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-indigo-500 bg-white"
              />
              {monthlyBudgetStr && (
                <button
                  type="button"
                  onClick={() => setMonthlyBudgetStr('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Budget Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {BUDGET_PRESETS.map((p) => {
                const isActive = budgetNum === p.value;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setMonthlyBudgetStr(p.value > 0 ? String(p.value) : '')}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info note */}
          <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Đặt hạn mức chi tiêu giúp bạn kiểm soát ngân sách hiệu quả và nhận chỉ báo trực quan trên Bảng Tính.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingCategory ? 'Lưu Thay Đổi' : 'Tạo Hạng Mục'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
