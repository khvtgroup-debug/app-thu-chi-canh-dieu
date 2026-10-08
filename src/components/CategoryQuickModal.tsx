import React, { useState, useEffect } from 'react';
import { X, Check, ArrowLeft, FolderPlus, Edit3 } from 'lucide-react';
import { CategoryItem, TransactionType } from '../types/finance';

interface CategoryQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cat: { name: string; type: TransactionType; group: string }, existingId?: string) => void;
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

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setGroup(editingCategory.group || '');
    } else {
      setName('');
      setType(defaultType);
      setGroup(defaultType === 'thu' ? 'Khoản thu chính' : 'Chi phí vận hành');
    }
  }, [editingCategory, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên hạng mục');
      return;
    }

    onSave(
      {
        name: name.trim(),
        type,
        group: group.trim() || (type === 'thu' ? 'Khoản thu' : 'Chi phí'),
      },
      editingCategory ? editingCategory.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {editingCategory ? 'Sửa Tên Hạng Mục' : 'Thêm Hạng Mục Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-sm">
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
              placeholder={type === 'thu' ? 'Ví dụ: Xe đưa đón, Đồng phục, Balo...' : 'Ví dụ: Bảo dưỡng máy lạnh, Gas, Gạo...'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-red-500 bg-white"
            />
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nhóm Phân Loại
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Nhân sự, Bếp ăn, Học liệu, CSVC, Tiện ích..."
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-red-500 bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
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
