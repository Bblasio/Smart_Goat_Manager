import React, { useState } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './pages/DashboardView';
import { BreedingEstimatorView } from './pages/BreedingEstimatorView';
import { RecordsView } from './pages/RecordsView';
import { HealthCareView } from './pages/HealthCareView';
import { ReportsView } from './pages/ReportsView';
import { ProfileView } from './pages/ProfileView';
import { AuthView } from './pages/AuthView';
import { AddRecordModal } from './components/AddRecordModal';
import { RecordType, AppView } from './types';
import { Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isAuthenticated, authLoading, isDemoMode, farmName, logout } = useFarm();
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<RecordType>('goat');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-sm mb-4 animate-bounce">
          🐐
        </div>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Smart Goat Management</h2>
        <p className="text-sm text-stone-500 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Connecting to Cloud Herd Database...
        </p>
      </div>
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
    <div className="min-h-screen bg-stone-50 text-stone-900 flex">
      {/* Left Navigation Plane */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal('goat')}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area (offset by left sidebar on desktop) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Demo Mode Notice Banner */}
        {isDemoMode && (
          <div className="bg-amber-500/10 border-b border-amber-300 px-4 py-2.5 text-xs font-semibold text-amber-900 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span>Viewing in Demo Mode. Sign in or create an account to save your herd records to the cloud.</span>
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

        {/* Mobile Header Bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-toggle-mobile-sidebar"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🐐</span>
              <span className="font-bold text-stone-900 text-sm">{farmName}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal('goat')}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
          >
            + Add
          </button>
        </header>

        {/* Dynamic Main Views */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToRecords={() => setActiveTab('records')}
              onNavigateToReports={() => setActiveTab('reports')}
              onNavigateToBreedingEstimator={() => setActiveTab('breeding_estimator')}
              onNavigateToHealth={() => setActiveTab('health_vet')}
              onOpenAddModal={() => handleOpenAddModal('goat')}
              onOpenAddHealthModal={() => handleOpenAddModal('health')}
            />
          )}

          {activeTab === 'breeding_estimator' && <BreedingEstimatorView />}

          {activeTab === 'records' && (
            <RecordsView
              onOpenAddModal={handleOpenAddModal}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'health_vet' && (
            <HealthCareView
              onNavigate={setActiveTab}
              onOpenAddModal={() => handleOpenAddModal('health')}
            />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'profile' && (
            <ProfileView
              onNavigateToRecords={() => setActiveTab('records')}
              onNavigateToReports={() => setActiveTab('reports')}
              onOpenAddModal={() => handleOpenAddModal('goat')}
            />
          )}
        </main>

        <footer className="border-t border-stone-200 bg-white py-5 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
            <div>
              Smart Goat Management System • Connected to goat-smart-farm
            </div>
            <div className="text-stone-400">
              Biometric Breeding & Gestation Estimator Active
            </div>
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
    <FarmProvider>
      <MainLayout />
    </FarmProvider>
  );
}
