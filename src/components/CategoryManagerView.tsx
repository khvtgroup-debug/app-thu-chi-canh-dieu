import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, RotateCcw, ArrowLeft, ArrowUpRight, ArrowDownRight, FolderPlus } from 'lucide-react';
import { CategoryItem, TransactionType, Transaction } from '../types/finance';

interface CategoryManagerViewProps {
  categories: CategoryItem[];
  transactions: Transaction[];
  onOpenAddModal: (type: TransactionType) => void;
  onOpenEditModal: (cat: CategoryItem) => void;
  onDeleteCategory: (id: string) => void;
  onResetDefaultCategories: () => void;
  onBackToSpreadsheet: () => void;
}

export const CategoryManagerView: React.FC<CategoryManagerViewProps> = ({
  categories,
  transactions,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteCategory,
  onResetDefaultCategories,
  onBackToSpreadsheet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'thu' | 'chi'>('all');

  const getTxCount = (catId: string) => {
    return transactions.filter((t) => t.categoryId === catId).length;
  };

  const incomeCategories = categories.filter((c) => c.type === 'thu');
  const expenseCategories = categories.filter((c) => c.type === 'chi');

  const filteredIncome = incomeCategories.filter((c) => {
    if (searchTerm.trim() === '') return true;
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.group || '').toLowerCase().includes(q);
  });

  const filteredExpense = expenseCategories.filter((c) => {
    if (searchTerm.trim() === '') return true;
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.group || '').toLowerCase().includes(q);
  });

  const handleDelete = (cat: CategoryItem) => {
    const count = getTxCount(cat.id);
    const msg =
      count > 0
        ? `Hạng mục "${cat.name}" hiện có ${count} giao dịch trong sổ thu chi.\n\nBạn có chắc chắn muốn xóa hạng mục này không?`
        : `Bạn có chắc muốn xóa hạng mục "${cat.name}" không?`;

    if (window.confirm(msg)) {
      onDeleteCategory(cat.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSpreadsheet}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Bảng Tính</span>
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Quản Lý Danh Mục Hạng Mục Thu & Chi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thêm mới, sửa tên và xóa các hạng mục để phù hợp với hoạt động của trường
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Khôi phục danh mục về danh sách chuẩn ban đầu của trường mầm non?')) {
                  onResetDefaultCategories();
                }
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm tên hạng mục hoặc nhóm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-red-500 bg-slate-50 hover:bg-white focus:bg-white"
            />
          </div>

          {/* Quick Add Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddModal('thu')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Hạng Mục Thu</span>
            </button>
            <button
              onClick={() => onOpenAddModal('chi')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Hạng Mục Chi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns (Khoản Thu & Khoản Chi) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ================= COLUMN 1: KHOẢN THU (DOANH THU) ================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                <ArrowUpRight className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-emerald-950 text-sm">
                Danh Mục Khoản Thu ({filteredIncome.length})
              </h3>
            </div>
            <button
              onClick={() => onOpenAddModal('thu')}
              className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm mới</span>
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 overflow-y-auto max-h-[600px] flex-1">
            {filteredIncome.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Không tìm thấy hạng mục thu nào phù hợp
              </div>
            ) : (
              filteredIncome.map((cat, idx) => {
                const count = getTxCount(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="py-2.5 px-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between gap-2 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {cat.name}
                        </span>
                        {count > 0 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                            {count} GD
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 ml-5">
                        Nhóm: {cat.group || 'Chung'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditModal(cat)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        title="Sửa tên hạng mục"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Xóa hạng mục"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => onOpenAddModal('thu')}
              className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm hạng mục thu mới</span>
            </button>
          </div>
        </div>

        {/* ================= COLUMN 2: KHOẢN CHI (CHI PHÍ) ================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-rose-100 text-rose-800">
                <ArrowDownRight className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-rose-950 text-sm">
                Danh Mục Khoản Chi ({filteredExpense.length})
              </h3>
            </div>
            <button
              onClick={() => onOpenAddModal('chi')}
              className="text-xs font-semibold text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm mới</span>
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 overflow-y-auto max-h-[600px] flex-1">
            {filteredExpense.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Không tìm thấy hạng mục chi nào phù hợp
              </div>
            ) : (
              filteredExpense.map((cat, idx) => {
                const count = getTxCount(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="py-2.5 px-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between gap-2 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {cat.name}
                        </span>
                        {count > 0 && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                            {count} GD
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 ml-5">
                        Nhóm: {cat.group || 'Chung'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditModal(cat)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        title="Sửa tên hạng mục"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Xóa hạng mục"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => onOpenAddModal('chi')}
              className="text-xs font-semibold text-rose-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm hạng mục chi mới</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
