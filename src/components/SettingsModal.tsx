import React, { useState, useEffect } from 'react';
import { X, Save, Download, Upload, RotateCcw, Building2, Home, ShieldCheck, Palette } from 'lucide-react';
import { SchoolConfig, FamilyConfig, AppMode } from '../types/finance';
import {
  exportAllDataAsJSON,
  importAllDataFromJSON,
  resetBusinessDataToDefault,
  resetHomeDataToDefault,
} from '../utils/storage';
import { THEME_OPTIONS } from '../utils/themeConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AppMode;
  schoolConfig: SchoolConfig;
  familyConfig: FamilyConfig;
  onSaveSchoolConfig: (newConfig: SchoolConfig) => void;
  onSaveFamilyConfig: (newConfig: FamilyConfig) => void;
  onDataReloaded: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  mode,
  schoolConfig,
  familyConfig,
  onSaveSchoolConfig,
  onSaveFamilyConfig,
  onDataReloaded,
}) => {
  const isBusiness = mode === 'business';
  const [schoolForm, setSchoolForm] = useState<SchoolConfig>(schoolConfig);
  const [familyForm, setFamilyForm] = useState<FamilyConfig>(familyConfig);
  const [importStatus, setImportStatus] = useState<string>('');

  useEffect(() => {
    setSchoolForm(schoolConfig);
  }, [schoolConfig]);

  useEffect(() => {
    setFamilyForm(familyConfig);
  }, [familyConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusiness) {
      onSaveSchoolConfig(schoolForm);
    } else {
      onSaveFamilyConfig(familyForm);
    }
    onClose();
  };

  const handleExportBackup = () => {
    const jsonStr = exportAllDataAsJSON(mode);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const modeName = isBusiness ? 'Truong_Hoc' : 'Gia_Dinh';
    a.download = `Sao_Luu_Tai_Chinh_${modeName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllDataFromJSON(content);
      if (success) {
        setImportStatus('Khôi phục dữ liệu thành công!');
        onDataReloaded();
      } else {
        setImportStatus('Tập tin không hợp lệ, vui lòng kiểm tra lại!');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    const confirmMsg = isBusiness
      ? 'Bạn có chắc chắn muốn nạp lại dữ liệu mẫu của trường mầm non? Dữ liệu hiện tại của trường sẽ được thay thế bằng bộ mẫu chuẩn.'
      : 'Bạn có chắc chắn muốn nạp lại dữ liệu mẫu của gia đình? Dữ liệu hiện tại của gia đình sẽ được thay thế bằng bộ mẫu chuẩn.';

    if (window.confirm(confirmMsg)) {
      if (isBusiness) {
        resetBusinessDataToDefault();
      } else {
        resetHomeDataToDefault();
      }
      onDataReloaded();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div
          className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between ${
            isBusiness ? 'bg-orange-50/60 border-orange-100' : 'bg-emerald-50/60 border-emerald-100'
          }`}
        >
          <div className="flex items-center gap-2">
            {isBusiness ? (
              <Building2 className="w-5 h-5 text-red-700" />
            ) : (
              <Home className="w-5 h-5 text-emerald-700" />
            )}
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {isBusiness ? 'Cài Đặt Trường & Sao Lưu' : 'Cài Đặt Gia Đình & Sao Lưu'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Details Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
            <h4 className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isBusiness
                ? 'Thông Tin Hiển Thị Trên Phiếu Thu & Báo Cáo Trường Học'
                : 'Thông Tin Tổ Ấm & Người Quản Lý Chi Tiêu'}
            </h4>

            {isBusiness ? (
              /* BUSINESS FORM */
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tên Trường Mầm Non / Cơ Sở
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolForm.schoolName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Cơ Sở / Điểm Trường
                    </label>
                    <input
                      type="text"
                      value={schoolForm.branchName}
                      onChange={(e) => setSchoolForm({ ...schoolForm, branchName: e.target.value })}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Số Điện Thoại Hotline
                    </label>
                    <input
                      type="text"
                      value={schoolForm.phone}
                      onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Địa Chỉ Trường</label>
                  <input
                    type="text"
                    value={schoolForm.address}
                    onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Hiệu Trưởng / Chủ Trường
                    </label>
                    <input
                      type="text"
                      value={schoolForm.principalName}
                      onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Thủ Quỹ / Người Thu
                    </label>
                    <input
                      type="text"
                      value={schoolForm.treasurerName}
                      onChange={(e) => setSchoolForm({ ...schoolForm, treasurerName: e.target.value })}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-red-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* HOME FORM */
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tên Sổ Thu Chi / Tổ Ấm Gia Đình
                  </label>
                  <input
                    type="text"
                    required
                    value={familyForm.familyName}
                    onChange={(e) => setFamilyForm({ ...familyForm, familyName: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-emerald-500"
                    placeholder="Ví dụ: Tổ Ấm Gia Đình An & Hương"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phương Châm / Ghi Chú
                    </label>
                    <input
                      type="text"
                      value={familyForm.subTitle}
                      onChange={(e) => setFamilyForm({ ...familyForm, subTitle: e.target.value })}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-emerald-500"
                      placeholder="Sổ Thu Chi & Kế Hoạch Tài Chính"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Số Điện Thoại Liên Hệ
                    </label>
                    <input
                      type="text"
                      value={familyForm.phone}
                      onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Địa Chỉ Nhà</label>
                  <input
                    type="text"
                    value={familyForm.address}
                    onChange={(e) => setFamilyForm({ ...familyForm, address: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-emerald-500"
                    placeholder="Ví dụ: Căn hộ 1205, Tòa S2, Vinhomes Grand Park"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Người Ghi Chép / Chủ Hộ
                    </label>
                    <input
                      type="text"
                      value={familyForm.managerName}
                      onChange={(e) => setFamilyForm({ ...familyForm, managerName: e.target.value })}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-emerald-500"
                      placeholder="Nguyễn Văn An (Chồng)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Người Phối Hợp / Vợ / Chồng
                    </label>
                    <input
                      type="text"
                      value={familyForm.approverName}
                      onChange={(e) => setFamilyForm({ ...familyForm, approverName: e.target.value })}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-emerald-500"
                      placeholder="Trần Thu Hương (Vợ)"
                    />
                  </div>
                </div>

                {/* Theme Selector for Home Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-slate-600" />
                      <span>Tông Màu Giao Diện Gia Đình (Theme Color)</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">5 phong cách màu sắc</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {THEME_OPTIONS.map((opt) => {
                      const isSelected = (familyForm.themeColor || 'indigo') === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setFamilyForm({ ...familyForm, themeColor: opt.id })}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 font-bold'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0 shadow-2xs border border-black/10"
                            style={{ backgroundColor: opt.hex }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-slate-900 truncate">{opt.name}</div>
                          </div>
                          {isSelected && <span className="text-xs font-bold text-indigo-700">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                isBusiness
                  ? 'bg-red-700 hover:bg-red-800'
                  : 'bg-indigo-700 hover:bg-indigo-800'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isBusiness ? 'Lưu Thông Tin Trường' : 'Lưu Thông Tin Gia Đình'}</span>
            </button>
          </form>

          {/* Backup & Restore */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Dữ Liệu Độc Lập An Toàn Trên Thiết Bị</span>
            </h4>
            <p className="text-xs text-slate-500">
              Dữ liệu của cả hai chế độ (Trường học & Gia đình) được lưu trữ hoàn toàn độc lập và an toàn trực tiếp trên trình duyệt thiết bị của bạn.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Tải Sao Lưu JSON</span>
              </button>

              <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Khôi Phục File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="text-xs text-center text-emerald-700 bg-emerald-50 p-2 rounded-lg font-medium">
                {importStatus}
              </div>
            )}

            <button
              type="button"
              onClick={handleResetData}
              className="w-full py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {isBusiness ? 'Nạp Lại Dữ Liệu Mẫu Trường Học' : 'Nạp Lại Dữ Liệu Mẫu Gia Đình'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
