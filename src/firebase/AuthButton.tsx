import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { LogIn, LogOut, Cloud, RefreshCw, CheckCircle2, User as UserIcon, AlertCircle } from 'lucide-react';

interface AuthButtonProps {
  onSyncNow?: () => Promise<void>;
  isSyncing?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ onSyncNow, isSyncing = false }) => {
  const { user, loading, login, logout, isOnline } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async () => {
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      await login();
      setIsOpen(false);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Đăng nhập không thành công. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-xs animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
        <span className="hidden sm:inline">Đang tải...</span>
      </div>
    );
  }

  // When NOT logged in
  if (!user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/80 hover:bg-red-100/90 text-red-700 hover:text-red-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          title="Đăng nhập Gmail để đồng bộ đa thiết bị"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="hidden sm:inline">Đăng nhập Gmail</span>
          <span className="sm:hidden">Login</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in duration-100">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
              <Cloud className="w-4 h-4 text-sky-600" />
              <div>
                <p className="font-bold text-slate-800">Đồng bộ đám mây</p>
                <p className="text-[11px] text-slate-500">Xem và sửa trên máy tính & điện thoại</p>
              </div>
            </div>

            <p className="text-slate-600 mb-3 text-[11px] leading-relaxed">
              Đăng nhập bằng tài khoản Google để toàn bộ thu chi, danh mục, cài đặt được lưu an toàn trên Cloud Firestore.
            </p>

            {errorMsg && (
              <div className="mb-2 p-2 bg-red-50 text-red-600 rounded-md text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang kết nối Google...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Tiếp tục với Gmail</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // When LOGGED IN
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
        title={`Đang đăng nhập: ${user.email} (Đã đồng bộ Cloud)`}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Avatar'}
            className="w-5 h-5 rounded-full object-cover border border-emerald-300"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
            {(user.email?.[0] || 'U').toUpperCase()}
          </div>
        )}

        <div className="flex items-center gap-1">
          <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'text-amber-500 animate-pulse' : 'text-emerald-600'}`} />
          <span className="hidden xl:inline max-w-[120px] truncate font-semibold text-[11px]">
            {user.displayName || user.email?.split('@')[0]}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 z-50 text-xs animate-in fade-in duration-100">
          <div className="flex items-start gap-2.5 mb-3 pb-3 border-b border-slate-100">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Avatar'}
                className="w-10 h-10 rounded-full object-cover border border-emerald-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {(user.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800 truncate">{user.displayName || 'Người dùng Google'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Đồng bộ Realtime Firestore</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
              <span>Trạng thái kết nối:</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                {isOnline ? 'Trực tuyến (Cloud Live)' : 'Ngoại tuyến'}
              </span>
            </div>

            {onSyncNow && (
              <button
                onClick={async () => {
                  if (onSyncNow) await onSyncNow();
                }}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu ngay'}</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
