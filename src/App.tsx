import React, { useState, useEffect } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './pages/DashboardView';
import { BreedingEstimatorView } from './pages/BreedingEstimatorView';
import { RecordsView } from './pages/RecordsView';
import { HealthCareView } from './pages/HealthCareView';
import { ReportsView } from './pages/ReportsView';
import { ProfileView } from './pages/ProfileView';
import { TasksView } from './pages/TasksView';
import { FeedSupplyView } from './pages/FeedSupplyView';
import { AuthView } from './pages/AuthView';
import { AddRecordModal } from './components/AddRecordModal';
import { AppLaunchLoader } from './components/AppLaunchLoader';
import { RecordType, AppView } from './types';
import { Menu, Sparkles, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isAuthenticated, authLoading, isDemoMode, farmName, user, logout } = useFarm();
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingMessage, setNavigatingMessage] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<RecordType>('goat');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [minLaunchTimePassed, setMinLaunchTimePassed] = useState(false);
  const [profilePromptDismissed, setProfilePromptDismissed] = useState(false);

  const isProfileComplete = Boolean(
    user?.farm_name &&
    user?.owner_name &&
    user?.location &&
    user?.phone &&
    user?.primary_breed
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLaunchTimePassed(true);
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  const getTabLabel = (tab: AppView): string => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'tasks':
        return 'Tasks & Schedules';
      case 'feed_supply':
        return 'Feed & Supply';
      case 'breeding_estimator':
        return 'Breeding Estimator';
      case 'records':
        return 'Herd & Farm Records';
      case 'health_vet':
        return 'Veterinary & Health';
      case 'reports':
        return 'Reports & Forecasts';
      case 'profile':
        return 'Farm Profile';
      default:
        return 'Farm Section';
    }
  };

  // Only trigger the lively loader where necessary (e.g. heavy calculations, forecasts)
  const heavyTabs: AppView[] = ['breeding_estimator', 'reports'];

  const handleNavigate = (newTab: AppView) => {
    if (newTab === activeTab) return;
    if (mobileSidebarOpen) setMobileSidebarOpen(false);

    if (heavyTabs.includes(newTab)) {
      setIsNavigating(true);
      setNavigatingMessage(`Loading ${getTabLabel(newTab)}...`);
      setTimeout(() => {
        setActiveTab(newTab);
        setIsNavigating(false);
      }, 260);
    } else {
      setActiveTab(newTab);
    }
  };

  if (authLoading || !minLaunchTimePassed) {
    return (
      <AppLaunchLoader
        logoUrl={user?.logo_url}
        farmName={farmName}
      />
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const handleOpenAddModal = (type: RecordType = 'goat') => {
    setModalDefaultType(type);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex transition-colors duration-200">
      {/* Navigation Loading Animation Overlay */}
      {isNavigating && (
        <AppLaunchLoader
          isNavigation={true}
          statusMessage={navigatingMessage}
          logoUrl={user?.logo_url}
          farmName={farmName}
        />
      )}

      {/* Left Navigation Plane */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onOpenAddModal={() => handleOpenAddModal('goat')}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area (offset by left sidebar on desktop) */}
      <div className="flex-1 lg:pl-64 print:pl-0 flex flex-col min-w-0">
        {/* Demo Mode Notice Banner */}
        {isDemoMode && (
          <div className="no-print bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-800 px-4 py-2.5 text-xs font-semibold text-amber-900 dark:text-amber-300 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span>Viewing in Demo Mode. Sign in or create an account to save your herd records permanently.</span>
            </div>
            <button
              type="button"
              id="btn-demo-banner-signin"
              onClick={logout}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* Profile Incomplete Notification Banner */}
        {!isDemoMode && isAuthenticated && !isProfileComplete && !profilePromptDismissed && activeTab !== 'profile' && (
          <div className="no-print bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/70 dark:via-teal-950/50 dark:to-emerald-950/70 border-b border-emerald-200 dark:border-emerald-800/80 px-4 py-3 text-xs text-emerald-900 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-2xs shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-emerald-950 dark:text-emerald-100 block sm:inline mr-1">
                  Complete Your Farm Profile:
                </span>
                <span className="text-emerald-800 dark:text-emerald-300">
                  Fill in your farm location, contact phone, and primary goat breed to personalize official reports, sales receipts, and medical logs.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-complete-profile-banner"
                onClick={() => handleNavigate('profile')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1"
              >
                <span>Complete Profile</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => setProfilePromptDismissed(true)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                title="Dismiss reminder"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header Bar */}
        <header className="no-print lg:hidden sticky top-0 z-30 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-toggle-mobile-sidebar"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('profile')}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity focus:outline-none"
              title="View & Edit Farm Profile / Logo"
            >
              {user?.logo_url ? (
                <img
                  src={user.logo_url}
                  alt={farmName}
                  className="w-7 h-7 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                />
              ) : (
                <span className="text-xl">🐐</span>
              )}
              <span className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate max-w-[140px]">{farmName}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => handleOpenAddModal('goat')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              + Add
            </button>
          </div>
        </header>

        {/* Dynamic Main Views */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToRecords={() => handleNavigate('records')}
              onNavigateToReports={() => handleNavigate('reports')}
              onNavigateToBreedingEstimator={() => handleNavigate('breeding_estimator')}
              onNavigateToHealth={() => handleNavigate('health_vet')}
              onNavigateToTasks={() => handleNavigate('tasks')}
              onNavigateToFeedSupply={() => handleNavigate('feed_supply')}
              onNavigateToProfile={() => handleNavigate('profile')}
              onOpenAddHealthModal={() => handleOpenAddModal('health')}
              onOpenAddSaleModal={() => handleOpenAddModal('sale')}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              onNavigate={handleNavigate}
              onOpenAddModal={handleOpenAddModal}
            />
          )}

          {activeTab === 'feed_supply' && <FeedSupplyView />}

          {activeTab === 'breeding_estimator' && <BreedingEstimatorView />}

          {activeTab === 'records' && (
            <RecordsView
              onOpenAddModal={handleOpenAddModal}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'health_vet' && (
            <HealthCareView
              onNavigate={handleNavigate}
              onOpenAddModal={() => handleOpenAddModal('health')}
            />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'profile' && (
            <ProfileView
              onNavigateToRecords={() => handleNavigate('records')}
              onNavigateToReports={() => handleNavigate('reports')}
            />
          )}
        </main>

        <footer className="no-print border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-500 dark:text-stone-400">
            All rights reserved {new Date().getFullYear()}
          </div>
        </footer>
      </div>

      {/* Global Add Record Modal */}
      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultType={modalDefaultType}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <FarmProvider>
        <MainLayout />
      </FarmProvider>
    </ThemeProvider>
  );
}

