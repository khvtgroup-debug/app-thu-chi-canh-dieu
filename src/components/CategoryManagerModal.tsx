import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, ArrowLeft, FolderPlus, RotateCcw, Target } from 'lucide-react';
import { CategoryItem, TransactionType, Transaction } from '../types/finance';
import { formatVND } from '../utils/formatters';

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
  const [editMonthlyBudget, setEditMonthlyBudget] = useState('');

  // Form for adding new category
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('Chi phí vận hành');
  const [newMonthlyBudget, setNewMonthlyBudget] = useState('');

  // In-app confirmation dialogs (safe for iframes)
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<{ cat: CategoryItem; count: number } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setEditMonthlyBudget(cat.monthlyBudget ? String(cat.monthlyBudget) : '');
  };

  const handleSaveEdit = (catId: string) => {
    if (!editName.trim()) {
      setErrorMsg('Tên danh mục không được để trống');
      return;
    }
    setErrorMsg(null);
    const budgetNum = Number(editMonthlyBudget);
    onUpdateCategory(catId, {
      name: editName.trim(),
      group: editGroup.trim() || (activeType === 'thu' ? 'Khoản thu' : 'Chi phí'),
      monthlyBudget: budgetNum > 0 ? budgetNum : undefined,
    });
    setEditingId(null);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Vui lòng nhập tên danh mục mới');
      return;
    }
    setErrorMsg(null);
    const budgetNum = Number(newMonthlyBudget);
    onAddCategory({
      name: newName.trim(),
      type: activeType,
      group: newGroup.trim() || (activeType === 'thu' ? 'Khoản thu' : 'Chi phí'),
      monthlyBudget: budgetNum > 0 ? budgetNum : undefined,
    });
    setNewName('');
    setNewMonthlyBudget('');
    setIsAddingNew(false);
  };

  const handleDelete = (cat: CategoryItem) => {
    const count = getTxCount(cat.id);
    setDeleteConfirmCat({ cat, count });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
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
                Quản Lý Danh Mục & Hạn Mức Chi Tiêu
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Thêm, sửa đổi tên và thiết lập hạn mức ngân sách tháng để nhận cảnh báo tự động
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
              onClick={() => setShowResetConfirm(true)}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>
          </div>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-800 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <input
                  type="text"
                  required
                  placeholder={
                    activeType === 'thu'
                      ? 'Tên mục (Lương, Thưởng, Bán hàng...)'
                      : 'Tên mục (Đi chợ, Tiền điện, Xăng xe...)'
                  }
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-emerald-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Tên nhóm (Bếp ăn, Tiện ích, Con cái...)"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-emerald-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  placeholder="Hạn mức tháng (VNĐ) - Tùy chọn"
                  value={newMonthlyBudget}
                  onChange={(e) => setNewMonthlyBudget(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-mono focus:outline-emerald-500"
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
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editName}
                      placeholder="Tên danh mục"
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-2.5 py-1 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:outline-emerald-500"
                    />
                    <input
                      type="text"
                      value={editGroup}
                      placeholder="Nhóm phân loại"
                      onChange={(e) => setEditGroup(e.target.value)}
                      className="px-2.5 py-1 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:outline-emerald-500"
                    />
                    <input
                      type="number"
                      min="0"
                      step="100000"
                      placeholder="Hạn mức tháng (VNĐ)"
                      value={editMonthlyBudget}
                      onChange={(e) => setEditMonthlyBudget(e.target.value)}
                      className="px-2.5 py-1 text-xs sm:text-sm border border-slate-300 rounded-md bg-white font-mono focus:outline-emerald-500"
                    />
                  </div>
                ) : (
                  // Normal view mode
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {cat.monthlyBudget && cat.monthlyBudget > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          <Target className="w-3 h-3 text-indigo-600" />
                          <span>Hạn mức: {formatVND(cat.monthlyBudget)}/th</span>
                        </span>
                      ) : activeType === 'chi' ? (
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="text-[10px] text-slate-400 hover:text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <Target className="w-2.5 h-2.5" />
                          <span>+ Đặt hạn mức</span>
                        </button>
                      ) : null}
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
                        title="Sửa tên & hạn mức danh mục"
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

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Xác nhận xóa danh mục?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Danh mục "{deleteConfirmCat.cat.name}" sẽ bị xóa.
            </p>

            {deleteConfirmCat.count > 0 && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-left text-xs mb-4 text-amber-800">
                Danh mục này đang có <strong>{deleteConfirmCat.count}</strong> giao dịch trong hệ thống. Xóa danh mục sẽ không xóa lịch sử giao dịch.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                className="w-full py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCategory(deleteConfirmCat.cat.id);
                  setDeleteConfirmCat(null);
                }}
                className="w-full py-2.5 px-3 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Khôi phục danh mục gốc?
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Toàn bộ danh mục sẽ được đặt lại theo danh sách tiêu chuẩn của hệ thống.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDefaultCategories();
                  setShowResetConfirm(false);
                }}
                className="w-full py-2.5 px-3 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
