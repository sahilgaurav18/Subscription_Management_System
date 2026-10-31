import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F5F7] flex flex-col font-sans">
      {/* 240px Fixed/Collapsible Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Container shifted 240px on lg */}
      <div className="flex-1 flex flex-col lg:pl-[240px] min-w-0 transition-all">
        {/* Top bar with Breadcrumbs & User Menu */}
        <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Content Area with 16px/24px/32px spacing scale */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
