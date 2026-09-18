import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { FarmUser } from '../types';
import {
  Building2,
  MapPin,
  Maximize2,
  Calendar,
  Phone,
  Mail,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Users,
  Milk,
  DollarSign,
  Award,
  X,
  Plus,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface ProfileViewProps {
  onNavigateToRecords?: () => void;
  onNavigateToReports?: () => void;
  onOpenAddModal?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onNavigateToRecords,
  onNavigateToReports,
  onOpenAddModal,
}) => {
  const {
    farmName,
    user,
    goats,
    breeding,
    sales,
    health,
    workers,
    milk,
    daysActive,
    updateFarmProfile,
    syncStatus
  } = useFarm();

  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Form Fields
  const [editFarmName, setEditFarmName] = useState(user?.farm_name || farmName);
  const [editOwnerName, setEditOwnerName] = useState(user?.owner_name || '');
  const [editLocation, setEditLocation] = useState(user?.location || '');
  const [editFarmSize, setEditFarmSize] = useState(user?.farm_size || '');
  const [editPrimaryBreed, setEditPrimaryBreed] = useState(user?.primary_breed || '');
  const [editProductionFocus, setEditProductionFocus] = useState(user?.production_focus || '');
  const [editGrazingSystem, setEditGrazingSystem] = useState(user?.grazing_system || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editFoundedYear, setEditFoundedYear] = useState(user?.founded_year || '');

  // Computed Farm Metrics
  const totalGoats = goats.length;
  const femaleBreedingStock = goats.filter(g => g.gender === 'Female').length;
  const maleSires = goats.filter(g => g.gender === 'Male').length;
  const activeBreeding = breeding.filter(b => b.status === 'Active').length;
  const totalRevenue = sales.reduce((acc, s) => acc + (s.price || 0), 0);
  const totalMilkLiters = milk.reduce((acc, m) => acc + (m.total_liters || 0), 0);
  const totalStaff = workers.length;

  const handleOpenEdit = () => {
    setEditFarmName(user?.farm_name || farmName);
    setEditOwnerName(user?.owner_name || '');
    setEditLocation(user?.location || '');
    setEditFarmSize(user?.farm_size || '');
    setEditPrimaryBreed(user?.primary_breed || '');
    setEditProductionFocus(user?.production_focus || '');
    setEditGrazingSystem(user?.grazing_system || '');
    setEditPhone(user?.phone || '');
    setEditBio(user?.bio || '');
    setEditFoundedYear(user?.founded_year || '');
    setErrorStatus(null);
    setSaveStatus(null);
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFarmName.trim()) {
      setErrorStatus('Farm name is required.');
      return;
    }

    setIsSaving(true);
    setErrorStatus(null);

    const updates: Partial<FarmUser> = {
      farm_name: editFarmName.trim(),
      owner_name: editOwnerName.trim(),
      location: editLocation.trim(),
      farm_size: editFarmSize.trim(),
      primary_breed: editPrimaryBreed.trim(),
      production_focus: editProductionFocus.trim(),
      grazing_system: editGrazingSystem.trim(),
      phone: editPhone.trim(),
      bio: editBio.trim(),
      founded_year: editFoundedYear.trim(),
    };

    const res = await updateFarmProfile(updates);
    setIsSaving(false);

    if (res.success) {
      setSaveStatus('Farm profile updated successfully!');
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus(null);
      }, 1000);
    } else {
      setErrorStatus(res.error || 'Failed to save updates');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="relative bg-gradient-to-r from-emerald-900 via-emerald-800 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-md overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 -mb-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
              🐐
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {user?.production_focus && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    {user.production_focus}
                  </span>
                )}
                {user?.founded_year && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-stone-200 border border-white/15">
                    Est. {user.founded_year}
                  </span>
                )}
                {!user?.production_focus && !user?.founded_year && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-stone-200 border border-white/15">
                    Farm Profile
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {user?.farm_name || farmName}
              </h1>
              <p className="text-emerald-100/80 text-sm mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                {user?.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {user.location}
                  </span>
                )}
                {user?.farm_size && (
                  <span className="inline-flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {user.farm_size}
                  </span>
                )}
                {user?.grazing_system && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {user.grazing_system}
                  </span>
                )}
                {!user?.location && !user?.farm_size && !user?.grazing_system && (
                  <span className="text-emerald-200/70 text-xs italic">
                    Location and operational details not set — click Edit Farm Details to configure
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-edit-farm-profile"
              type="button"
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-950 font-semibold text-sm rounded-xl hover:bg-emerald-50 shadow-sm transition-all"
            >
              <Edit3 className="w-4 h-4 text-emerald-700" />
              <span>Edit Farm Details</span>
            </button>
            {onOpenAddModal && (
              <button
                id="btn-profile-add-record"
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl border border-emerald-600 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Record</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {saveStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Grid: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Farm Identity & Key Properties (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Farm Bio & Overview */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Farm Overview & Operations
            </h2>
            {user?.bio ? (
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                {user.bio}
              </p>
            ) : (
              <p className="text-stone-400 text-sm italic leading-relaxed">
                No farm overview provided yet. Click "Edit Farm Details" to describe your farm.
              </p>
            )}

            <div className="mt-6 pt-5 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Geographic Location
                  </div>
                  <div className="font-semibold text-stone-900">
                    {user?.location || '—'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Farm Acreage / Land Size
                  </div>
                  <div className="font-semibold text-stone-900">
                    {user?.farm_size || '—'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Primary Herd Breeds
                  </div>
                  <div className="font-semibold text-stone-900">
                    {user?.primary_breed || '—'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Established Year
                  </div>
                  <div className="font-semibold text-stone-900">
                    {user?.founded_year ? `Year ${user.founded_year}` : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Farm Leadership & Operational Details */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-emerald-700" />
              Farm Management & Operational Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-xs text-stone-500 font-medium">Farm Owner / Lead Operator</div>
                <div className="text-base font-bold text-stone-900 mt-0.5">
                  {user?.owner_name || '—'}
                </div>
                {user?.owner_name ? (
                  <div className="text-xs text-emerald-700 font-medium mt-1">Farm Owner / Manager</div>
                ) : (
                  <div className="text-xs text-stone-400 italic mt-1">Not specified</div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-xs text-stone-500 font-medium">Production Focus</div>
                <div className="text-sm font-semibold text-stone-900 mt-0.5">
                  {user?.production_focus || '—'}
                </div>
                {user?.production_focus ? (
                  <div className="text-xs text-stone-500 mt-1">Primary farm revenue stream</div>
                ) : (
                  <div className="text-xs text-stone-400 italic mt-1">Not specified</div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-xs text-stone-500 font-medium">Direct Telephone</div>
                <div className="text-sm font-semibold text-stone-900 mt-0.5">
                  {user?.phone || '—'}
                </div>
                {user?.phone ? (
                  <div className="text-xs text-stone-500 mt-1">Direct operations line</div>
                ) : (
                  <div className="text-xs text-stone-400 italic mt-1">Not specified</div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-xs text-stone-500 font-medium">Grazing & Feeding System</div>
                <div className="text-sm font-semibold text-stone-900 mt-0.5">
                  {user?.grazing_system || '—'}
                </div>
                {user?.grazing_system ? (
                  <div className="text-xs text-stone-500 mt-1">Fodder & pasture management</div>
                ) : (
                  <div className="text-xs text-stone-400 italic mt-1">Not specified</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Herd Operational Summary (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                Live Herd Audit
              </h2>
              {onNavigateToRecords && (
                <button
                  type="button"
                  onClick={onNavigateToRecords}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View Herd →
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🐐</span>
                  <span className="text-xs font-semibold text-stone-700">Total Registered Herd</span>
                </div>
                <span className="text-base font-bold text-stone-900">{totalGoats}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🌸</span>
                  <span className="text-xs font-semibold text-stone-700">Breeding Does (Female)</span>
                </div>
                <span className="text-base font-bold text-stone-900">{femaleBreedingStock}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">👑</span>
                  <span className="text-xs font-semibold text-stone-700">Stud Sires (Male Bucks)</span>
                </div>
                <span className="text-base font-bold text-stone-900">{maleSires}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🧬</span>
                  <span className="text-xs font-semibold text-stone-700">Active Gestation Cycles</span>
                </div>
                <span className="text-base font-bold text-stone-900">{activeBreeding}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🥛</span>
                  <span className="text-xs font-semibold text-stone-700">Milk Logged to Date</span>
                </div>
                <span className="text-base font-bold text-stone-900">{totalMilkLiters.toFixed(1)} L</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">💰</span>
                  <span className="text-xs font-semibold text-stone-700">Cumulative Sales Revenue</span>
                </div>
                <span className="text-base font-bold text-emerald-700">
                  Ksh {totalRevenue.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">👷</span>
                  <span className="text-xs font-semibold text-stone-700">Farm Workers / Attendants</span>
                </div>
                <span className="text-base font-bold text-stone-900">{totalStaff}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Management Actions
            </h2>
            {onNavigateToReports && (
              <button
                type="button"
                id="btn-profile-to-reports"
                onClick={onNavigateToReports}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <div>
                    <div className="text-xs font-bold text-stone-900">Download Farm Reports (CSV)</div>
                    <div className="text-[11px] text-stone-500">Export complete farm dossier</div>
                  </div>
                </div>
                <span className="text-xs text-stone-400">→</span>
              </button>
            )}
            <button
              type="button"
              id="btn-profile-edit-direct"
              onClick={handleOpenEdit}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-4 h-4 text-emerald-700" />
                <div>
                  <div className="text-xs font-bold text-stone-900">Update Farm Profile Data</div>
                  <div className="text-[11px] text-stone-500">Edit size, location & breeds</div>
                </div>
              </div>
              <span className="text-xs text-stone-400">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Edit Farm Information</h3>
                <p className="text-xs text-stone-500">Update location, size, and operational details</p>
              </div>
              <button
                id="btn-close-profile-modal"
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorStatus && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorStatus}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Farm Name *
                </label>
                <input
                  id="input-edit-farm-name"
                  type="text"
                  value={editFarmName}
                  onChange={e => setEditFarmName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Owner / Manager Full Name
                  </label>
                  <input
                    id="input-edit-owner-name"
                    type="text"
                    value={editOwnerName}
                    onChange={e => setEditOwnerName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Farm Location (County / Region)
                  </label>
                  <input
                    id="input-edit-location"
                    type="text"
                    placeholder="e.g. Nakuru County, Kenya"
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Farm Size / Acreage
                  </label>
                  <input
                    id="input-edit-size"
                    type="text"
                    placeholder="e.g. 25 Acres or 10 Hectares"
                    value={editFarmSize}
                    onChange={e => setEditFarmSize(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Founded Year
                  </label>
                  <input
                    id="input-edit-founded"
                    type="text"
                    placeholder="e.g. 2021"
                    value={editFoundedYear}
                    onChange={e => setEditFoundedYear(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Primary Goat Breeds
                  </label>
                  <input
                    id="input-edit-breeds"
                    type="text"
                    placeholder="e.g. Boer, Galla, Saanen"
                    value={editPrimaryBreed}
                    onChange={e => setEditPrimaryBreed(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    id="input-edit-phone"
                    type="tel"
                    placeholder="e.g. +254 712 345 678"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Production Focus
                  </label>
                  <input
                    id="input-edit-production-focus"
                    type="text"
                    placeholder="e.g. Dual-Purpose Dairy & Stud Breeding"
                    value={editProductionFocus}
                    onChange={e => setEditProductionFocus(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Grazing & Feeding System
                  </label>
                  <input
                    id="input-edit-grazing-system"
                    type="text"
                    placeholder="e.g. Semi-Intensive Pasture & Paddock Rotation"
                    value={editGrazingSystem}
                    onChange={e => setEditGrazingSystem(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Farm Mission & Bio
                </label>
                <textarea
                  id="input-edit-bio"
                  rows={3}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe your farm's vision, breeding focus, and management practices..."
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  id="btn-cancel-profile-edit"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-semibold rounded-xl hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-farm-profile"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Farm Information'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
