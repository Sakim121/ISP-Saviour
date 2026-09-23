import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Wifi, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export default function Topbar({ onMenuClick }) {
  const { user, profile, isTechnician, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 sm:flex">
          <Wifi size={14} />
          Live data connected
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="max-w-[140px] truncate text-sm font-semibold leading-tight text-slate-700">
                {user.email}
              </p>
              <p className="text-[11px] leading-tight text-slate-400">
                {profile?.role ?? (isTechnician ? 'technician' : 'no role assigned')}
              </p>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
