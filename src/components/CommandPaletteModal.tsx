import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { AppView, RecordType, GoatRecord } from '../types';
import {
  Search,
  X,
  LayoutDashboard,
  CheckSquare,
  Package,
  Baby,
  ClipboardList,
  Stethoscope,
  TrendingUp,
  Building2,
  Plus,
  ArrowRight,
  ChevronRight,
  Milk,
  DollarSign,
  HeartPulse,
  Tag
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onOpenAddModal: (type?: RecordType) => void;
  onSelectGoat?: (goat: GoatRecord) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAddModal,
  onSelectGoat,
}) => {
  const { goats, breeding, health } = useFarm();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Section list
  const navigationItems: { id: AppView; title: string; category: 'Navigation'; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', title: 'Executive Dashboard', category: 'Navigation', icon: LayoutDashboard },
    { id: 'records', title: 'Herd & Farm Records', category: 'Navigation', icon: ClipboardList },
    { id: 'health_vet', title: 'Veterinary & Health Logs', category: 'Navigation', icon: Stethoscope },
    { id: 'tasks', title: 'Tasks & Daily Schedules', category: 'Navigation', icon: CheckSquare },
    { id: 'breeding_estimator', title: 'Breeding Cycle Estimator', category: 'Navigation', icon: Baby },
    { id: 'feed_supply', title: 'Feed & Supply Inventory', category: 'Navigation', icon: Package },
    { id: 'reports', title: 'Reports & Forecasts', category: 'Navigation', icon: TrendingUp },
    { id: 'profile', title: 'Farm Profile & Identity', category: 'Navigation', icon: Building2 },
  ];

  const actionItems: { title: string; recordType: RecordType; category: 'Action'; icon: React.ComponentType<{ className?: string }> }[] = [
    { title: 'Add New Goat / Kid', recordType: 'goat', category: 'Action', icon: Plus },
    { title: 'Record Health & Vet Treatment', recordType: 'health', category: 'Action', icon: HeartPulse },
    { title: 'Log Daily Milk Yield', recordType: 'milk', category: 'Action', icon: Milk },
    { title: 'Record Breeding Mating', recordType: 'breeding', category: 'Action', icon: Baby },
    { title: 'Record Goat Sale', recordType: 'sale', category: 'Action', icon: DollarSign },
    { title: 'Record Farm Expense', recordType: 'expense', category: 'Action', icon: DollarSign },
  ];

  // Search results
  const filteredGoats = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return goats
      .filter(
        g =>
          g.tag_number.toLowerCase().includes(q) ||
          (g.name && g.name.toLowerCase().includes(q)) ||
          g.breed.toLowerCase().includes(q) ||
          (g.status && g.status.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [goats, query]);

  const filteredNav = useMemo(() => {
    if (!query.trim()) return navigationItems;
    const q = query.trim().toLowerCase();
    return navigationItems.filter(item => item.title.toLowerCase().includes(q));
  }, [navigationItems, query]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actionItems;
    const q = query.trim().toLowerCase();
    return actionItems.filter(item => item.title.toLowerCase().includes(q));
  }, [actionItems, query]);

  // Combined flat items list for keyboard selection
  const flatItems = useMemo(() => {
    const list: Array<
      | { type: 'goat'; data: GoatRecord }
      | { type: 'nav'; data: typeof navigationItems[0] }
      | { type: 'action'; data: typeof actionItems[0] }
    > = [];

    filteredGoats.forEach(g => list.push({ type: 'goat', data: g }));
    filteredNav.forEach(n => list.push({ type: 'nav', data: n }));
    filteredActions.forEach(a => list.push({ type: 'action', data: a }));

    return list;
  }, [filteredGoats, filteredNav, filteredActions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, flatItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const current = flatItems[selectedIndex];
        if (current) {
          if (current.type === 'goat') {
            onNavigate('records');
            if (onSelectGoat) onSelectGoat(current.data);
            onClose();
          } else if (current.type === 'nav') {
            onNavigate(current.data.id);
            onClose();
          } else if (current.type === 'action') {
            onOpenAddModal(current.data.recordType);
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose, onNavigate, onOpenAddModal, onSelectGoat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-stone-200 dark:border-stone-800">
          <Search className="w-5 h-5 text-stone-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search goat tag (e.g. GT-101), navigate view, or type an action..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-2 px-2 py-1 rounded-md text-[11px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Goat Search Results */}
          {filteredGoats.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Herd Goats Matching "{query}"
              </div>
              <div className="mt-1 space-y-1">
                {filteredGoats.map(goat => {
                  const itemIndex = flatItems.findIndex(i => i.type === 'goat' && i.data.id === goat.id);
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={goat.id}
                      type="button"
                      onClick={() => {
                        onNavigate('records');
                        if (onSelectGoat) onSelectGoat(goat);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          🐐
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2">
                            <span>{goat.tag_number}</span>
                            {goat.name && <span className="text-stone-500 font-normal">({goat.name})</span>}
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                              {goat.gender}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400">
                            Breed: {goat.breed} • Status: {goat.status || 'Active'}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Quick Actions
              </div>
              <div className="mt-1 space-y-1">
                {filteredActions.map(action => {
                  const Icon = action.icon;
                  const itemIndex = flatItems.findIndex(i => i.type === 'action' && i.data.recordType === action.recordType);
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={action.recordType}
                      type="button"
                      onClick={() => {
                        onOpenAddModal(action.recordType);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-semibold">{action.title}</span>
                      </div>
                      <span className="text-[10px] text-stone-400">Press Enter</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Views */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Navigation Views
              </div>
              <div className="mt-1 space-y-1">
                {filteredNav.map(nav => {
                  const Icon = nav.icon;
                  const itemIndex = flatItems.findIndex(i => i.type === 'nav' && i.data.id === nav.id);
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={nav.id}
                      type="button"
                      onClick={() => {
                        onNavigate(nav.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                        </div>
                        <span className="text-xs font-semibold">{nav.title}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {flatItems.length === 0 && (
            <div className="p-8 text-center text-xs text-stone-500 dark:text-stone-400">
              No matching records, views, or actions found for "{query}".
            </div>
          )}
        </div>

        {/* Footer Guidance */}
        <div className="px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[10px]">↑↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[10px]">↵</kbd> to select</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[10px]">esc</kbd> to close</span>
          </div>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Quick Command Palette</span>
        </div>
      </div>
    </div>
  );
};
