import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Globe } from 'lucide-react';

export const SiteFooter: React.FC = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#2E2330] text-[#D9CFDA] pt-16 pb-12 border-t border-[#3D3040] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top: Centered Logo & Description */}
        <div className="flex flex-col items-center text-center pb-12 border-b border-[#3D3040]">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] rounded-md p-1">
            <div className="w-9 h-9 rounded-lg bg-[#6B4A6B] flex items-center justify-center text-white shadow-xs">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <span className="text-[24px] font-bold text-white tracking-tight">Brightloop</span>
          </Link>
          <p className="text-[14px] text-[#D9CFDA]/80 max-w-md">
            The modern subscription lifecycle and recurring revenue management platform.
          </p>
        </div>

        {/* Three Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-12 border-b border-[#3D3040] text-[13px]">
          {/* Column 1: Product */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white transition-colors">Plans & Variants</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Subscriptions</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Invoicing Engine</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Payment Tracking</a></li>
              <li><a href="#plans" className="hover:text-white transition-colors">Pricing Options</a></li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-white">Resources</h4>
            <ul className="space-y-2">
              <li><span className="cursor-default hover:text-white transition-colors">Documentation</span></li>
              <li><span className="cursor-default hover:text-white transition-colors">API Reference</span></li>
              <li><span className="cursor-default hover:text-white transition-colors">Billing Architecture</span></li>
              <li><span className="cursor-default hover:text-white transition-colors">Audit trail log</span></li>
              <li><span className="cursor-default hover:text-white transition-colors">System Status: Operational</span></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-3 col-span-2 md:col-span-1">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-2">
              <li><span className="cursor-default hover:text-white transition-colors">About Brightloop</span></li>
              <li><span className="cursor-default hover:text-white transition-colors">Privacy Policy</span></li>
              <li><span className="cursor-default hover:text-white transition-colors">Terms of Service</span></li>
              <li><span className="cursor-default hover:text-white transition-colors">Security & Compliance</span></li>
              <li><span className="cursor-default hover:text-white transition-colors">Contact Support</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Language Selector & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#D9CFDA]/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#3D3040] text-[#D9CFDA] hover:text-white transition-colors text-[11px]"
              aria-label="Language selector"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>English (US)</span>
            </button>
            <span>• Verified Server-Side Security</span>
          </div>

          <div>
            © 2026 Brightloop Platform. All rights reserved.
          </div>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 p-2.5 rounded-full bg-[#6B4A6B] text-white shadow-lg hover:bg-[#593B59] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
};

