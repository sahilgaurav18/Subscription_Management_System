import React, { useState } from 'react';
import { ROLE_CONFIGS, type RoleConfig } from '../../data/landingDemoData';

export const RoleSwitcher: React.FC = () => {
  const [activeRole, setActiveRole] = useState<'admin' | 'staff' | 'customer'>('admin');
  const config: RoleConfig = ROLE_CONFIGS[activeRole];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F1EAF1] text-[#6B4A6B] border border-[#E3DFE5] mb-3">
          <span className="w-2 h-2 rounded-full bg-[#6B4A6B]"></span>
          Role-Based Access Control
        </div>
        <h2 className="font-caveat font-bold text-[38px] sm:text-[48px] text-[#1F1A21] leading-tight">
          One system, tailored for every user
        </h2>
        <p className="text-[16px] sm:text-[17px] text-[#6D6572] max-w-2xl mx-auto mt-2">
          Strict server-side role enforcement separates executive analytics, daily staff billing operations, and customer self-service.
        </p>
      </div>

      {/* Role Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1.5 bg-[#F4F3F6] rounded-2xl border border-[#E3DFE5] gap-1 shadow-inner">
          {(['admin', 'staff', 'customer'] as const).map((r) => {
            const roleData = ROLE_CONFIGS[r];
            const isActive = activeRole === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRole(r)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#1F1A21] shadow-sm font-bold border border-[#E3DFE5]/80'
                    : 'text-[#6D6572] hover:text-[#1F1A21]'
                }`}
              >
                <span>{roleData.title}</span>
                {isActive && (
                  <span
                    className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      r === 'admin'
                        ? 'bg-[#F1EAF1] text-[#6B4A6B]'
                        : r === 'staff'
                        ? 'bg-[#EBF8FF] text-[#2B6CB0]'
                        : 'bg-[#EDFDF5] text-[#1E8E5A]'
                    }`}
                  >
                    {roleData.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Role Panel */}
      <div className="bg-white rounded-3xl border border-[#E3DFE5] p-6 sm:p-8 shadow-sm transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Summary and Perms */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-[#1F1A21]">{config.title}</h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    activeRole === 'admin'
                      ? 'bg-[#F1EAF1] text-[#6B4A6B] border-[#6B4A6B]/20'
                      : activeRole === 'staff'
                      ? 'bg-[#EBF8FF] text-[#2B6CB0] border-[#2B6CB0]/20'
                      : 'bg-[#EDFDF5] text-[#1E8E5A] border-[#1E8E5A]/20'
                  }`}
                >
                  {config.badge}
                </span>
              </div>
              <p className="text-sm text-[#6D6572] mt-2 leading-relaxed">{config.summary}</p>
            </div>

            {/* Allowed Permissions Checklist */}
            <div className="bg-[#FAF9FA] rounded-2xl p-4 border border-[#E3DFE5]/80">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#6D6572] mb-3">
                Role Permissions & Safeguards
              </div>
              <ul className="space-y-2.5">
                {config.permissions.map((perm, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#1F1A21]">
                    <span className="w-4 h-4 rounded-full bg-[#12C2A5]/15 text-[#12C2A5] flex items-center justify-center font-bold text-[10px] shrink-0">
                      ✓
                    </span>
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Doodle tip */}
            <div className="flex items-center gap-2 text-xs text-[#6D6572]">
              <span className="font-caveat font-bold text-[#F5A623] text-lg rotate-[-2deg]">
                Pro-tip:
              </span>
              <span>All API requests validate roles in FastAPI middleware before executing queries.</span>
            </div>
          </div>

          {/* Right Column: Dynamic "What You See" UI Mockup */}
          <div className="lg:col-span-7 bg-[#2E2330] rounded-2xl p-4 sm:p-6 text-white shadow-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F26B6B]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#12C2A5]"></span>
                <span className="text-[#D9CFDA] font-mono ml-2">brightloop.app/{activeRole}</span>
              </div>
              <span className="px-2 py-0.5 bg-white/10 rounded text-[11px] text-[#D9CFDA] uppercase tracking-wider font-semibold">
                {activeRole} session
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Sidebar Menu Simulation */}
              <div className="md:col-span-5 bg-black/20 rounded-xl p-3 border border-white/5">
                <div className="text-[11px] font-semibold text-[#D9CFDA]/60 uppercase tracking-wider mb-2">
                  Navigation Menu
                </div>
                <div className="space-y-1">
                  {config.visibleModules.map((mod, i) => (
                    <div
                      key={i}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        i === 0
                          ? 'bg-[#6B4A6B] text-white font-semibold'
                          : 'text-[#D9CFDA] hover:bg-white/5'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                      <span className="truncate">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Panel Simulation */}
              <div className="md:col-span-7 bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-[#D9CFDA]/60 uppercase tracking-wider mb-2">
                    Active Workspace
                  </div>
                  {activeRole === 'admin' && (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-xs text-[#D9CFDA]">Monthly Recurring Revenue</div>
                        <div className="text-lg font-bold text-white tabular-nums">$42,850.00</div>
                        <div className="text-[10px] text-[#12C2A5] mt-0.5">↑ 14.2% from last month</div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button className="flex-1 py-1.5 bg-[#6B4A6B] text-white rounded font-medium text-[11px]">
                          Trigger Billing
                        </button>
                        <button className="flex-1 py-1.5 bg-white/10 text-[#D9CFDA] rounded font-medium text-[11px]">
                          Manage Rules
                        </button>
                      </div>
                    </div>
                  )}

                  {activeRole === 'staff' && (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-xs text-[#D9CFDA]">Pending Invoices (Ready)</div>
                        <div className="text-lg font-bold text-white tabular-nums">14 awaiting payment</div>
                        <div className="text-[10px] text-[#F5A623] mt-0.5">3 overdue today</div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button className="flex-1 py-1.5 bg-[#6B4A6B] text-white rounded font-medium text-[11px]">
                          + New Quote
                        </button>
                        <button className="flex-1 py-1.5 bg-white/10 text-[#D9CFDA] rounded font-medium text-[11px]">
                          Record Payment
                        </button>
                      </div>
                    </div>
                  )}

                  {activeRole === 'customer' && (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-xs text-[#D9CFDA]">Current Active Plan</div>
                        <div className="text-sm font-bold text-white">Pro Monthly ($99.00/mo)</div>
                        <div className="text-[10px] text-[#12C2A5] mt-0.5">● Renews on 1st of next month</div>
                      </div>
                      <div className="p-2 bg-white/5 rounded border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[#D9CFDA]">INV-2026-089</span>
                        <span className="px-1.5 py-0.5 bg-[#1E8E5A]/20 text-[#1E8E5A] rounded text-[10px] font-bold">
                          PAID
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[#D9CFDA]/60 mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                  <span>Scope: {activeRole === 'customer' ? 'Customer #401' : 'Workspace Org'}</span>
                  <span className="text-[#12C2A5]">● Verified Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
