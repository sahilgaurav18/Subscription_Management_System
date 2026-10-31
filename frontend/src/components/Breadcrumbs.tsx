import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  subscriptions: 'Subscriptions',
  new: 'New Quotation',
  'quotation-templates': 'Quotation Templates',
  invoices: 'Invoices',
  products: 'Products & Variants',
  plans: 'Billing Plans',
  taxes: 'Taxes',
  discounts: 'Discounts',
  staff: 'Staff Management',
  'audit-logs': 'Audit Logs',
  portal: 'Customer Portal',
  print: 'Print Invoice',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return (
      <div className="flex items-center gap-1.5 text-[13px] text-[#1F1A21] font-semibold">
        <span>Dashboard</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center space-x-1.5 text-[12px] text-[#6D6572]" aria-label="Breadcrumb">
      <Link to="/dashboard" className="flex items-center space-x-1 hover:text-[#6B4A6B] transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName =
          routeNameMap[value] ||
          (value.startsWith('SUB-') || value.startsWith('INV-') || !isNaN(Number(value))
            ? `#${value}`
            : value);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 text-[#6D6572]/60 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-[#1F1A21] capitalize">{displayName}</span>
            ) : (
              <Link to={to} className="hover:text-[#6B4A6B] transition-colors capitalize">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
