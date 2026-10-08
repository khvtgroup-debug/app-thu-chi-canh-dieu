import React, { useState } from 'react';
import { Plus, CheckCircle, Clock, Printer, Search, UserCheck } from 'lucide-react';
import { StudentTuition, PaymentMethod } from '../types/finance';
import { formatVND, formatDateVN } from '../utils/formatters';

interface TuitionManagerProps {
  students: StudentTuition[];
  currentMonth: string;
  onConfirmPayment: (studentId: string, method: PaymentMethod, date: string) => void;
  onAddStudent: (student: Omit<StudentTuition, 'id'>) => void;
  onDeleteStudent: (id: string) => void;
  onPrintStudentReceipt: (student: StudentTuition) => void;
}

export const TuitionManager: React.FC<TuitionManagerProps> = ({
  students,
  currentMonth,
  onConfirmPayment,
  onAddStudent,
  onDeleteStudent,
  onPrintStudentReceipt,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const currentMonthStudents = students.filter((s) => s.month === currentMonth);

  const filteredStudents = currentMonthStudents.filter((s) => {
    if (selectedClass !== 'all' && s.className !== selectedClass) return false;
    if (statusFilter === 'paid' && !s.isPaid) return false;
    if (statusFilter === 'unpaid' && s.isPaid) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = s.studentName.toLowerCase().includes(q);
      const matchPhone = (s.parentPhone || '').includes(q);
      if (!matchName && !matchPhone) return false;
    }
    return true;
  });

  const totalStudents = currentMonthStudents.length;
  const paidCount = currentMonthStudents.filter((s) => s.isPaid).length;
  const unpaidCount = totalStudents - paidCount;

  const totalExpected = currentMonthStudents.reduce((sum, s) => sum + s.total, 0);
  const totalCollected = currentMonthStudents
    .filter((s) => s.isPaid)
    .reduce((sum, s) => sum + s.total, 0);
  const totalPending = totalExpected - totalCollected;

  const [newStudent, setNewStudent] = useState({
    studentName: '',
    className: 'Lớp Mầm (3-4 tuổi)',
    parentPhone: '',
    tuitionFee: 3200000,
    mealFee: 990000,
    facilityFee: 300000,
    extraActivitiesFee: 350000,
    otherFee: 0,
    discount: 0,
    note: '',
  });

  const handleAddNewStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.studentName.trim()) {
      alert('Vui lòng nhập họ tên bé');
      return;
    }

    const total =
      newStudent.tuitionFee +
      newStudent.mealFee +
      newStudent.facilityFee +
      newStudent.extraActivitiesFee +
      newStudent.otherFee -
      newStudent.discount;

    onAddStudent({
      month: currentMonth,
      studentName: newStudent.studentName.trim(),
      className: newStudent.className,
      parentPhone: newStudent.parentPhone.trim(),
      tuitionFee: Number(newStudent.tuitionFee),
      mealFee: Number(newStudent.mealFee),
      facilityFee: Number(newStudent.facilityFee),
      extraActivitiesFee: Number(newStudent.extraActivitiesFee),
      otherFee: Number(newStudent.otherFee),
      discount: Number(newStudent.discount),
      total: Math.max(0, total),
      isPaid: false,
      note: newStudent.note.trim(),
    });

    setIsAddModalOpen(false);
    setNewStudent({
      studentName: '',
      className: 'Lớp Mầm (3-4 tuổi)',
      parentPhone: '',
      tuitionFee: 3200000,
      mealFee: 990000,
      facilityFee: 300000,
      extraActivitiesFee: 350000,
      otherFee: 0,
      discount: 0,
      note: '',
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            <span>Tiến Độ Thu Học Phí</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {paidCount}/{totalStudents}
            </span>
            <span className="text-xs text-slate-500">
              bé đã nộp ({totalStudents > 0 ? ((paidCount / totalStudents) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2 mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${totalStudents > 0 ? (paidCount / totalStudents) * 100 : 0}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            <span>Đã Thu Trong Tháng</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {formatVND(totalCollected)}
          </div>
          <div className="mt-0.5 text-[11px] sm:text-xs text-slate-500">Đã cập nhật vào sổ quỹ thu</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            <span>Còn Phải Thu</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {formatVND(totalPending)}
          </div>
          <div className="mt-0.5 text-[11px] sm:text-xs text-slate-500">
            {unpaidCount} bé chưa nộp
          </div>
        </div>
      </div>

      {/* Main Student Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Danh Sách Học Phí Từng Bé
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Quản lý chi tiết học phí, tiền ăn, CSVC & in giấy báo nộp học phí
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Bé Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên bé hoặc SĐT phụ huynh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-emerald-500 bg-slate-50 hover:bg-white focus:bg-white"
              />
            </div>

            {/* Class filter */}
            <div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-emerald-500 bg-slate-50 hover:bg-white focus:bg-white cursor-pointer"
              >
                <option value="all">Tất cả các lớp học</option>
                <option value="Lớp Mầm (3-4 tuổi)">Lớp Mầm (3-4 tuổi)</option>
                <option value="Lớp Chồi (4-5 tuổi)">Lớp Chồi (4-5 tuổi)</option>
                <option value="Lớp Lá (5-6 tuổi)">Lớp Lá (5-6 tuổi)</option>
                <option value="Nhà Trẻ (18-36 tháng)">Nhà Trẻ (18-36 tháng)</option>
              </select>
            </div>

            {/* Status Segment */}
            <div className="flex items-center p-0.5 sm:p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({totalStudents})
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Đã nộp ({paidCount})
              </button>
              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'unpaid'
                    ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Chưa nộp ({unpaidCount})
              </button>
            </div>
          </div>
        </div>

        {/* Content list */}
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs px-4">
            Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <>
            {/* ================= MOBILE STUDENT CARDS (PHONE VIEW) ================= */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredStudents.map((stu) => (
                <div key={stu.id} className="p-3.5 hover:bg-slate-50 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {stu.studentName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {stu.className} {stu.parentPhone ? `· SĐT: ${stu.parentPhone}` : ''}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono tabular-nums font-bold text-sm text-slate-900">
                        {formatVND(stu.total)}
                      </div>
                      {stu.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle className="w-3 h-3" />
                          <span>Đã nộp</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <Clock className="w-3 h-3" />
                          <span>Chưa nộp</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fee Breakdown Pills */}
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>HP: <strong className="text-slate-700 font-mono">{formatVND(stu.tuitionFee)}</strong></span>
                    <span>Ăn: <strong className="text-slate-700 font-mono">{formatVND(stu.mealFee)}</strong></span>
                    <span>CSVC: <strong className="text-slate-700 font-mono">{formatVND(stu.facilityFee)}</strong></span>
                    {stu.extraActivitiesFee > 0 && (
                      <span>N.Khiếu: <strong className="text-slate-700 font-mono">{formatVND(stu.extraActivitiesFee)}</strong></span>
                    )}
                  </div>

                  {/* Action buttons on Mobile */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      {stu.paidDate ? `Nộp: ${formatDateVN(stu.paidDate)}` : ''}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPrintStudentReceipt(stu)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded-md flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>In phiếu</span>
                      </button>

                      {!stu.isPaid && (
                        <button
                          onClick={() => {
                            const method: PaymentMethod = window.confirm(
                              `Xác nhận bé ${stu.studentName} đã đóng ${formatVND(stu.total)}?\n\nBấm OK để ghi nhận Chuyển Khoản, bấm HỦY nếu là Tiền Mặt`
                            )
                              ? 'chuyen_khoan'
                              : 'tien_mat';
                            onConfirmPayment(
                              stu.id,
                              method,
                              new Date().toISOString().substring(0, 10)
                            );
                          }}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer shadow-2xs"
                        >
                          Thu Tiền
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ================= DESKTOP STUDENT TABLE (MACBOOK VIEW) ================= */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50/70 uppercase tracking-wider">
                    <th className="py-2.5 px-4 w-10 text-center">STT</th>
                    <th className="py-2.5 px-4 min-w-[170px]">Họ Tên Học Sinh</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Lớp Học</th>
                    <th className="py-2.5 px-3 text-right hidden sm:table-cell min-w-[100px]">Học Phí</th>
                    <th className="py-2.5 px-3 text-right hidden md:table-cell min-w-[90px]">Tiền Ăn</th>
                    <th className="py-2.5 px-3 text-right hidden lg:table-cell min-w-[80px]">CSVC</th>
                    <th className="py-2.5 px-3 text-right hidden lg:table-cell min-w-[90px]">Năng Khiếu</th>
                    <th className="py-2.5 px-4 text-right min-w-[130px]">Tổng Thu</th>
                    <th className="py-2.5 px-3 text-center w-28">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-center w-36">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((stu, idx) => (
                    <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm">
                          {stu.studentName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {stu.parentPhone ? `SĐT: ${stu.parentPhone}` : 'Chưa có SĐT'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-700 font-medium">
                        {stu.className}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs hidden sm:table-cell text-slate-700">
                        {formatVND(stu.tuitionFee)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs hidden md:table-cell text-slate-700">
                        {formatVND(stu.mealFee)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs hidden lg:table-cell text-slate-700">
                        {formatVND(stu.facilityFee)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs hidden lg:table-cell text-slate-700">
                        {formatVND(stu.extraActivitiesFee)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatVND(stu.total)}
                        {stu.discount > 0 && (
                          <div className="text-[11px] text-emerald-600 font-normal">
                            (Giảm {formatVND(stu.discount)})
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {stu.isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            <span>Đã nộp</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Chưa nộp</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {!stu.isPaid ? (
                            <button
                              onClick={() => {
                                const method: PaymentMethod = window.confirm(
                                  `Xác nhận bé ${stu.studentName} đã đóng ${formatVND(stu.total)}?\n\nBấm OK để ghi nhận Chuyển Khoản, bấm HỦY nếu là Tiền Mặt`
                                )
                                  ? 'chuyen_khoan'
                                  : 'tien_mat';
                                onConfirmPayment(
                                  stu.id,
                                  method,
                                  new Date().toISOString().substring(0, 10)
                                );
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                              Thu Tiền
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-500">
                              {formatDateVN(stu.paidDate || '')}
                            </span>
                          )}

                          <button
                            onClick={() => onPrintStudentReceipt(stu)}
                            title="In phiếu thu / giấy báo học phí"
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add New Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Thêm Học Sinh Vào Bảng Thu Học Phí
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewStudentSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-3.5 text-sm overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Họ và Tên Bé <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Bảo Nam"
                  value={newStudent.studentName}
                  onChange={(e) =>
                    setNewStudent((prev) => ({ ...prev, studentName: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Lớp Học
                  </label>
                  <select
                    value={newStudent.className}
                    onChange={(e) =>
                      setNewStudent((prev) => ({ ...prev, className: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-emerald-500"
                  >
                    <option value="Lớp Mầm (3-4 tuổi)">Lớp Mầm (3-4 tuổi)</option>
                    <option value="Lớp Chồi (4-5 tuổi)">Lớp Chồi (4-5 tuổi)</option>
                    <option value="Lớp Lá (5-6 tuổi)">Lớp Lá (5-6 tuổi)</option>
                    <option value="Nhà Trẻ (18-36 tháng)">Nhà Trẻ (18-36 tháng)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    SĐT Phụ Huynh
                  </label>
                  <input
                    type="text"
                    placeholder="09xx xxx xxx"
                    value={newStudent.parentPhone}
                    onChange={(e) =>
                      setNewStudent((prev) => ({ ...prev, parentPhone: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Học Phí Cơ Bản (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={newStudent.tuitionFee}
                    onChange={(e) =>
                      setNewStudent((prev) => ({ ...prev, tuitionFee: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Tiền Ăn Bán Trú (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={newStudent.mealFee}
                    onChange={(e) =>
                      setNewStudent((prev) => ({ ...prev, mealFee: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 truncate">
                    Phí CSVC
                  </label>
                  <input
                    type="number"
                    value={newStudent.facilityFee}
                    onChange={(e) =>
                      setNewStudent((prev) => ({ ...prev, facilityFee: Number(e.target.value) }))
                    }
                    className="w-full px-2.5 py-2 text-base sm:text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 truncate">
                    Năng Khiếu
                  </label>
                  <input
                    type="number"
                    value={newStudent.extraActivitiesFee}
                    onChange={(e) =>
                      setNewStudent((prev) => ({
                        ...prev,
                        extraActivitiesFee: Number(e.target.value),
                      }))
                    }
                    className="w-full px-2.5 py-2 text-base sm:text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 truncate">
                    Giảm Trừ
                  </label>
                  <input
                    type="number"
                    value={newStudent.discount}
                    onChange={(e) =>
                      setNewStudent((prev) => ({ ...prev, discount: Number(e.target.value) }))
                    }
                    className="w-full px-2.5 py-2 text-base sm:text-sm border border-slate-300 rounded-lg font-mono text-emerald-700"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Tổng Phải Thu:</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {formatVND(
                    newStudent.tuitionFee +
                      newStudent.mealFee +
                      newStudent.facilityFee +
                      newStudent.extraActivitiesFee +
                      newStudent.otherFee -
                      newStudent.discount
                  )}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer shadow-2xs"
                >
                  Lưu Học Sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
