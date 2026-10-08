import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, ArrowLeft, FolderPlus, RotateCcw } from 'lucide-react';
import { CategoryItem, TransactionType, Transaction } from '../types/finance';
import { ALL_CATEGORIES } from '../data/defaultCategories';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  transactions: Transaction[];
  onAddCategory: (category: Omit<CategoryItem, 'id'>) => void;
  onUpdateCategory: (id: string, updated: Partial<CategoryItem>) => void;
  onDeleteCategory: (id: string) => void;
  onResetDefaultCategories: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  transactions,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetDefaultCategories,
}) => {
  const [activeType, setActiveType] = useState<TransactionType>('chi');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState('');

  // Form for adding new category
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('Chi phí vận hành');

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === activeType);

  // Count transactions per category
  const getTxCount = (catId: string) => {
    return transactions.filter((t) => t.categoryId === catId).length;
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditGroup(cat.group || '');
  };

  const handleSaveEdit = (catId: string) => {
    if (!editName.trim()) {
      alert('Tên danh mục không được để trống');
      return;
    }
    onUpdateCategory(catId, {
      name: editName.trim(),
      group: editGroup.trim() || (activeType === 'thu' ? 'Khoản thu' : 'Chi phí'),
    });
    setEditingId(null);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }
    onAddCategory({
      name: newName.trim(),
      type: activeType,
      group: newGroup.trim() || (activeType === 'thu' ? 'Khoản thu' : 'Chi phí'),
    });
    setNewName('');
    setIsAddingNew(false);
  };

  const handleDelete = (cat: CategoryItem) => {
    const count = getTxCount(cat.id);
    const confirmMsg =
      count > 0
        ? `Danh mục "${cat.name}" hiện đang có ${count} giao dịch trong hệ thống.\n\nBạn có chắc chắn muốn xóa danh mục này không?`
        : `Bạn có chắc muốn xóa danh mục "${cat.name}" không?`;

    if (window.confirm(confirmMsg)) {
      onDeleteCategory(cat.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header with Back button */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              title="Quay lại"
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Quản Lý Danh Mục Thu & Chi
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Thêm, sửa đổi tên và xóa các hạng mục theo nhu cầu của trường
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

        {/* Type Switcher Tabs (Thu / Chi) */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setActiveType('chi');
                setIsAddingNew(false);
                setEditingId(null);
              }}
              className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeType === 'chi'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Danh Mục Khoản Chi ({categories.filter((c) => c.type === 'chi').length})
            </button>
            <button
              onClick={() => {
                setActiveType('thu');
                setIsAddingNew(false);
                setEditingId(null);
              }}
              className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeType === 'thu'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Danh Mục Khoản Thu ({categories.filter((c) => c.type === 'thu').length})
            </button>
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setIsAddingNew(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Hạng Mục {activeType === 'thu' ? 'Thu' : 'Chi'} Mới</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Khôi phục danh mục về danh sách gốc ban đầu của trường mầm non?')) {
                  onResetDefaultCategories();
                }
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>
          </div>
        </div>

        {/* Add New Category Form (Inline) */}
        {isAddingNew && (
          <form
            onSubmit={handleCreateCategory}
            className={`p-3 sm:p-4 border-b text-xs sm:text-sm space-y-2.5 ${
              activeType === 'thu'
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <div className={`font-semibold flex items-center gap-1.5 ${
              activeType === 'thu' ? 'text-emerald-950' : 'text-rose-950'
            }`}>
              <FolderPlus className={`w-4 h-4 ${activeType === 'thu' ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>Tạo danh mục {activeType === 'thu' ? 'Khoản Thu' : 'Khoản Chi'} mới:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  required
                  placeholder={
                    activeType === 'thu'
                      ? 'Ví dụ: Xe đưa đón, Đồng phục, Balo, Năng khiếu...'
                      : 'Ví dụ: Sửa máy lạnh, Gas, Thực phẩm, Đồ chơi...'
                  }
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-red-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Tên nhóm (Vận hành, Nhân sự, Bếp ăn, Học liệu...)"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-md cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`px-4 py-1 text-xs font-semibold text-white rounded-md cursor-pointer shadow-2xs ${
                  activeType === 'thu'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Xác Nhận Thêm
              </button>
            </div>
          </form>
        )}

        {/* Category List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 divide-y divide-slate-100 text-xs sm:text-sm">
          {filteredCategories.map((cat, idx) => {
            const isEditing = editingId === cat.id;
            const count = getTxCount(cat.id);

            return (
              <div
                key={cat.id}
                className="py-2.5 sm:py-3 flex items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-lg transition-colors"
              >
                {isEditing ? (
                  // Editing mode
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-2.5 py-1 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:outline-emerald-500"
                    />
                    <input
                      type="text"
                      value={editGroup}
                      onChange={(e) => setEditGroup(e.target.value)}
                      className="px-2.5 py-1 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:outline-emerald-500"
                    />
                  </div>
                ) : (
                  // Normal view mode
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400 w-4">
                        {idx + 1}.
                      </span>
                      <span className="font-semibold text-slate-900 truncate">
                        {cat.name}
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {count} GD
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 ml-6">
                      Nhóm: {cat.group || 'Chung'}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md cursor-pointer"
                        title="Lưu"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md cursor-pointer"
                        title="Hủy"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md cursor-pointer transition-colors"
                        title="Sửa tên danh mục"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Tổng cộng: {filteredCategories.length} danh mục {activeType === 'thu' ? 'thu' : 'chi'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Quay Lại Bảng Tính
          </button>
        </div>
      </div>
    </div>
  );
};
