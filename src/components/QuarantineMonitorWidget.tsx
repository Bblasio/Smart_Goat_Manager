import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { GoatRecord } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  Plus,
  X,
  Stethoscope,
  Info
} from 'lucide-react';
import { createQuarantineBiosecurityTasks } from '../utils/taskHelper';

interface QuarantineMonitorWidgetProps {
  onNavigateToTasks?: () => void;
  onNavigateToHealth?: () => void;
  onNavigateToRecords?: () => void;
}

export const QuarantineMonitorWidget: React.FC<QuarantineMonitorWidgetProps> = ({
  onNavigateToTasks,
  onNavigateToHealth,
  onNavigateToRecords,
}) => {
  const { goats, health, updateGoat, farmName } = useFarm();

  const [isIsolateModalOpen, setIsIsolateModalOpen] = useState(false);
  const [selectedGoatId, setSelectedGoatId] = useState('');
  const [isolationReason, setIsolationReason] = useState('New incoming livestock arrival protocol');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Find goats in quarantine
  const quarantinedGoats = useMemo(() => {
    return goats.filter(g => g.status === 'Quarantine');
  }, [goats]);

  // Active goats available for isolation
  const activeGoats = useMemo(() => {
    return goats.filter(g => g.status === 'Active');
  }, [goats]);

  // Helper to calculate days in quarantine
  const getQuarantineDetails = (goat: GoatRecord) => {
    // Look for health records or status changes
    const goatHealth = health
      .filter(h => h.goat_id.toUpperCase() === goat.tag_number.toUpperCase() || h.goat_id === goat.id)
      .sort((a, b) => new Date(b.checkup_date).getTime() - new Date(a.checkup_date).getTime());
    
    const latestHealth = goatHealth[0];
    const today = new Date();
    
    // Accurate quarantine start date:
    // 1. Explicit quarantine_start_date property on goat
    // 2. Or latest quarantine/isolation health checkup date within the last 14 days
    // 3. Default to today (never fall back to goat.created_at, which refers to registration date!)
    let startDate: Date;
    if (goat.quarantine_start_date) {
      const parsed = new Date(goat.quarantine_start_date);
      startDate = isNaN(parsed.getTime()) ? today : parsed;
    } else if (latestHealth?.checkup_date) {
      const parsed = new Date(latestHealth.checkup_date);
      startDate = isNaN(parsed.getTime()) ? today : parsed;
    } else {
      startDate = today;
    }

    // Calculate calendar days between start date and today
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = todayMidnight.getTime() - startMidnight.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    // Quarantine starts counting immediately from Day 1 on the day of isolation
    const currentDay = Math.min(14, diffDays + 1);
    const daysRemaining = Math.max(0, 14 - currentDay);
    const progressPercent = Math.min(100, Math.round((currentDay / 14) * 100));

    const day7Passed = currentDay >= 7;
    const isReadyForRelease = diffDays >= 13; // Completed full 14-day protocol

    return {
      currentDay,
      daysElapsed: diffDays,
      daysRemaining,
      progressPercent,
      day7Passed,
      isReadyForRelease,
      latestHealthCondition: latestHealth?.condition || 'Under Bio-Security Quarantine',
      latestTreatment: latestHealth?.treatment || 'Daily rectal temp & symptom isolation',
    };
  };

  const handleReleaseToHerd = async (goat: GoatRecord) => {
    const confirmRelease = window.confirm(
      `Confirm Bio-Security Clearance for ${goat.tag_number} (${goat.name || 'Unnamed'})?\n\nThis will re-integrate the goat into the Active herd.`
    );
    if (!confirmRelease) return;

    try {
      await updateGoat(goat.id, { status: 'Active' });
      setActionSuccessMsg(`${goat.tag_number} cleared and re-integrated into General Herd!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to release goat from quarantine', err);
    }
  };

  const handleIsolateGoatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoatId) return;

    const targetGoat = goats.find(g => g.id === selectedGoatId);
    if (!targetGoat) return;

    try {
      const nowIso = new Date().toISOString();
      await updateGoat(targetGoat.id, { 
        status: 'Quarantine',
        quarantine_start_date: nowIso
      });
      // Schedule Day 7 and Day 14 tasks from today
      createQuarantineBiosecurityTasks(targetGoat, nowIso.split('T')[0]);
      
      setActionSuccessMsg(`${targetGoat.tag_number} isolated. Day 1 of 14 biosecurity protocol initiated.`);
      setIsIsolateModalOpen(false);
      setSelectedGoatId('');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to isolate goat', err);
    }
  };

  return (
    <div
      id="widget-quarantine-monitor"
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs transition-colors"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                Biosecurity & Active Quarantine Monitor
              </h4>
              {quarantinedGoats.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 animate-pulse">
                  {quarantinedGoats.length} in Isolation
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Herd Clear
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Mandatory 14-day isolation protocol for disease prevention & new arrivals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToTasks && (
            <button
              type="button"
              id="btn-quarantine-tasks"
              onClick={onNavigateToTasks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
            >
              <span>Quarantine Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            id="btn-open-isolate-modal"
            onClick={() => setIsIsolateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Isolate Animal</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Content */}
      {quarantinedGoats.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quarantinedGoats.map(goat => {
              const details = getQuarantineDetails(goat);

              return (
                <div
                  key={goat.id}
                  id={`quarantine-card-${goat.id}`}
                  className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 flex items-center justify-center font-bold text-xs">
                        {goat.gender === 'Male' ? '♂' : '♀'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-stone-900 dark:text-white text-sm">
                            {goat.tag_number}
                          </span>
                          {goat.name && (
                            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                              "{goat.name}"
                            </span>
                          )}
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                            {goat.breed}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {details.latestHealthCondition}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-extrabold font-mono ${
                        details.isReadyForRelease
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300'
                      }`}
                    >
                      {details.isReadyForRelease ? 'Clearance Due' : `Day ${details.currentDay} of 14`}
                    </span>
                  </div>

                  {/* 14-Day Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                      <span>Quarantine Progress</span>
                      <span>{details.progressPercent}% ({details.daysRemaining} days left)</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          details.isReadyForRelease
                            ? 'bg-emerald-500'
                            : details.day7Passed
                            ? 'bg-amber-500'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${details.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones and Clinical Checkpoints */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div
                      className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                        details.day7Passed
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-medium'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Day 7 Mid-Review: {details.day7Passed ? 'Passed' : 'Pending'}</span>
                    </div>

                    <div
                      className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                        details.isReadyForRelease
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-medium'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Day 14 Release: {details.isReadyForRelease ? 'Authorized' : `${details.daysRemaining}d wait`}</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      Pen: Isolation Bay A
                    </span>
                    <button
                      type="button"
                      id={`btn-release-${goat.id}`}
                      onClick={() => handleReleaseToHerd(goat)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Clear into General Herd</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Biosecurity Protocol:</strong> Isolate any new herd additions for 14 continuous days. Disinfect footwear before and after entering the isolation stall.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                0 Animals in Isolation — General Herd Bio-Security Clear
              </h5>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                All herd livestock are currently authorized in general paddocks. No contagious respiratory or parasitic isolation active.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-isolate-quick"
            onClick={() => setIsIsolateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
          >
            + Isolate New Stock
          </button>
        </div>
      )}

      {/* Modal: Isolate Animal */}
      {isIsolateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 dark:text-white text-base">
                  Isolate Animal (Quarantine Pen)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIsolateModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIsolateGoatSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Select Active Goat to Isolate *
                </label>
                <select
                  required
                  value={selectedGoatId}
                  onChange={e => setSelectedGoatId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm"
                >
                  <option value="">-- Choose Goat by Ear Tag --</option>
                  {activeGoats.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.tag_number} - {g.name || 'Unnamed'} ({g.breed}, {g.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Reason for Isolation / Symptoms
                </label>
                <input
                  type="text"
                  value={isolationReason}
                  onChange={e => setIsolationReason(e.target.value)}
                  placeholder="e.g. New market purchase, nasal discharge, fever"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Automatic 14-Day Protocol</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Moving this goat will automatically schedule a Day 7 clinical review task and a Day 14 herd release authorization in your Tasks Hub.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsIsolateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedGoatId}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Move to Quarantine Pen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
