import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScrollProgress } from '../components/landing/ScrollProgress';
import { MagneticButton } from '../components/landing/MagneticButton';
import { CommandPalette } from '../components/landing/CommandPalette';
import { SectionDivider } from '../components/landing/SectionDivider';
import { MarkerHighlight } from '../components/landing/MarkerHighlight';
import { ModuleTile } from '../components/landing/ModuleTile';
import { BillingSimulator } from '../components/landing/BillingSimulator';
import { BeforeAfterToggle } from '../components/landing/BeforeAfterToggle';
import { LifecycleStory } from '../components/landing/LifecycleStory';
import { PlanPlayground } from '../components/landing/PlanPlayground';
import { WhyBrightloop } from '../components/landing/WhyBrightloop';
import { ProductTour } from '../components/landing/ProductTour';
import { RoleSwitcher } from '../components/landing/RoleSwitcher';
import { PricingCard, type PricingPlan } from '../components/landing/PricingCard';
import { FaqAccordion } from '../components/landing/FaqAccordion';
import { ActivityMosaic } from '../components/landing/ActivityMosaic';
import { SiteFooter } from '../components/landing/SiteFooter';
import { TypeOn } from '../components/landing/TypeOn';
import {
  DoodleRays,
  DoodleArrowTeal,
  DoodleLoopUnderline,
} from '../components/landing/DoodleRays';
import { Skeleton } from '../components/Skeleton';
import { MODULE_TILES } from '../data/landingDemoData';
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  // 1. All hooks at the very top (Rules of Hooks)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Navigation & UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Hero Headline State
  const [firstLineDone, setFirstLineDone] = useState(false);

  // Pricing State
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [isYearlyMode, setIsYearlyMode] = useState(false);

  // Fetch Public Plans
  const fetchPublicPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const response = await fetch('/api/v1/public/plans');
      if (!response.ok) {
        throw new Error(`Failed to load plans: HTTP ${response.status}`);
      }
      const data: PricingPlan[] = await response.json();
      setPlans(data);
    } catch (err: any) {
      setPlansError(err.message || 'Unable to retrieve available plans at this time.');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicPlans();
  }, [fetchPublicPlans]);

  // Scroll detection & Scroll-Spy
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);

      const sections = [
        'overview',
        'simulator',
        'comparison',
        'how-it-works',
        'playground',
        'features',
        'tour',
        'roles',
        'plans',
        'faq',
      ];
      const scrollPosition = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Conditional returns strictly after all hooks have been called
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#6B4A6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is already authenticated, redirect to their role's dashboard
  if (isAuthenticated && user) {
    if (user.role === 'customer') {
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Curate display plans
  const displayPlans = (() => {
    if (plans.length === 0) return [];
    const starter = plans.find((p) => p.price < 5000 && p.price > 0) || plans[0];
    const pro =
      plans.find((p) => p.name.includes('Pro') || (p.price >= 5000 && p.price < 50000)) ||
      plans[1] ||
      plans[0];
    const enterprise =
      plans.find((p) => p.price >= 50000 || p.billing_period === 'yearly') ||
      plans[plans.length - 1];

    const uniqueMap = new Map<number, PricingPlan>();
    if (starter) uniqueMap.set(starter.id, starter);
    if (pro) uniqueMap.set(pro.id, pro);
    if (enterprise) uniqueMap.set(enterprise.id, enterprise);
    return Array.from(uniqueMap.values());
  })();

  return (
    <div className="min-h-screen bg-white text-[#1F1A21] font-sans antialiased selection:bg-[#F1EAF1] selection:text-[#6B4A6B]">
      {/* 3px Plum Scroll Progress Bar at the top */}
      <ScrollProgress />

      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* ======================================================== */}
      {/* 1. STICKY HEADER */}
      {/* ======================================================== */}
      <header
        className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-200 ${
          isScrolled ? 'border-b border-[#E3DFE5] shadow-xs' : 'border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Left: Brightloop Logo with plum clock-loop SVG mark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] rounded-md p-1"
            aria-label="Brightloop Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#6B4A6B] flex items-center justify-center text-white shadow-xs group-hover:bg-[#593B59] transition-colors">
              <svg
                className="w-4.5 h-4.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <span className="text-[21px] font-bold tracking-tight text-[#1F1A21]">
              Brightloop
            </span>
          </Link>

          {/* Centre Navigation with scroll-spy */}
          <nav
            className="hidden lg:flex items-center gap-6 text-[14px] font-medium"
            aria-label="Main Navigation"
          >
            {/* Product Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                className="flex items-center gap-1 text-[#6D6572] hover:text-[#1F1A21] transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] rounded cursor-pointer"
                aria-expanded={productDropdownOpen}
              >
                <span>Product</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    productDropdownOpen ? 'rotate-180 text-[#6B4A6B]' : ''
                  }`}
                />
              </button>

              {productDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl border border-[#E3DFE5] shadow-xl p-2.5 z-50 animate-fade-up">
                  <a
                    href="#simulator"
                    onClick={() => setProductDropdownOpen(false)}
                    className="block px-3 py-2 rounded-xl text-[13px] text-[#1F1A21] hover:bg-[#FAF9FA] hover:text-[#6B4A6B] transition-colors"
                  >
                    <div className="font-semibold">Billing Day Simulator</div>
                    <div className="text-[11px] text-[#6D6572]">Interactive batch runs & payments</div>
                  </a>
                  <a
                    href="#playground"
                    onClick={() => setProductDropdownOpen(false)}
                    className="block px-3 py-2 rounded-xl text-[13px] text-[#1F1A21] hover:bg-[#FAF9FA] hover:text-[#6B4A6B] transition-colors"
                  >
                    <div className="font-semibold">Plan Playground</div>
                    <div className="text-[11px] text-[#6D6572]">Live calculator with promos & taxes</div>
                  </a>
                  <a
                    href="#comparison"
                    onClick={() => setProductDropdownOpen(false)}
                    className="block px-3 py-2 rounded-xl text-[13px] text-[#1F1A21] hover:bg-[#FAF9FA] hover:text-[#6B4A6B] transition-colors"
                  >
                    <div className="font-semibold">Spreadsheets vs Brightloop</div>
                    <div className="text-[11px] text-[#6D6572]">Side-by-side pain vs fix view</div>
                  </a>
                  <a
                    href="#features"
                    onClick={() => setProductDropdownOpen(false)}
                    className="block px-3 py-2 rounded-xl text-[13px] text-[#1F1A21] hover:bg-[#FAF9FA] hover:text-[#6B4A6B] transition-colors"
                  >
                    <div className="font-semibold">Why Brightloop Bento</div>
                    <div className="text-[11px] text-[#6D6572]">Zero duplicates & sub-2s speed</div>
                  </a>
                  <a
                    href="#roles"
                    onClick={() => setProductDropdownOpen(false)}
                    className="block px-3 py-2 rounded-xl text-[13px] text-[#1F1A21] hover:bg-[#FAF9FA] hover:text-[#6B4A6B] transition-colors"
                  >
                    <div className="font-semibold">Role-Based Access</div>
                    <div className="text-[11px] text-[#6D6572]">Admin, Staff, Customer views</div>
                  </a>
                </div>
              )}
            </div>

            {/* How it works */}
            <a
              href="#how-it-works"
              className={`relative py-1 transition-colors ${
                activeSection === 'how-it-works'
                  ? 'text-[#6B4A6B] font-semibold'
                  : 'text-[#6D6572] hover:text-[#1F1A21]'
              }`}
            >
              How it works
              {activeSection === 'how-it-works' && (
                <span className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-[#6B4A6B] rounded-full" />
              )}
            </a>

            {/* Playground */}
            <a
              href="#playground"
              className={`relative py-1 transition-colors ${
                activeSection === 'playground'
                  ? 'text-[#6B4A6B] font-semibold'
                  : 'text-[#6D6572] hover:text-[#1F1A21]'
              }`}
            >
              Playground
              {activeSection === 'playground' && (
                <span className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-[#6B4A6B] rounded-full" />
              )}
            </a>

            {/* Tour */}
            <a
              href="#tour"
              className={`relative py-1 transition-colors ${
                activeSection === 'tour'
                  ? 'text-[#6B4A6B] font-semibold'
                  : 'text-[#6D6572] hover:text-[#1F1A21]'
              }`}
            >
              Tour
              {activeSection === 'tour' && (
                <span className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-[#6B4A6B] rounded-full" />
              )}
            </a>

            {/* Plans */}
            <a
              href="#plans"
              className={`relative py-1 transition-colors ${
                activeSection === 'plans'
                  ? 'text-[#6B4A6B] font-semibold'
                  : 'text-[#6D6572] hover:text-[#1F1A21]'
              }`}
            >
              Plans
              {activeSection === 'plans' && (
                <span className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-[#6B4A6B] rounded-full" />
              )}
            </a>

            {/* FAQ */}
            <a
              href="#faq"
              className={`relative py-1 transition-colors ${
                activeSection === 'faq'
                  ? 'text-[#6B4A6B] font-semibold'
                  : 'text-[#6D6572] hover:text-[#1F1A21]'
              }`}
            >
              FAQ
              {activeSection === 'faq' && (
                <span className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-[#6B4A6B] rounded-full" />
              )}
            </a>
          </nav>

          {/* Right: Search chip + Sign In + Magnetic "Try it free" Button */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Search chip with Ctrl+K keycap */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#FAF9FA] hover:bg-[#F1EAF1] border border-[#E3DFE5] text-[#6D6572] hover:text-[#1F1A21] text-xs font-medium transition-colors cursor-pointer"
              title="Quick Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E3DFE5] text-[10px] font-mono text-[#6D6572]">
                ⌘K
              </kbd>
            </button>

            <Link
              to="/login"
              className="text-[14px] font-medium text-[#1F1A21] hover:text-[#6B4A6B] transition-colors px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] rounded-md"
            >
              Sign in
            </Link>

            <MagneticButton
              to="/register"
              maxOffset={6}
              className="inline-flex items-center justify-center min-h-[38px] px-4 rounded-lg bg-[#6B4A6B] hover:bg-[#593B59] text-white font-medium text-[14px] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] focus-visible:ring-offset-2"
            >
              Try it free
            </MagneticButton>
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-[#1F1A21] hover:bg-[#FAF9FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Slide-Down Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#E3DFE5] px-4 pt-3 pb-6 space-y-2 animate-fade-up">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setCommandPaletteOpen(true);
              }}
              className="w-full text-left py-2 px-3 rounded-lg text-[14px] font-medium text-[#6D6572] bg-[#FAF9FA] flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" /> Quick Search
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E3DFE5] text-[10px] font-mono">
                Ctrl+K
              </kbd>
            </button>
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[15px] font-medium text-[#1F1A21] hover:text-[#6B4A6B]"
            >
              Billing Simulator
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[15px] font-medium text-[#1F1A21] hover:text-[#6B4A6B]"
            >
              How it works
            </a>
            <a
              href="#playground"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[15px] font-medium text-[#1F1A21] hover:text-[#6B4A6B]"
            >
              Plan Playground
            </a>
            <a
              href="#tour"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[15px] font-medium text-[#1F1A21] hover:text-[#6B4A6B]"
            >
              Product Tour
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[15px] font-medium text-[#1F1A21] hover:text-[#6B4A6B]"
            >
              Role Access
            </a>
            <a
              href="#plans"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[15px] font-medium text-[#1F1A21] hover:text-[#6B4A6B]"
            >
              Plans & Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[15px] font-medium text-[#1F1A21] hover:text-[#6B4A6B]"
            >
              FAQ
            </a>

            <div className="pt-4 border-t border-[#E3DFE5] flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-[14px] font-medium text-[#1F1A21] border border-[#E3DFE5] rounded-xl hover:bg-[#FAF9FA]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-[14px] font-medium text-white bg-[#6B4A6B] rounded-xl hover:bg-[#593B59]"
              >
                Try it free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SECTION */}
      {/* ======================================================== */}
      <section
        id="overview"
        className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-white"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F1EAF1] text-[#6B4A6B] border border-[#E3DFE5] mb-5">
            <span className="w-2 h-2 rounded-full bg-[#12C2A5] animate-ping" />
            Zero double-billing guarantee • Live SSE telemetry
          </div>

          {/* Headline in Caveat */}
          <div className="relative inline-block mb-4">
            <h1 className="font-caveat font-bold text-[clamp(44px,7vw,92px)] leading-[1.05] tracking-tight text-[#1F1A21]">
              <TypeOn
                text="Recurring revenue."
                speedMs={45}
                startDelayMs={100}
                onComplete={() => setFirstLineDone(true)}
              />{' '}
              <span
                className={`relative inline-block transition-all duration-700 ${
                  firstLineDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                }`}
              >
                <MarkerHighlight color="plum" className="px-2 pb-1">
                  <span className="text-[#6B4A6B]">on autopilot.</span>
                </MarkerHighlight>
              </span>
            </h1>

            {/* Doodle accents: three short coral rays */}
            <div className="absolute -top-3 -right-10 sm:-top-5 sm:-right-14">
              <DoodleRays size={44} color="#F26B6B" />
            </div>
          </div>

          {/* Subtext with sky-blue underline under "one place" */}
          <p className="max-w-2xl mx-auto text-[18px] text-[#6D6572] leading-[1.6] mt-4 mb-8">
            From quotation templates and plans to automatic invoices, payments and reports, run
            every subscription from{' '}
            <span className="relative inline-block font-medium text-[#1F1A21]">
              one place
              <DoodleLoopUnderline color="#2BB3F3" />
            </span>
            .
          </p>

          {/* Buttons & Note */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
            <MagneticButton
              to="/register"
              maxOffset={6}
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#6B4A6B] hover:bg-[#593B59] text-white font-medium text-[16px] shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] focus-visible:ring-offset-2"
            >
              <span>Start now, it's free</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
            </MagneticButton>

            <a
              href="#tour"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-[#FAF9FA] hover:bg-[#F1EAF1] text-[#1F1A21] border border-[#E3DFE5] font-medium text-[16px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
            >
              Watch the tour
            </a>

            {/* Handwritten Caveat note + curved doodle arrow */}
            <div className="hidden lg:flex items-center gap-2 absolute -right-24 top-1/2 -translate-y-1/2 pointer-events-none text-left">
              <svg
                width="40"
                height="32"
                viewBox="0 0 40 32"
                fill="none"
                className="text-[#F5A623] shrink-0"
              >
                <path
                  d="M4 24C16 26 28 20 34 8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M26 6L35 7L33 16"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-caveat font-bold text-[20px] text-[#F5A623] leading-none rotate-[-4deg]">
                set up your first plan in minutes!
              </span>
            </div>
          </div>

          <p className="text-[12px] text-[#6D6572] mt-4 font-medium">
            Free to try • No credit card required • Instant access
          </p>

          {/* 6 Original Module Tiles in soft grey container */}
          <div className="mt-14 sm:mt-18 relative">
            <div className="absolute inset-x-0 -top-6 bottom-0 bg-[#F4F3F6]/80 rounded-3xl -z-10 border border-[#E3DFE5]/80" />
            <div className="p-6 sm:p-8">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#6D6572] mb-4 text-center">
                Platform Architecture Modules
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {MODULE_TILES.map((mod, idx) => (
                  <ModuleTile key={mod.id} module={mod} index={idx} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SECTION 2: BILLING SIMULATOR */}
      {/* ======================================================== */}
      <SectionDivider fillColor="#F4F3F6" bgColor="#FFFFFF" />
      <section id="simulator" className="py-16 md:py-24 bg-[#F4F3F6]">
        <BillingSimulator />
      </section>

      {/* ======================================================== */}
      {/* 4. SECTION 3: BEFORE / AFTER SPREADSHEETS COMPARISON */}
      {/* ======================================================== */}
      <SectionDivider fillColor="#FFFFFF" bgColor="#F4F3F6" />
      <section id="comparison" className="py-16 md:py-24 bg-white">
        <BeforeAfterToggle />
      </section>

      {/* ======================================================== */}
      {/* 5. SECTION 4: LIFECYCLE STORY (HOW IT WORKS) */}
      {/* ======================================================== */}
      <SectionDivider fillColor="#F4F3F6" bgColor="#FFFFFF" />
      <section id="how-it-works" className="py-16 md:py-24 bg-[#F4F3F6]">
        <LifecycleStory />
      </section>

      {/* ======================================================== */}
      {/* 6. SECTION 5: PLAN PLAYGROUND CALCULATOR */}
      {/* ======================================================== */}
      <SectionDivider fillColor="#FFFFFF" bgColor="#F4F3F6" />
      <section id="playground" className="py-16 md:py-24 bg-white">
        <PlanPlayground />
      </section>

      {/* ======================================================== */}
      {/* 7. SECTION 6: WHY BRIGHTLOOP BENTO GRID */}
      {/* ======================================================== */}
      <SectionDivider fillColor="#F4F3F6" bgColor="#FFFFFF" />
      <section id="features" className="py-16 md:py-24 bg-[#F4F3F6]">
        <WhyBrightloop />
      </section>

      {/* ======================================================== */}
      {/* 8. SECTION 7: INTERACTIVE PRODUCT TOUR */}
      {/* ======================================================== */}
      <SectionDivider fillColor="#FFFFFF" bgColor="#F4F3F6" />
      <section id="tour" className="py-16 md:py-24 bg-white">
        <ProductTour />
      </section>

      {/* ======================================================== */}
      {/* 9. SECTION 8: ROLE-BASED ACCESS CONTROL */}
      {/* ======================================================== */}
      <SectionDivider fillColor="#F4F3F6" bgColor="#FFFFFF" />
      <section id="roles" className="py-16 md:py-24 bg-[#F4F3F6]">
        <RoleSwitcher />
      </section>

      {/* ======================================================== */}
      {/* 10. SECTION 9: PLANS & PRICING */}
      {/* ======================================================== */}
      <SectionDivider fillColor="#FFFFFF" bgColor="#F4F3F6" />
      <section id="plans" className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B4A6B] bg-[#F1EAF1] px-2.5 py-1 rounded">
              Predictable Pricing
            </span>
            <h2 className="font-caveat font-bold text-[clamp(38px,6vw,60px)] leading-tight text-[#1F1A21] mt-3">
              Simple, transparent plans
            </h2>
            <p className="text-[17px] text-[#6D6572] mt-2">
              All plans include complete invoice generation, client portal access, and zero hidden transaction fees.
            </p>

            {/* Monthly / Yearly Sliding Toggle */}
            <div className="mt-8 inline-flex items-center p-1 bg-[#F4F3F6] rounded-full border border-[#E3DFE5] shadow-xs">
              <button
                type="button"
                onClick={() => setIsYearlyMode(false)}
                className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                  !isYearlyMode
                    ? 'bg-[#6B4A6B] text-white shadow-xs'
                    : 'text-[#6D6572] hover:text-[#1F1A21]'
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setIsYearlyMode(true)}
                className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isYearlyMode
                    ? 'bg-[#6B4A6B] text-white shadow-xs'
                    : 'text-[#6D6572] hover:text-[#1F1A21]'
                }`}
              >
                <span>Annual commitment</span>
                <span className="bg-[#EDFDF5] text-[#1E8E5A] text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full border border-[#C6F6D5]">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Container */}
          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 border border-[#E3DFE5] space-y-4"
                >
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-12 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-10 w-full mt-6" />
                </div>
              ))}
            </div>
          ) : plansError ? (
            <div className="p-6 rounded-2xl bg-[#FAF9FA] border border-[#E3DFE5] text-center max-w-md mx-auto">
              <p className="text-[14px] text-[#C0392B]">{plansError}</p>
              <button
                type="button"
                onClick={fetchPublicPlans}
                className="mt-3 text-[13px] text-[#6B4A6B] font-semibold underline hover:text-[#593B59] cursor-pointer"
              >
                Retry loading plans
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
              {displayPlans.map((plan, idx) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isYearlyMode={isYearlyMode}
                  isPopular={idx === 1 || displayPlans.length === 1}
                />
              ))}
            </div>
          )}

          {/* Differentiator summary checklist */}
          <div className="mt-12 p-6 rounded-2xl bg-[#FAF9FA] border border-[#E3DFE5] flex flex-wrap items-center justify-around gap-4 text-xs font-medium text-[#1F1A21]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E8E5A]" />
              <span>Deterministic zero-duplicate billing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E8E5A]" />
              <span>Full customer portal included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E8E5A]" />
              <span>Automated tax rules & discounts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E8E5A]" />
              <span>Real-time SSE financial stream</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 11. SECTION 10: FAQ & ACTIVITY MOSAIC */}
      {/* ======================================================== */}
      <SectionDivider fillColor="#F4F3F6" bgColor="#FFFFFF" />
      <section id="faq" className="py-16 md:py-24 bg-[#F4F3F6]">
        <FaqAccordion />
        <div className="mt-12">
          <ActivityMosaic />
        </div>
      </section>

      {/* ======================================================== */}
      {/* 12. SECTION 11: FINAL CTA */}
      {/* ======================================================== */}
      <SectionDivider fillColor="#FFFFFF" bgColor="#F4F3F6" />
      <section className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          {/* Amber doodle decoration */}
          <div className="relative inline-block mb-4">
            <svg
              className="absolute -top-6 -left-8 w-12 h-12 text-[#F5A623] pointer-events-none"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M10 20L4 14" />
              <path d="M18 10L14 4" />
              <path d="M26 12L28 4" />
            </svg>

            <h2 className="font-caveat font-bold text-[clamp(40px,6.5vw,72px)] leading-tight text-[#1F1A21]">
              Unleash your{' '}
              <span className="text-[#12C2A5] inline-block">
                <TypeOn
                  text="growth potential"
                  speedMs={60}
                  startDelayMs={300}
                  caretColor="#12C2A5"
                />
              </span>
            </h2>

            <svg
              className="absolute -bottom-4 -right-8 w-12 h-12 text-[#F5A623] pointer-events-none"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M38 28L44 34" />
              <path d="M30 38L34 44" />
              <path d="M22 36L20 44" />
            </svg>
          </div>

          <p className="max-w-xl mx-auto text-[17px] text-[#6D6572] leading-relaxed mb-8">
            Experience painless subscription governance, automated invoices, and full customer self-service.
          </p>

          {/* Magnetic CTA button with teal arrow pointing up at it */}
          <div className="relative inline-block">
            <MagneticButton
              to="/register"
              maxOffset={6}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#6B4A6B] hover:bg-[#593B59] text-white font-semibold text-[17px] shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] focus-visible:ring-offset-2"
            >
              Start now, it's free
            </MagneticButton>

            {/* Teal arrow doodle pointing up at button */}
            <div className="absolute -bottom-10 -right-14 pointer-events-none hidden sm:block">
              <DoodleArrowTeal className="w-12 h-10 rotate-[-15deg]" />
            </div>
          </div>

          {/* Reassurance lines */}
          <div className="flex items-center justify-center gap-4 text-[13px] text-[#6D6572] mt-8 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1E8E5A]" />
              No credit card required
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#F5A623]" />
              Instant access
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 13. SITE FOOTER */}
      {/* ======================================================== */}
      <SiteFooter />
    </div>
  );
};
