import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Zap,
  Layers,
  Calculator,
  RotateCw,
  Sparkles,
  HelpCircle,
  LogIn,
  UserPlus,
  PlayCircle,
  X,
  CornerDownLeft,
} from 'lucide-react';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteAction {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  onSelect: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const actions: PaletteAction[] = [
    {
      id: 'sim',
      title: 'Open Billing Day Simulator',
      category: 'Interactive Demo',
      icon: <Zap className="w-4 h-4 text-[#F5A623]" />,
      onSelect: () => scrollTo('simulator'),
      shortcut: 'R',
    },
    {
      id: 'playground',
      title: 'Try Plan Playground Calculator',
      category: 'Interactive Demo',
      icon: <Calculator className="w-4 h-4 text-[#12C2A5]" />,
      onSelect: () => scrollTo('playground'),
    },
    {
      id: 'before-after',
      title: 'Spreadsheets vs Brightloop Comparison',
      category: 'Features',
      icon: <RotateCw className="w-4 h-4 text-[#2BB3F3]" />,
      onSelect: () => scrollTo('comparison'),
    },
    {
      id: 'lifecycle',
      title: 'Lifecycle Story (Quote to Closed)',
      category: 'Features',
      icon: <Layers className="w-4 h-4 text-[#6B4A6B]" />,
      onSelect: () => scrollTo('lifecycle'),
    },
    {
      id: 'tour',
      title: 'Watch Product Tour Slides',
      category: 'Overview',
      icon: <PlayCircle className="w-4 h-4 text-[#F26B6B]" />,
      onSelect: () => scrollTo('tour'),
    },
    {
      id: 'plans',
      title: 'View Plans & Pricing',
      category: 'Pricing',
      icon: <Sparkles className="w-4 h-4 text-[#6B4A6B]" />,
      onSelect: () => scrollTo('plans'),
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      category: 'Help',
      icon: <HelpCircle className="w-4 h-4 text-[#6D6572]" />,
      onSelect: () => scrollTo('faq'),
    },
    {
      id: 'register',
      title: 'Sign Up (Free to try)',
      category: 'Account',
      icon: <UserPlus className="w-4 h-4 text-[#1E8E5A]" />,
      onSelect: () => {
        onClose();
        navigate('/register');
      },
    },
    {
      id: 'login',
      title: 'Sign In to Portal / Dashboard',
      category: 'Account',
      icon: <LogIn className="w-4 h-4 text-[#6B4A6B]" />,
      onSelect: () => {
        onClose();
        navigate('/login');
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1F1A21]/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-[#E3DFE5] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E3DFE5]">
          <Search className="w-5 h-5 text-[#6D6572] mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a section or command (e.g. Simulator, Plans, Tour)..."
            className="w-full bg-transparent text-[15px] text-[#1F1A21] placeholder-[#6D6572] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#6D6572] hover:text-[#1F1A21] hover:bg-[#FAF9FA]"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[#6D6572] text-[13px]">
              No matching actions found for &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onSelect}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-[13px] transition-colors ${
                  selectedIndex === idx
                    ? 'bg-[#F1EAF1] text-[#6B4A6B]'
                    : 'text-[#1F1A21] hover:bg-[#FAF9FA]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-white border border-[#E3DFE5] flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-[11px] text-[#6D6572]">{item.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[#6D6572] text-[11px]">
                  {item.shortcut && (
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E3DFE5] font-mono font-semibold text-[10px]">
                      {item.shortcut}
                    </kbd>
                  )}
                  {selectedIndex === idx && <CornerDownLeft className="w-3.5 h-3.5 text-[#6B4A6B]" />}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer Keys Help */}
        <div className="px-4 py-2 bg-[#FAF9FA] border-t border-[#E3DFE5] flex items-center justify-between text-[11px] text-[#6D6572]">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-[#E3DFE5] font-mono">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-white border border-[#E3DFE5] font-mono">↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-[#E3DFE5] font-mono">↵</kbd> Select</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-[#E3DFE5] font-mono">Esc</kbd> Close</span>
          </div>
          <span className="font-semibold text-[#6B4A6B]">Brightloop Shortcuts</span>
        </div>
      </div>
    </div>
  );
};

