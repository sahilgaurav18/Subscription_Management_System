import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Breadcrumbs } from './Breadcrumbs';
import { Badge } from './Badge';
import { Menu, LogOut, User } from 'lucide-react';

export interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getRoleVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'primary';
      case 'staff':
        return 'info';
      case 'customer':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E3DFE5] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-[#1F1A21] hover:bg-[#F6F5F7] min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5 text-[#6D6572]" />
        </button>

        {/* Breadcrumbs navigation */}
        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* User profile & actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#E3DFE5]">
          <div className="w-8 h-8 rounded-full bg-[#F1EAF1] border border-[#E1D4E1] flex items-center justify-center text-[#6B4A6B] font-semibold text-xs">
            {user?.email?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-[13px] font-medium text-[#1F1A21] max-w-[160px] truncate leading-tight">
              {user?.email}
            </span>
            <span className="text-[11px] text-[#6D6572] capitalize leading-tight">
              {user?.role}
            </span>
          </div>
        </div>

        <Badge variant={getRoleVariant(user?.role)} size="sm" className="hidden sm:inline-flex capitalize">
          {user?.role}
        </Badge>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-[12px] font-medium text-[#6D6572] hover:text-[#C0392B] hover:bg-[#FDF2F2] rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0392B]"
          title="Sign out of Brightloop"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

