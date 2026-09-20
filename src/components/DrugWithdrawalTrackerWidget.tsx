import React, { useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { HealthRecord, GoatRecord, MedicationRecord } from '../types';
import {
  Pill,
  Milk,
  AlertTriangle,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Calendar,
  Stethoscope,
  Info,
  ChevronRight,
  Plus
} from 'lucide-react';

interface DrugWithdrawalTrackerWidgetProps {
  onNavigateToHealth?: () => void;
  onOpenAddHealthModal?: () => void;
}

interface ActiveWithdrawalItem {
  id: string;
  goat_tag: string;
  goat_name?: string;
  gender: string;
  breed: string;
  condition: string;
  treatment: string;
  checkup_date: string;
  vet_name?: string;
  isLactatingDoe: boolean;
  // Milk withdrawal details
  milkWithdrawalDays: number;
  milkClearanceDate: Date;
  isMilkActive: boolean;
  milkDaysRemaining: number;
  // Meat withdrawal details
  meatWithdrawalDays: number;
  meatClearanceDate: Date;
  isMeatActive: boolean;
  meatDaysRemaining: number;
}

export const DrugWithdrawalTrackerWidget: React.FC<DrugWithdrawalTrackerWidgetProps> = ({
  onNavigateToHealth,
  onOpenAddHealthModal,
}) => {
  const { health, goats, medications } = useFarm();

  const withdrawalItems = useMemo<ActiveWithdrawalItem[]>(() => {
    const today = new Date();
    const items: ActiveWithdrawalItem[] = [];

    // Filter health records from the last 60 days
    health.forEach(record => {
      const treatmentLower = (record.treatment || '').toLowerCase();
      const conditionLower = (record.condition || '').toLowerCase();

      // Check if treatment involves drugs with withdrawal periods
      const isAntibiotic =
        treatmentLower.includes('antibiotic') ||
        treatmentLower.includes('oxytetracycline') ||
        treatmentLower.includes('penicillin') ||
        treatmentLower.includes('tylosin');
      const isDewormer =
        treatmentLower.includes('deworm') ||
        treatmentLower.includes('albendazole') ||
        treatmentLower.includes('ivermectin') ||
        treatmentLower.includes('levamisole');
      const isNsaid =
        treatmentLower.includes('flunixin') ||
        treatmentLower.includes('meloxicam') ||
        treatmentLower.includes('anti-inflammatory');
      const isUnderTreatment = record.status === 'Under Treatment';

      if (!isAntibiotic && !isDewormer && !isNsaid && !isUnderTreatment) {
        return;
      }

      // Determine matched medication withdrawal period if in inventory
      const matchedMed = medications.find(m =>
        treatmentLower.includes(m.name.toLowerCase().split(' ')[0])
      );

      // Clinical standard caprine withdrawal rules
      let milkDays = 0;
      let meatDays = 0;

      if (isAntibiotic) {
        milkDays = 7; // standard milk discard for systemic antibiotics
        meatDays = matchedMed?.withdrawal_period_days || 28;
      } else if (isDewormer) {
        milkDays = 4; // standard milk discard
        meatDays = matchedMed?.withdrawal_period_days || 14;
      } else if (isNsaid) {
        milkDays = 3;
        meatDays = matchedMed?.withdrawal_period_days || 8;
      } else {
        milkDays = 5;
        meatDays = 14;
      }

      const checkupDate = new Date(record.checkup_date);
      const milkClearance = new Date(checkupDate.getTime() + milkDays * 24 * 60 * 60 * 1000);
      const meatClearance = new Date(checkupDate.getTime() + meatDays * 24 * 60 * 60 * 1000);

      const milkDiffDays = Math.ceil((milkClearance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const meatDiffDays = Math.ceil((meatClearance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const isMilkActive = milkDiffDays > 0;
      const isMeatActive = meatDiffDays > 0;

      // Only show if at least meat or milk withdrawal is currently active or recent (within 30 days)
      if (!isMilkActive && !isMeatActive && meatDiffDays < -30) {
        return;
      }

      // Find goat info
      const goat = goats.find(
        g => g.tag_number.toUpperCase() === record.goat_id.toUpperCase() || g.id === record.goat_id
      );

      const isLactatingDoe = goat?.gender === 'Female' && (goat.status === 'Active' || goat.status === 'Pregnant');

      items.push({
        id: record.id,
        goat_tag: goat?.tag_number || record.goat_id,
        goat_name: goat?.name,
        gender: goat?.gender || 'Unknown',
        breed: goat?.breed || 'Caprine',
        condition: record.condition,
        treatment: record.treatment,
        checkup_date: record.checkup_date,
        vet_name: record.vet_name,
        isLactatingDoe: !!isLactatingDoe,
        milkWithdrawalDays: milkDays,
        milkClearanceDate: milkClearance,
        isMilkActive,
        milkDaysRemaining: Math.max(0, milkDiffDays),
        meatWithdrawalDays: meatDays,
        meatClearanceDate: meatClearance,
        isMeatActive,
        meatDaysRemaining: Math.max(0, meatDiffDays),
      });
    });

    // Sort with active milk warnings first
    return items.sort((a, b) => {
      if (a.isMilkActive && a.isLactatingDoe && (!b.isMilkActive || !b.isLactatingDoe)) return -1;
      if (b.isMilkActive && b.isLactatingDoe && (!a.isMilkActive || !a.isLactatingDoe)) return 1;
      return b.meatDaysRemaining - a.meatDaysRemaining;
    });
  }, [health, goats, medications]);

  // Critical Milk Tank Alert Does
  const milkAlertDoes = useMemo(() => {
    return withdrawalItems.filter(item => item.isMilkActive && item.isLactatingDoe);
  }, [withdrawalItems]);

  const activeMeatCount = useMemo(() => {
    return withdrawalItems.filter(item => item.isMeatActive).length;
  }, [withdrawalItems]);

  return (
    <div
      id="widget-drug-withdrawal"
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs transition-colors"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                Veterinary Drug Withdrawal & Milk/Meat Clearance Tracker
              </h4>
              {milkAlertDoes.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{milkAlertDoes.length} Milk Withheld</span>
                </span>
              ) : activeMeatCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  {activeMeatCount} Meat Withheld
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Zero Residue Clear
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Food safety compliance: mandatory withholding periods for antibiotics, dewormers & pharmaceuticals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddHealthModal && (
            <button
              type="button"
              id="btn-log-treatment-withdrawal"
              onClick={onOpenAddHealthModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Treatment</span>
            </button>
          )}
          {onNavigateToHealth && (
            <button
              type="button"
              id="btn-nav-health-records"
              onClick={onNavigateToHealth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
            >
              <span>Vet Records</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CRITICAL ALERT: MILK BULK TANK CONTAMINATION RISK */}
      {milkAlertDoes.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-3.5 shadow-2xs">
          <div className="p-2 bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 rounded-lg shrink-0 mt-0.5">
            <Milk className="w-5 h-5" />
          </div>
          <div className="text-xs text-rose-950 dark:text-rose-100 space-y-1">
            <div className="font-extrabold text-sm flex items-center gap-2 text-rose-900 dark:text-rose-200">
              <span>⚠️ CRITICAL: DO NOT COMBINE MILK INTO BULK TANK</span>
            </div>
            <p className="text-rose-800 dark:text-rose-300 leading-relaxed text-[11px]">
              Active antibiotic or dewormer residues present in milk from{' '}
              <strong className="underline">
                {milkAlertDoes.map(d => `${d.goat_tag} (${d.goat_name || 'Unnamed'})`).join(', ')}
              </strong>
              . Milk must be discarded or fed strictly to older calves/non-replacement stock until withdrawal expiration.
            </p>
          </div>
        </div>
      )}

      {/* Withdrawal Schedule List */}
      {withdrawalItems.length > 0 ? (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Animal Tag</th>
                  <th className="px-4 py-3">Drug / Treatment</th>
                  <th className="px-4 py-3">Administered</th>
                  <th className="px-4 py-3">Milk Tank Clearance</th>
                  <th className="px-4 py-3">Meat / Slaughter Clearance</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {withdrawalItems.map(item => (
                  <tr
                    key={item.id}
                    id={`withdrawal-row-${item.id}`}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-stone-900 dark:text-white">
                        {item.goat_tag}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {item.goat_name ? `"${item.goat_name}" • ` : ''}{item.breed} ({item.gender})
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="font-semibold text-stone-800 dark:text-stone-200">
                        {item.treatment}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Condition: {item.condition} {item.vet_name ? `• ${item.vet_name}` : ''}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-stone-500">
                      {item.checkup_date}
                    </td>

                    {/* Milk Clearance */}
                    <td className="px-4 py-3.5">
                      {item.gender === 'Female' ? (
                        item.isMilkActive ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{item.milkDaysRemaining}d remaining</span>
                            </span>
                            <div className="text-[10px] text-stone-400 font-mono">
                              Safe on {item.milkClearanceDate.toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Milk Cleared</span>
                          </span>
                        )
                      ) : (
                        <span className="text-stone-400 text-[11px]">N/A (Male)</span>
                      )}
                    </td>

                    {/* Meat Clearance */}
                    <td className="px-4 py-3.5">
                      {item.isMeatActive ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="w-3 h-3" />
                            <span>{item.meatDaysRemaining}d remaining</span>
                          </span>
                          <div className="text-[10px] text-stone-400 font-mono">
                            Safe on {item.meatClearanceDate.toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Meat Cleared</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {item.isMilkActive || item.isMeatActive ? (
                        <span className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-stone-100 dark:bg-stone-800 text-rose-600 dark:text-rose-400">
                          WITHHELD
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-emerald-600 dark:text-emerald-400">
                          CLEARED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Food Safety Regulatory Standard:</strong> Never sell milk or slaughter animals prior to withdrawal expiration. Contaminated bulk milk risks rejection and fines.
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
                All Clear — Zero Active Drug Residuals in Herd Milk or Meat
              </h5>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                No active antibiotic or anthelmintic withholding restrictions. Milk from all lactating does is authorized for human consumption.
              </p>
            </div>
          </div>
          {onOpenAddHealthModal && (
            <button
              type="button"
              onClick={onOpenAddHealthModal}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
            >
              + Log Treatment
            </button>
          )}
        </div>
      )}
    </div>
  );
};
