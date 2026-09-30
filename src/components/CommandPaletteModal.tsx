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
  Settings,
  ArrowRight,
  ChevronRight,
  Clock,
  History,
  Trash2
} from 'lucide-react';

const RECENT_SEARCHES_KEY = 'farm_recent_searches';
const MAX_RECENT_SEARCHES = 5;

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onOpenAddModal?: (type?: RecordType) => void;
  onSelectGoat?: (goat: GoatRecord) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectGoat,
}) => {
  const { goats } = useFarm();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, MAX_RECENT_SEARCHES));
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load recent searches from localStorage:', e);
    }
    setRecentSearches([]);
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      loadRecentSearches();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Persist search query to localStorage
  const saveSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent search to localStorage:', e);
      }
      return updated;
    });
  };

  // Remove a single recent search
  const removeRecentSearch = (searchTerm: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s.toLowerCase() !== searchTerm.toLowerCase());
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to remove recent search:', e);
      }
      return updated;
    });
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Failed to clear recent searches:', e);
    }
  };

  // Select a recent search and populate search
  const handleSelectRecent = (term: string) => {
    setQuery(term);
    saveSearch(term);
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  // Navigation Items
  const navigationItems: { id: AppView; title: string; category: 'Navigation'; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', title: 'Executive Dashboard', category: 'Navigation', icon: LayoutDashboard },
    { id: 'records', title: 'Herd & Farm Records', category: 'Navigation', icon: ClipboardList },
    { id: 'health_vet', title: 'Veterinary & Health Logs', category: 'Navigation', icon: Stethoscope },
    { id: 'tasks', title: 'Tasks & Daily Schedules', category: 'Navigation', icon: CheckSquare },
    { id: 'breeding_estimator', title: 'Breeding Cycle Estimator', category: 'Navigation', icon: Baby },
    { id: 'feed_supply', title: 'Feed & Supply Inventory', category: 'Navigation', icon: Package },
    { id: 'reports', title: 'Reports & Forecasts', category: 'Navigation', icon: TrendingUp },
    { id: 'settings', title: 'Settings', category: 'Navigation', icon: Settings },
  ];

  // Search results for goats
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

  // Search results for navigation
  const filteredNav = useMemo(() => {
    if (!query.trim()) return navigationItems;
    const q = query.trim().toLowerCase();
    return navigationItems.filter(item => item.title.toLowerCase().includes(q));
  }, [navigationItems, query]);

  // Combined flat items list for keyboard selection
  const flatItems = useMemo(() => {
    const list: Array<
      | { type: 'recent'; data: string }
      | { type: 'goat'; data: GoatRecord }
      | { type: 'nav'; data: typeof navigationItems[0] }
    > = [];

    // Show recent searches when search query is empty
    if (!query.trim()) {
      recentSearches.forEach(term => list.push({ type: 'recent', data: term }));
    }

    filteredGoats.forEach(g => list.push({ type: 'goat', data: g }));
    filteredNav.forEach(n => list.push({ type: 'nav', data: n }));

    return list;
  }, [query, recentSearches, filteredGoats, filteredNav]);

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
          if (current.type === 'recent') {
            handleSelectRecent(current.data);
          } else if (current.type === 'goat') {
            saveSearch(query.trim() || current.data.tag_number);
            if (onSelectGoat) {
              onSelectGoat(current.data);
            } else {
              onNavigate('records');
            }
            onClose();
          } else if (current.type === 'nav') {
            if (query.trim()) saveSearch(query.trim());
            onNavigate(current.data.id);
            onClose();
          }
        } else if (query.trim()) {
          saveSearch(query.trim());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose, onNavigate, onSelectGoat, query, recentSearches]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (query.trim()) {
              saveSearch(query.trim());
              const current = flatItems[selectedIndex];
              if (current) {
                if (current.type === 'recent') {
                  handleSelectRecent(current.data);
                } else if (current.type === 'goat') {
                  if (onSelectGoat) {
                    onSelectGoat(current.data);
                  } else {
                    onNavigate('records');
                  }
                  onClose();
                } else if (current.type === 'nav') {
                  onNavigate(current.data.id);
                  onClose();
                }
              }
            }
          }}
          className="relative flex items-center px-4 py-3.5 border-b border-stone-200 dark:border-stone-800"
        >
          <Search className="w-5 h-5 text-stone-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search goat tag (e.g. GT-101), breed, name, or navigate view..."
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
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg cursor-pointer"
              title="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-2 px-2 py-1 rounded-md text-[11px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer"
          >
            ESC
          </button>
        </form>

        {/* Quick Recent Chips Bar if query is empty and we have recent searches */}
        {!query && recentSearches.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-900/60 overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-stone-500 shrink-0 flex items-center gap-1">
              <History className="w-3 h-3 text-stone-400" /> Recent:
            </span>
            {recentSearches.map(term => (
              <button
                key={`chip-${term}`}
                type="button"
                onClick={() => handleSelectRecent(term)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0 shadow-2xs cursor-pointer"
                title={`Re-run search for "${term}"`}
              >
                <span>{term}</span>
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Recent Searches (when query is empty) */}
          {!query && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Recent Searches (Last {recentSearches.length})
                </span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear search history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear history</span>
                </button>
              </div>
              <div className="mt-1 space-y-1">
                {recentSearches.map(term => {
                  const itemIndex = flatItems.findIndex(i => i.type === 'recent' && i.data === term);
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <div
                      key={`recent-item-${term}`}
                      onClick={() => handleSelectRecent(term)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center shrink-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          <History className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold truncate">{term}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-stone-400 hidden group-hover:inline">Select ↵</span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          className="p-1 text-stone-400 hover:text-red-500 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                          title="Remove from history"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                        saveSearch(query.trim() || goat.tag_number);
                        if (onSelectGoat) {
                          onSelectGoat(goat);
                        } else {
                          onNavigate('records');
                        }
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 shrink-0">
                          <img
                            src={goat.photo_url || (goat.gender === 'Male' ? '/jamunapari-goats.png' : '/images/nav/doe.jpg')}
                            alt={goat.tag_number}
                            className="w-full h-full object-cover"
                          />
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
                        if (query.trim()) saveSearch(query.trim());
                        onNavigate(nav.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
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
              No matching records or views found for "{query}".
            </div>
          )}
        </div>

        {/* Footer Guidance */}
        <div className="px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[10px]">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[10px]">↵</kbd> select</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[10px]">esc</kbd> close</span>
          </div>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Command & Search Palette</span>
        </div>
      </div>
    </div>
  );
};
