import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  Percent,
  Receipt,
  ShieldCheck,
  History,
  FileText,
  Layers,
  X,
  CreditCard,
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-[13px] font-medium transition-colors select-none ${
      isActive
        ? 'bg-[#6B4A6B] text-white shadow-xs'
        : 'text-[#D9CFDA] hover:bg-[#3D3040] hover:text-white'
    }`;

  const renderNavLinks = () => (
    <div className="flex flex-col gap-1">
      {user?.role !== 'customer' ? (
        <>
          <div className="pt-2 pb-1 px-3 text-[11px] font-semibold text-[#D9CFDA]/60 uppercase tracking-wider">
            Overview
          </div>
          <NavLink to="/dashboard" onClick={onClose} className={navItemClass}>
            <LayoutDashboard className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>Dashboard</span>
          </NavLink>

          <div className="pt-4 pb-1 px-3 text-[11px] font-semibold text-[#D9CFDA]/60 uppercase tracking-wider">
            Operations
          </div>
          <NavLink to="/customers" onClick={onClose} className={navItemClass}>
            <Users className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>Customers</span>
          </NavLink>

          <NavLink to="/subscriptions" onClick={onClose} className={navItemClass}>
            <FileText className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>Subscriptions</span>
          </NavLink>

          <NavLink to="/quotation-templates" onClick={onClose} className={navItemClass}>
            <Layers className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>Quotation Templates</span>
          </NavLink>

          <NavLink to="/invoices" onClick={onClose} className={navItemClass}>
            <Receipt className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>Invoices</span>
          </NavLink>

          <div className="pt-4 pb-1 px-3 text-[11px] font-semibold text-[#D9CFDA]/60 uppercase tracking-wider">
            Catalogs & Rules
          </div>
          <NavLink to="/products" onClick={onClose} className={navItemClass}>
            <Package className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>Products & Variants</span>
          </NavLink>

          <NavLink to="/plans" onClick={onClose} className={navItemClass}>
            <Calendar className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>Billing Plans</span>
          </NavLink>

          <NavLink to="/taxes" onClick={onClose} className={navItemClass}>
            <Receipt className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>Taxes</span>
          </NavLink>

          <NavLink to="/discounts" onClick={onClose} className={navItemClass}>
            <Percent className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>Discounts</span>
          </NavLink>

          <div className="pt-4 pb-1 px-3 text-[11px] font-semibold text-[#D9CFDA]/60 uppercase tracking-wider">
            Governance
          </div>
          {user?.role === 'admin' && (
            <NavLink to="/staff" onClick={onClose} className={navItemClass}>
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
              <span>Staff Management</span>
            </NavLink>
          )}

          <NavLink to="/audit-logs" onClick={onClose} className={navItemClass}>
            <History className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>Audit Logs</span>
          </NavLink>
        </>
      ) : (
        <>
          <div className="pt-2 pb-1 px-3 text-[11px] font-semibold text-[#D9CFDA]/60 uppercase tracking-wider">
            Customer Portal
          </div>
          <NavLink to="/portal" onClick={onClose} className={navItemClass}>
            <CreditCard className="w-4 h-4 shrink-0 text-[#D9CFDA]" />
            <span>My Subscriptions & Invoices</span>
          </NavLink>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-[#2E2330] text-[#D9CFDA] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#3D3040]">
          <div className="flex items-center gap-2.5">
            {/* Simple geometric inline SVG mark */}
            <div className="w-7 h-7 rounded-md bg-[#6B4A6B] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-white tracking-tight">Brightloop</span>
              <span className="text-[10px] text-[#D9CFDA]/60 font-mono">ERP Back Office</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-[#D9CFDA] hover:text-white hover:bg-[#3D3040] rounded-md"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {renderNavLinks()}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-[#3D3040] text-[11px] text-[#D9CFDA]/50 flex items-center justify-between">
          <span>Brightloop v1.0</span>
          <span className="w-2 h-2 rounded-full bg-[#1E8E5A]" title="System Online" />
        </div>
      </aside>
    </>
  );
};

