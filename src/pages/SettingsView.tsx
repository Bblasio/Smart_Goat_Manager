import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { AppView } from '../types';
import { PWAInstallButton } from '../components/PWAInstallButton';
import {
  Settings,
  User,
  Moon,
  Sun,
  Bell,
  Sliders,
  Database,
  Info,
  Search,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Building2,
  Calendar,
  Package,
  Activity,
  Download,
  Trash2,
  Check,
  X,
  Phone,
  MapPin,
  Maximize2,
  Award,
  Sparkles,
  Save,
  Volume2,
  VolumeX,
  Laptop
} from 'lucide-react';

interface SettingsViewProps {
  onNavigate?: (view: AppView) => void;
  initialSection?: string;
  onMobileDrillChange?: (drilled: boolean) => void;
}

export type SettingsSection =
  | 'you_and_farm'
  | 'appearance'
  | 'notifications'
  | 'units'
  | 'data_backup'
  | 'about';

interface NavItemConfig {
  id: SettingsSection;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgLight: string;
  iconColorLight: string;
  iconBgDark: string;
  iconColorDark: string;
  group: 'account' | 'preferences' | 'system';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onNavigate,
  initialSection,
  onMobileDrillChange,
}) => {
  const {
    farmName,
    user,
    logout,
    updateFarmProfile,
    syncAllCurrentRecordsToFirebase,
    syncStatus,
    syncError,
    goats,
    health,
    breeding,
    sales,
    expenses,
    isDemoMode,
    isOnline,
  } = useFarm();

  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  // Desktop active section vs Mobile drill-down state
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    (initialSection as SettingsSection) || 'you_and_farm'
  );

  // On mobile (<1024px), Screen 1 is the root nav list and Screen 2 is the drilled-in content
  const [isMobileDrilledIn, setIsMobileDrilledIn] = useState<boolean>(
    Boolean(initialSection && initialSection !== 'root')
  );

  // Active state on return: visually highlights the last visited section on Screen 1
  const [lastVisitedSection, setLastVisitedSection] = useState<SettingsSection | null>(
    initialSection ? (initialSection as SettingsSection) : null
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Notify parent component (App.tsx) when mobile drill state changes so bottom nav can hide on Screen 2
  useEffect(() => {
    onMobileDrillChange?.(isMobileDrilledIn);
  }, [isMobileDrilledIn, onMobileDrillChange]);

  // Profile Form state
  const [farmNameVal, setFarmNameVal] = useState(user?.farm_name || farmName || '');
  const [ownerNameVal, setOwnerNameVal] = useState(user?.owner_name || 'Blasio Odhiambo');
  const [locationVal, setLocationVal] = useState(user?.location || 'Kiambu, Kenya');
  const [phoneVal, setPhoneVal] = useState(user?.phone || '+254 712 345 678');
  const [farmSizeVal, setFarmSizeVal] = useState(user?.farm_size || '12 Acres');
  const [primaryBreedVal, setPrimaryBreedVal] = useState(user?.primary_breed || 'Boer & Dairy Galla');
  const [productionFocusVal, setProductionFocusVal] = useState(user?.production_focus || 'Dairy & Breeding Stock');
  const [grazingSystemVal, setGrazingSystemVal] = useState(user?.grazing_system || 'Zero-Grazing / Intensive');
  const [foundedYearVal, setFoundedYearVal] = useState(user?.founded_year || '2021');
  const [bioVal, setBioVal] = useState(user?.bio || 'Dedicated to high-yield caprine genetics and dairy management.');

  // App Settings state (synced with localStorage)
  const [breedingAlerts, setBreedingAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sgm_pref_breeding_alerts');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [quarantineAlerts, setQuarantineAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sgm_pref_quarantine_alerts');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [vaccineAlerts, setVaccineAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sgm_pref_vaccine_alerts');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [feedLowStockAlerts, setFeedLowStockAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sgm_pref_feed_alerts');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem('sgm_pref_currency') || 'Ksh';
  });

  const [weightUnit, setWeightUnit] = useState<string>(() => {
    return localStorage.getItem('sgm_pref_weight_unit') || 'kg';
  });

  const [milkUnit, setMilkUnit] = useState<string>(() => {
    return localStorage.getItem('sgm_pref_milk_unit') || 'L';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sgm_pref_sound');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Sync profile form when user object updates
  useEffect(() => {
    if (user) {
      if (user.farm_name) setFarmNameVal(user.farm_name);
      if (user.owner_name) setOwnerNameVal(user.owner_name);
      if (user.location) setLocationVal(user.location);
      if (user.phone) setPhoneVal(user.phone);
      if (user.farm_size) setFarmSizeVal(user.farm_size);
      if (user.primary_breed) setPrimaryBreedVal(user.primary_breed);
      if (user.production_focus) setProductionFocusVal(user.production_focus);
      if (user.grazing_system) setGrazingSystemVal(user.grazing_system);
      if (user.founded_year) setFoundedYearVal(user.founded_year);
      if (user.bio) setBioVal(user.bio);
    }
  }, [user]);

  // Persist preference helpers
  const handleToggleBreedingAlerts = () => {
    setBreedingAlerts(prev => {
      const next = !prev;
      localStorage.setItem('sgm_pref_breeding_alerts', JSON.stringify(next));
      showToast(`Breeding alerts ${next ? 'enabled' : 'disabled'}`, 'info');
      return next;
    });
  };

  const handleToggleQuarantineAlerts = () => {
    setQuarantineAlerts(prev => {
      const next = !prev;
      localStorage.setItem('sgm_pref_quarantine_alerts', JSON.stringify(next));
      showToast(`14-day quarantine alerts ${next ? 'enabled' : 'disabled'}`, 'info');
      return next;
    });
  };

  const handleToggleVaccineAlerts = () => {
    setVaccineAlerts(prev => {
      const next = !prev;
      localStorage.setItem('sgm_pref_vaccine_alerts', JSON.stringify(next));
      showToast(`Vaccination alerts ${next ? 'enabled' : 'disabled'}`, 'info');
      return next;
    });
  };

  const handleToggleFeedAlerts = () => {
    setFeedLowStockAlerts(prev => {
      const next = !prev;
      localStorage.setItem('sgm_pref_feed_alerts', JSON.stringify(next));
      showToast(`Low feed stock alerts ${next ? 'enabled' : 'disabled'}`, 'info');
      return next;
    });
  };

  const handleToggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('sgm_pref_sound', JSON.stringify(next));
      showToast(`Audio alerts ${next ? 'enabled' : 'muted'}`, 'info');
      return next;
    });
  };

  const handleSetCurrency = (cur: string) => {
    setCurrency(cur);
    localStorage.setItem('sgm_pref_currency', cur);
    showToast(`Currency updated to ${cur}`, 'success');
  };

  const handleSetWeightUnit = (unit: string) => {
    setWeightUnit(unit);
    localStorage.setItem('sgm_pref_weight_unit', unit);
    showToast(`Weight unit updated to ${unit}`, 'success');
  };

  const handleSetMilkUnit = (unit: string) => {
    setMilkUnit(unit);
    localStorage.setItem('sgm_pref_milk_unit', unit);
    showToast(`Milk unit updated to ${unit}`, 'success');
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncAllCurrentRecordsToFirebase();
      showToast('All farm records synchronized with Firebase cloud', 'success');
    } catch {
      showToast('Failed to complete cloud synchronization', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    try {
      await updateFarmProfile({
        farm_name: farmNameVal,
        owner_name: ownerNameVal,
        location: locationVal,
        phone: phoneVal,
        farm_size: farmSizeVal,
        primary_breed: primaryBreedVal,
        production_focus: productionFocusVal,
        grazing_system: grazingSystemVal,
        founded_year: foundedYearVal,
        bio: bioVal,
      });
      setProfileSuccessMsg('Profile updated and saved to cloud!');
      showToast('Farm profile updated successfully', 'success');
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch {
      showToast('Failed to save profile changes', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '2.5',
        farmName: farmNameVal || farmName,
        owner: ownerNameVal,
        email: user?.email || 'ochiengblasio@gmail.com',
        stats: {
          goatsCount: goats.length,
          healthLogsCount: health.length,
          breedingCount: breeding.length,
          salesCount: sales.length,
          expensesCount: expenses.length,
        },
        preferences: {
          currency,
          weightUnit,
          milkUnit,
          breedingAlerts,
          quarantineAlerts,
          vaccineAlerts,
          feedLowStockAlerts,
        },
        records: {
          goats,
          health,
          breeding,
          sales,
          expenses,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart_goat_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Farm backup JSON exported successfully', 'success');
    } catch {
      showToast('Failed to export backup', 'error');
    }
  };

  const handleResetCache = () => {
    if (window.confirm('Clear cached temporary data and reset notification dismissals? Your herd records will remain intact.')) {
      try {
        localStorage.removeItem('sgm_dismissed_notifs');
        localStorage.removeItem('sgm_dismissed_notifications');
        showToast('Local cache and notifications reset successfully', 'success');
      } catch {
        showToast('Failed to clear cache', 'error');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast('Signed out successfully', 'info');
    } catch {
      showToast('Error during sign out', 'error');
    }
  };

  // Nav items configuration
  const navItems: NavItemConfig[] = [
    {
      id: 'you_and_farm',
      label: 'You and Smart Goat',
      subtitle: 'Farm identity, cloud sync & owner profile',
      icon: User,
      iconBgLight: 'bg-emerald-100',
      iconColorLight: 'text-emerald-700',
      iconBgDark: 'dark:bg-emerald-950/60',
      iconColorDark: 'dark:text-emerald-400',
      group: 'account',
    },
    {
      id: 'appearance',
      label: 'Appearance',
      subtitle: `Theme: ${theme === 'dark' ? 'Dark Mode' : 'Light Mode'} • Sound alerts`,
      icon: Moon,
      iconBgLight: 'bg-indigo-100',
      iconColorLight: 'text-indigo-700',
      iconBgDark: 'dark:bg-indigo-950/60',
      iconColorDark: 'dark:text-indigo-400',
      group: 'preferences',
    },
    {
      id: 'notifications',
      label: 'Notifications & Alerts',
      subtitle: 'Breeding countdowns, quarantine & vaccines',
      icon: Bell,
      iconBgLight: 'bg-amber-100',
      iconColorLight: 'text-amber-700',
      iconBgDark: 'dark:bg-amber-950/60',
      iconColorDark: 'dark:text-amber-400',
      group: 'preferences',
    },
    {
      id: 'units',
      label: 'Units & Standards',
      subtitle: `${currency} • ${weightUnit} • ${milkUnit} • 14-day quarantine`,
      icon: Sliders,
      iconBgLight: 'bg-teal-100',
      iconColorLight: 'text-teal-700',
      iconBgDark: 'dark:bg-teal-950/60',
      iconColorDark: 'dark:text-teal-400',
      group: 'preferences',
    },
    {
      id: 'data_backup',
      label: 'Data & Backup',
      subtitle: 'Download JSON archive & cache reset',
      icon: Database,
      iconBgLight: 'bg-sky-100',
      iconColorLight: 'text-sky-700',
      iconBgDark: 'dark:bg-sky-950/60',
      iconColorDark: 'dark:text-sky-400',
      group: 'system',
    },
    {
      id: 'about',
      label: 'About Smart Goat Manager',
      subtitle: 'Version 2.5 • Enterprise Caprine Edition',
      icon: Info,
      iconBgLight: 'bg-stone-200',
      iconColorLight: 'text-stone-700',
      iconBgDark: 'dark:bg-stone-800',
      iconColorDark: 'dark:text-stone-300',
      group: 'system',
    },
  ];

  // Mobile Drill-down Navigation Handlers
  const handleSelectSection = (id: SettingsSection) => {
    setActiveSection(id);
    setLastVisitedSection(id);
    setIsMobileDrilledIn(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBackToRoot = () => {
    setIsMobileDrilledIn(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const displayOwnerName = user?.owner_name || ownerNameVal || 'Blasio Odhiambo';
  const displayEmail = user?.email || 'ochiengblasio@gmail.com';
  const displayFarmName = user?.farm_name || farmNameVal || farmName || 'Smart Goat Farm';

  // Section 1: You and Smart Goat
  const renderYouAndFarmSection = () => (
    <section
      id="section-you-and-farm"
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-2xs space-y-5"
    >
      <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          <span>You and Smart Goat Manager</span>
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Manage your manager identity, cloud synchronization, and credentials
        </p>
      </div>

      {/* Chrome Style Top Profile Card */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-700/80 bg-stone-50/60 dark:bg-stone-800/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-lg shadow-xs ring-2 ring-white dark:ring-stone-900">
              {displayOwnerName.charAt(0).toUpperCase()}
            </div>
            <span
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-900"
              title="Cloud Synchronized & Online"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate">
              {displayOwnerName}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
              <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Syncing to {displayEmail}</span>
            </div>
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
              {displayFarmName} • {isDemoMode ? 'Demo Workspace' : 'Cloud Verified'}
            </div>
          </div>
        </div>

        {/* Chrome "Turn off" Style Sign Out Button */}
        <div className="shrink-0 w-full sm:w-auto flex justify-end">
          <button
            type="button"
            id="btn-settings-sign-out"
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-full border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-800 text-stone-700 dark:text-stone-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Sub-rows under Profile Card */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
        {/* Row 1: Sync and Cloud Services */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-stone-900 flex items-center justify-between gap-3 hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                Sync and Cloud Services
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                {syncStatus === 'connected'
                  ? 'All records up to date with Realtime Database'
                  : 'Synchronized with local offline cache and cloud'}
              </div>
            </div>
          </div>
          <button
            type="button"
            id="btn-settings-sync-now"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {/* Row 2: Manage Farm Profile Details */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-stone-900 hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Manage Farm Profile &amp; Identity
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  {displayFarmName} • {locationVal || 'Kenya'} • {farmSizeVal || 'Size not specified'}
                </div>
              </div>
            </div>
            <button
              type="button"
              id="btn-settings-toggle-edit-profile"
              onClick={() => setIsEditingProfile(prev => !prev)}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {isEditingProfile ? 'Close Editor' : 'Edit Profile'}
            </button>
          </div>

          {/* Inline Profile Editor */}
          {isEditingProfile && (
            <form onSubmit={handleSaveProfile} className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Farm Name
                  </label>
                  <input
                    type="text"
                    value={farmNameVal}
                    onChange={e => setFarmNameVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Manager / Owner Name
                  </label>
                  <input
                    type="text"
                    value={ownerNameVal}
                    onChange={e => setOwnerNameVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Location / Region
                  </label>
                  <input
                    type="text"
                    value={locationVal}
                    onChange={e => setLocationVal(e.target.value)}
                    placeholder="e.g. Kiambu, Kenya"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phoneVal}
                    onChange={e => setPhoneVal(e.target.value)}
                    placeholder="e.g. +254 712 345 678"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Primary Goat Breed
                  </label>
                  <input
                    type="text"
                    value={primaryBreedVal}
                    onChange={e => setPrimaryBreedVal(e.target.value)}
                    placeholder="e.g. Boer, Dairy Galla, Saanen"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Farm Land Size
                  </label>
                  <input
                    type="text"
                    value={farmSizeVal}
                    onChange={e => setFarmSizeVal(e.target.value)}
                    placeholder="e.g. 10 Acres"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1 text-xs">
                  Farm Bio / Pedigree Motto
                </label>
                <textarea
                  value={bioVal}
                  onChange={e => setBioVal(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {profileSuccessMsg && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Row 3: Google Account & Cloud Credentials */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-stone-900 flex items-center justify-between gap-3 hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                Google Account &amp; Farm Owner
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                {displayEmail} (Firebase Realtime Database Active)
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Protected
          </span>
        </div>
      </div>
    </section>
  );

  // Section 2: Appearance
  const renderAppearanceSection = () => (
    <section
      id="section-appearance"
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-2xs space-y-5"
    >
      <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-600" />
          <span>Appearance &amp; Display Theme</span>
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Customize high-contrast daylight reading and evening low-glare dark mode
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Light Theme Card */}
        <button
          type="button"
          id="btn-settings-theme-light"
          onClick={() => {
            setTheme('light');
            showToast('Switched to Light mode', 'info');
          }}
          className={`p-4 rounded-2xl border-2 text-left transition-all ${
            theme === 'light'
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs ring-2 ring-emerald-500/20'
              : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sun className="w-5 h-5" />
            </div>
            {theme === 'light' && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                ✓
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-stone-900 dark:text-stone-100">Light Mode</div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Optimized for full outdoor daylight pasture inspection and livestock pen walks.
          </p>
        </button>

        {/* Dark Theme Card */}
        <button
          type="button"
          id="btn-settings-theme-dark"
          onClick={() => {
            setTheme('dark');
            showToast('Switched to Dark mode', 'info');
          }}
          className={`p-4 rounded-2xl border-2 text-left transition-all ${
            theme === 'dark'
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs ring-2 ring-emerald-500/20'
              : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-stone-800 text-stone-200 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            {theme === 'dark' && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                ✓
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-stone-900 dark:text-stone-100">Dark Mode</div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Gentle on the eyes during late-night kidding vigils, barn checks, and low-light work.
          </p>
        </button>
      </div>

      {/* Audio Sound Alert Option */}
      <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center justify-center shrink-0">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                Audible Task &amp; Notification Chimes
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                Play acoustic tone when completing schedules or recording vitals
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleSound}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              soundEnabled ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );

  // Section 3: Notifications
  const renderNotificationsSection = () => (
    <section
      id="section-notifications"
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-2xs space-y-4"
    >
      <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-600" />
          <span>Notifications &amp; Automated Alerts</span>
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Configure proactive smart alerts for clinical bio-security, breeding cycles, and feed inventory
        </p>
      </div>

      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {/* Toggle 1: Breeding Alert */}
        <div className="py-3.5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
              Breeding &amp; Kidding Countdown Alerts
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400">
              Proactive alerts 14 days before expected doe parturition date
            </div>
          </div>
          <button
            type="button"
            id="toggle-breeding-alerts"
            onClick={handleToggleBreedingAlerts}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              breedingAlerts ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                breedingAlerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Quarantine Alert */}
        <div className="py-3.5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
              14-Day Bio-Security Quarantine Timer
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400">
              Automatic zero-day countdown alerts for newly acquired or isolated goats
            </div>
          </div>
          <button
            type="button"
            id="toggle-quarantine-alerts"
            onClick={handleToggleQuarantineAlerts}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              quarantineAlerts ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                quarantineAlerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 3: Vaccination Alert */}
        <div className="py-3.5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
              Scheduled Vaccination &amp; Deworming Booster Warnings
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400">
              Alerts for upcoming PPR, CCPP, Enterotoxemia, and anthelmintic rotations
            </div>
          </div>
          <button
            type="button"
            id="toggle-vaccine-alerts"
            onClick={handleToggleVaccineAlerts}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              vaccineAlerts ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                vaccineAlerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 4: Low Feed Stock Alert */}
        <div className="py-3.5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
              Low Feed &amp; Mineral Stock Depletion Notice
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400">
              Alert when concentrate, hay bales, or salt blocks drop below 3 days buffer
            </div>
          </div>
          <button
            type="button"
            id="toggle-feed-alerts"
            onClick={handleToggleFeedAlerts}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              feedLowStockAlerts ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                feedLowStockAlerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );

  // Section 4: Units & Standards
  const renderUnitsSection = () => (
    <section
      id="section-units"
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-2xs space-y-5"
    >
      <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-teal-600" />
          <span>Units, Currencies &amp; Standards</span>
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Define financial currency, live weight measurement, and dairy volume units
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Currency Unit */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2">
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            Financial Currency
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {['Ksh', 'USD', 'EUR'].map(cur => (
              <button
                key={cur}
                type="button"
                onClick={() => handleSetCurrency(cur)}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                  currency === cur
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-stone-400">Used across sales, expenses, and herd valuations</p>
        </div>

        {/* Live Weight Unit */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2">
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            Live Weight Scale
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { val: 'kg', label: 'Kilograms (kg)' },
              { val: 'lbs', label: 'Pounds (lbs)' },
            ].map(w => (
              <button
                key={w.val}
                type="button"
                onClick={() => handleSetWeightUnit(w.val)}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                  weightUnit === w.val
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                }`}
              >
                {w.val}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-stone-400">Used for animal weighing, dosing, and kid growth charts</p>
        </div>

        {/* Milk Yield Unit */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2">
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            Daily Milk Yield
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { val: 'L', label: 'Litres (L)' },
              { val: 'gal', label: 'Gallons (gal)' },
            ].map(m => (
              <button
                key={m.val}
                type="button"
                onClick={() => handleSetMilkUnit(m.val)}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                  milkUnit === m.val
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                }`}
              >
                {m.val}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-stone-400">Applied in daily lactation yields and dairy records</p>
        </div>
      </div>

      {/* Bio-security Isolation Standard */}
      <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-900 dark:text-teal-200 space-y-1">
          <div className="font-bold">Bio-Security Compliance Standard: 14-Day Automatic Quarantine</div>
          <p className="text-teal-800 dark:text-teal-300">
            When a goat is marked as quarantined, isolation monitoring starts immediately from Day 0, counting up to Day 14 before clear status can be granted.
          </p>
        </div>
      </div>
    </section>
  );

  // Section 5: Data & Backup
  const renderDataBackupSection = () => (
    <section
      id="section-data-backup"
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-2xs space-y-4"
    >
      <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-sky-600" />
          <span>Data Storage &amp; Offline Backup</span>
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Safeguard your herd data with instant offline backups and cache management
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export Full Backup */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 space-y-3">
          <div>
            <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Full JSON Archive</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Download complete database including goats, breeding logs, health records, sales, and accounting.
            </p>
          </div>
          <button
            type="button"
            id="btn-settings-export-backup"
            onClick={handleExportBackup}
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Farm Archive (.json)</span>
          </button>
        </div>

        {/* Clear Temporary Cache */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 space-y-3">
          <div>
            <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-stone-500" />
              <span>Reset Temporary Cache</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Clear dismissed notifications and local query caches without affecting any registered goat records.
            </p>
          </div>
          <button
            type="button"
            id="btn-settings-clear-cache"
            onClick={handleResetCache}
            className="w-full py-2 px-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Local Cache</span>
          </button>
        </div>
      </div>

      {/* PWA Native Installation & Offline Caching Card */}
      <div className="pt-2">
        <PWAInstallButton variant="card" />
      </div>
    </section>
  );

  // Section 6: About Smart Goat Manager
  const renderAboutSection = () => (
    <section
      id="section-about"
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-2xs space-y-4"
    >
      <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-600" />
          <span>About Smart Goat Manager</span>
        </h2>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
          🐐
        </div>
        <div>
          <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Smart Goat Manager Pro
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Version 2.5 (Enterprise Caprine Edition &amp; Installable PWA)
          </div>
          <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
            Progressive Web App with offline service worker, standalone display, and mobile home screen installation.
          </div>
        </div>
      </div>

      <PWAInstallButton variant="card" />
    </section>
  );

  // Master renderer for active section
  const renderActiveSection = (section: SettingsSection) => {
    switch (section) {
      case 'you_and_farm':
        return renderYouAndFarmSection();
      case 'appearance':
        return renderAppearanceSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'units':
        return renderUnitsSection();
      case 'data_backup':
        return renderDataBackupSection();
      case 'about':
        return renderAboutSection();
      default:
        return renderYouAndFarmSection();
    }
  };

  // Filtered navigation items for search
  const filteredNavItems = navItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.label.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
  });

  const activeNavConfig = navItems.find(item => item.id === activeSection) || navItems[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8f9fa] dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors pb-16">
      {/* Inline Slide Animation Style */}
      <style>{`
        @keyframes mobileSlideInRight {
          from {
            transform: translateX(28px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .mobile-settings-slide {
          animation: mobileSlideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* ========================================================= */}
      {/* DESKTOP LAYOUT (≥1024px / lg) - SIDE-BY-SIDE CHROME PATTERN */}
      {/* ========================================================= */}
      <div className="hidden lg:block">
        {/* Desktop Sticky Header Bar */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Settings
              </h1>
            </div>

            <div className="max-w-md w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="input-desktop-search-settings"
                placeholder="Search settings"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-full border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white dark:focus:bg-stone-900 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Side-by-Side Body */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Desktop Left Nav Column */}
            <nav
              aria-label="Settings Categories"
              className="w-full lg:w-72 lg:shrink-0 space-y-1 bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs sticky top-20"
            >
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    id={`btn-desktop-settings-${item.id}`}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border-l-4 border-emerald-600 pl-2.5'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-2 mt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  id="btn-desktop-settings-signout"
                  onClick={() => setShowSignOutConfirm(true)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign out of farm</span>
                </button>
              </div>
            </nav>

            {/* Desktop Right Content Pane */}
            <div className="flex-1 min-w-0 space-y-6">
              {searchQuery ? (
                <>
                  {filteredNavItems.map(item => (
                    <div key={item.id}>
                      {renderActiveSection(item.id)}
                    </div>
                  ))}
                  {filteredNavItems.length === 0 && (
                    <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-500">
                      No settings matched "{searchQuery}"
                    </div>
                  )}
                </>
              ) : (
                renderActiveSection(activeSection)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE DRILL-DOWN LAYOUT (<1024px / lg:hidden)            */}
      {/* Screen 1: Root Nav List ONLY                             */}
      {/* Screen 2: Drilled-in Content ONLY with Back button       */}
      {/* ========================================================= */}
      <div className="lg:hidden">
        {!isMobileDrilledIn ? (
          /* ===================================================== */
          /* MOBILE SCREEN 1: Root Nav List ONLY (Never shows content) */
          /* ===================================================== */
          <div className="px-4 py-4 space-y-4">
            {/* Screen 1 Header with Title & Search */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  Settings
                </h1>
              </div>

              {/* Mobile Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="input-mobile-search-settings"
                  placeholder="Search settings"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-stone-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Account Glance Card (Tapping drills into You & Farm) */}
            <button
              type="button"
              id="btn-mobile-account-glance"
              onClick={() => handleSelectSection('you_and_farm')}
              className={`w-full text-left p-3.5 rounded-2xl bg-white dark:bg-stone-900 border transition-all shadow-2xs active:scale-[0.99] flex items-center justify-between gap-3 ${
                lastVisitedSection === 'you_and_farm'
                  ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                  : 'border-stone-200/90 dark:border-stone-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-base shadow-xs ring-2 ring-emerald-100 dark:ring-emerald-950">
                    {displayOwnerName.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-900"
                    title="Online"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                      {displayOwnerName}
                    </span>
                    {lastVisitedSection === 'you_and_farm' && (
                      <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-md">
                        Last viewed
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    Syncing to {displayEmail}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate mt-0.5">
                    {displayFarmName} • Manage Profile
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
            </button>

            {/* Mobile Categories Group: Preferences */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-1">
                Preferences
              </div>
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 shadow-2xs overflow-hidden">
                {filteredNavItems
                  .filter(item => item.group === 'preferences')
                  .map(item => {
                    const Icon = item.icon;
                    const isLastVisited = lastVisitedSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        id={`btn-mobile-nav-${item.id}`}
                        onClick={() => handleSelectSection(item.id)}
                        className={`w-full flex items-center justify-between p-3.5 text-left transition-colors active:bg-stone-50 dark:active:bg-stone-800/60 ${
                          isLastVisited ? 'bg-emerald-50/30 dark:bg-emerald-950/15' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl ${item.iconBgLight} ${item.iconColorLight} ${item.iconBgDark} ${item.iconColorDark} flex items-center justify-center shrink-0`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                                {item.label}
                              </span>
                              {isLastVisited && (
                                <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-md">
                                  Last viewed
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 shrink-0 ml-2" />
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Mobile Categories Group: System & Storage */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-1">
                Data &amp; System
              </div>
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 shadow-2xs overflow-hidden">
                {filteredNavItems
                  .filter(item => item.group === 'system')
                  .map(item => {
                    const Icon = item.icon;
                    const isLastVisited = lastVisitedSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        id={`btn-mobile-nav-${item.id}`}
                        onClick={() => handleSelectSection(item.id)}
                        className={`w-full flex items-center justify-between p-3.5 text-left transition-colors active:bg-stone-50 dark:active:bg-stone-800/60 ${
                          isLastVisited ? 'bg-emerald-50/30 dark:bg-emerald-950/15' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl ${item.iconBgLight} ${item.iconColorLight} ${item.iconBgDark} ${item.iconColorDark} flex items-center justify-center shrink-0`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                                {item.label}
                              </span>
                              {isLastVisited && (
                                <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-md">
                                  Last viewed
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 shrink-0 ml-2" />
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Mobile PWA Install & Offline Card */}
            <PWAInstallButton variant="card" />

            {/* Mobile Sign Out Button */}
            <div className="pt-1">
              <button
                type="button"
                id="btn-mobile-settings-signout"
                onClick={() => setShowSignOutConfirm(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-left shadow-2xs active:bg-rose-50 dark:active:bg-rose-950/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">Sign out of farm</div>
                    <div className="text-[11px] text-stone-400 dark:text-stone-500">
                      Safely end session on this device
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
              </button>
            </div>
          </div>
        ) : (
          /* ===================================================== */
          /* MOBILE SCREEN 2: Drilled-in Content ONLY with Back bar */
          /* ===================================================== */
          <div className="mobile-settings-slide">
            {/* Screen 2 Top Drill-Down Bar with Back Button */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 py-2.5 flex items-center justify-between">
              <button
                type="button"
                id="btn-mobile-back-to-settings"
                onClick={handleBackToRoot}
                className="inline-flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                <span>Settings</span>
              </button>

              <span className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate max-w-[180px]">
                {activeNavConfig.label}
              </span>

              {/* Spacer for balanced alignment */}
              <div className="w-12" />
            </div>

            {/* Drilled-in Content Pane (Full screen, no nav list below) */}
            <div className="px-4 py-4 space-y-4">
              {renderActiveSection(activeSection)}
            </div>
          </div>
        )}
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowSignOutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Sign out of farm?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  All local changes have been preserved. You can sign back in anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Stay Signed In
              </button>
              <button
                type="button"
                id="btn-confirm-signout"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  handleSignOut();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
