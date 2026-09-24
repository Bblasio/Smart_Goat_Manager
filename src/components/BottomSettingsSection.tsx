import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import {
  Settings,
  Moon,
  Sun,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Calendar,
  Package,
  Activity,
  Sliders,
  Database,
  RefreshCw,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';

export interface FarmAppSettings {
  breedingAlerts: boolean;
  quarantineAlerts: boolean;
  vaccineAlerts: boolean;
  feedLowStockAlerts: boolean;
  soundEnabled: boolean;
  currency: 'Ksh' | 'USD' | 'EUR';
  weightUnit: 'kg' | 'lbs';
  milkUnit: 'L' | 'gal';
  quarantineDurationDays: number;
}

const DEFAULT_SETTINGS: FarmAppSettings = {
  breedingAlerts: true,
  quarantineAlerts: true,
  vaccineAlerts: true,
  feedLowStockAlerts: true,
  soundEnabled: true,
  currency: 'Ksh',
  weightUnit: 'kg',
  milkUnit: 'L',
  quarantineDurationDays: 14,
};

interface BottomSettingsSectionProps {
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

export const BottomSettingsSection: React.FC<BottomSettingsSectionProps> = ({
  isOpen: externalIsOpen,
  onToggleOpen: externalToggle,
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { goats, health, breeding, sales, expenses, isDemoMode } = useFarm();
  const { showToast } = useToast();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const toggleOpen = externalToggle || (() => setInternalIsOpen(prev => !prev));

  const [settings, setSettings] = useState<FarmAppSettings>(() => {
    try {
      const saved = localStorage.getItem('sgm_farm_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('sgm_farm_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const updateSetting = <K extends keyof FarmAppSettings>(key: K, value: FarmAppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    showToast(`Setting updated: ${key.replace(/([A-Z])/g, ' $1')}`, 'info');
  };

  const handleExportAllData = () => {
    try {
      const fullBackup = {
        exportDate: new Date().toISOString(),
        settings,
        stats: {
          goatsCount: goats.length,
          healthLogsCount: health.length,
          breedingCount: breeding.length,
          salesCount: sales.length,
          expensesCount: expenses.length,
        },
        goats,
        health,
        breeding,
        sales,
        expenses,
      };

      const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `goat_farm_complete_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Complete farm database backup downloaded', 'success');
    } catch {
      showToast('Failed to export farm backup', 'error');
    }
  };

  const handleClearLocalCache = () => {
    if (window.confirm('Reset local notifications and clear cached temp filters? Your herd data will remain safely stored.')) {
      try {
        localStorage.removeItem('sgm_dismissed_notifications');
        showToast('Local cache and dismissed notifications reset', 'success');
      } catch {
        showToast('Failed to clear cache', 'error');
      }
    }
  };

  return (
    <section
      id="farm-bottom-settings"
      aria-label="Farm & Application Settings"
      className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Toggle Bar / Quick Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            id="btn-toggle-bottom-settings"
            onClick={toggleOpen}
            className="flex items-center gap-2.5 text-left group text-stone-800 dark:text-stone-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/60 flex items-center justify-center text-stone-600 dark:text-stone-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-2">
                <span>Farm &amp; System Settings</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'} • Alerts {settings.breedingAlerts && settings.quarantineAlerts ? 'Active' : 'Custom'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Configure appearance, alerts, units, quarantine standards, and local preferences
              </p>
            </div>
            <div className="ml-2 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200 transition-transform">
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {/* Quick theme pill right in header */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-quick-theme-toggle"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors"
              title="Toggle Dark Mode / Light Mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-stone-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {!isOpen && (
              <button
                type="button"
                onClick={toggleOpen}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline px-2 py-1"
              >
                More Settings...
              </button>
            )}
          </div>
        </div>

        {/* Expanded Detailed Settings Panel */}
        {isOpen && (
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Column 1: Appearance & Theme */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                <Moon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Display &amp; Appearance</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Choose light or dark visual theme for barn environments and field daylight.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-set-theme-light"
                  onClick={() => setTheme('light')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    theme === 'light'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Sun className="w-4 h-4 text-amber-500" />
                    {theme === 'light' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <div className="text-xs mt-1.5 font-semibold">Light Mode</div>
                  <div className="text-[10px] text-stone-500">Daylight clarity</div>
                </button>

                <button
                  type="button"
                  id="btn-set-theme-dark"
                  onClick={() => setTheme('dark')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    theme === 'dark'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    {theme === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-xs mt-1.5 font-semibold">Dark Mode</div>
                  <div className="text-[10px] text-stone-400">Low-glare night</div>
                </button>
              </div>

              {/* Sound Notifications Toggle */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-stone-400" />
                  )}
                  <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">Alert Sounds</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    settings.soundEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {/* Column 2: Notification Preferences */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Notification Alerts</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Select which proactive agricultural alerts trigger badge alerts.
              </p>

              <div className="space-y-2 text-xs">
                {/* Breeding Alerts */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <span className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>Breeding Due &amp; Kidding</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.breedingAlerts}
                    onChange={e => updateSetting('breedingAlerts', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                  />
                </label>

                {/* Quarantine Alerts */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <span className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quarantine 14-Day Status</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.quarantineAlerts}
                    onChange={e => updateSetting('quarantineAlerts', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                  />
                </label>

                {/* Health & Vaccine Alerts */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <span className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                    <Activity className="w-3.5 h-3.5 text-rose-600" />
                    <span>Vaccination &amp; Health</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.vaccineAlerts}
                    onChange={e => updateSetting('vaccineAlerts', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                  />
                </label>

                {/* Feed Low Stock Alerts */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <span className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                    <Package className="w-3.5 h-3.5 text-amber-500" />
                    <span>Low Feed Stock Warnings</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.feedLowStockAlerts}
                    onChange={e => updateSetting('feedLowStockAlerts', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                  />
                </label>
              </div>
            </div>

            {/* Column 3: Units & Standards */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Units &amp; Standards</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Farm currency, measurement units, and bio-security defaults.
              </p>

              <div className="space-y-2.5 text-xs">
                {/* Currency */}
                <div>
                  <label className="block text-[11px] text-stone-500 dark:text-stone-400 font-medium mb-1">
                    Currency Symbol
                  </label>
                  <select
                    value={settings.currency}
                    onChange={e => updateSetting('currency', e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Ksh">Ksh — Kenyan Shilling</option>
                    <option value="USD">$ — US Dollar</option>
                    <option value="EUR">€ — Euro</option>
                  </select>
                </div>

                {/* Weight Unit */}
                <div>
                  <label className="block text-[11px] text-stone-500 dark:text-stone-400 font-medium mb-1">
                    Weight Scale Unit
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateSetting('weightUnit', 'kg')}
                      className={`py-1 px-2 rounded-lg border text-xs font-semibold ${
                        settings.weightUnit === 'kg'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      Kilograms (kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSetting('weightUnit', 'lbs')}
                      className={`py-1 px-2 rounded-lg border text-xs font-semibold ${
                        settings.weightUnit === 'lbs'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      Pounds (lbs)
                    </button>
                  </div>
                </div>

                {/* Bio-security Quarantine Info */}
                <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Automatic Bio-Security Quarantine</span>
                  </div>
                  <div className="mt-0.5 text-emerald-700 dark:text-emerald-400">
                    Standard duration: <strong>14 Days</strong> (starts automatically from Day 0 upon registration/isolation).
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: Backup & Maintenance */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Backup &amp; Cache</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Export records or clear temporary client-side data.
              </p>

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  id="btn-export-farm-json"
                  onClick={handleExportAllData}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON Farm Backup</span>
                </button>

                <button
                  type="button"
                  id="btn-clear-settings-cache"
                  onClick={handleClearLocalCache}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-700 dark:text-stone-300 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cache &amp; Reset Alerts</span>
                </button>

                <div className="pt-1 text-[11px] text-stone-400 dark:text-stone-500 flex items-center justify-between">
                  <span>Storage: {isDemoMode ? 'Local + Demo' : 'Firestore Cloud'}</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
