import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Syringe,
  Pill,
  Scissors,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  ArrowRight,
  Sparkles,
  Calendar,
  Check,
  RotateCcw,
  Stethoscope,
  Info
} from 'lucide-react';

export type PendingTaskCategory = 'all' | 'vaccination' | 'deworming' | 'hoof' | 'clinical';
export type TaskUrgency = 'overdue' | 'due_today' | 'upcoming' | 'routine';

export interface PendingTaskItem {
  id: string;
  category: 'vaccination' | 'deworming' | 'hoof' | 'clinical';
  title: string;
  goat_id: string;
  goat_name?: string;
  goat_breed?: string;
  due_date: string;
  days_remaining: number; // negative means overdue
  urgency: TaskUrgency;
  description: string;
  recommended_treatment: string;
  last_record_date?: string;
  related_entity_id?: string;
  is_completed?: boolean;
}

interface PendingTasksSectionProps {
  onNavigateToHealth?: () => void;
  onNavigateToRecords?: () => void;
  onNavigateToBreedingEstimator?: () => void;
  onOpenAddHealthModal?: () => void;
}

export const PendingTasksSection: React.FC<PendingTasksSectionProps> = ({
  onNavigateToHealth,
  onNavigateToRecords,
  onNavigateToBreedingEstimator,
  onOpenAddHealthModal,
}) => {
  const { goats, health, breeding, addHealth } = useFarm();

  const [activeCategory, setActiveCategory] = useState<PendingTaskCategory>('all');
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`sgm_pending_tasks_done_${todayStr}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isLoggingId, setIsLoggingId] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Helper to calculate difference in days
  const getDaysDiff = (targetDateStr: string): number => {
    try {
      const targetDate = new Date(targetDateStr);
      const curr = new Date(todayStr);
      const diffTime = targetDate.getTime() - curr.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Helper to add days to a date string (YYYY-MM-DD)
  const addDaysToDate = (dateStr: string, days: number): string => {
    try {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return todayStr;
    }
  };

  // Derive upcoming schedules based on REAL health records, breeding records, and herd goats
  const generatedTasks: PendingTaskItem[] = useMemo(() => {
    const tasks: PendingTaskItem[] = [];

    // Map goats by tag for quick lookup
    const goatMap = new Map<string, typeof goats[0]>();
    goats.forEach(g => {
      goatMap.set(g.tag_number, g);
    });

    // -------------------------------------------------------------
    // 1. VACCINATION SCHEDULES (Pre-Kidding CD/T & Routine Boosters)
    // -------------------------------------------------------------

    // A. Pre-Kidding CD/T Toxoid Booster for Expectant Does
    // Recommended 4-6 weeks (approx 28-35 days) prior to kidding
    breeding.forEach(b => {
      if (b.status === 'Delivered' || b.status === 'Failed' || !b.expected_birth) return;

      const dueInDays = getDaysDiff(b.expected_birth);
      // If expected birth is within 45 days, CD/T booster should be administered
      // Booster date = expected_birth - 30 days
      const cdtDueDate = addDaysToDate(b.expected_birth, -30);
      const boosterDiff = getDaysDiff(cdtDueDate);

      // Check if doe already received CD/T within the last 60 days
      const recentVaccination = health.find(h =>
        (h.goat_id === b.female_id) &&
        (h.checkup_type === 'Vaccination' || h.treatment.toLowerCase().includes('cd/t') || h.treatment.toLowerCase().includes('cdt') || h.treatment.toLowerCase().includes('vaccin')) &&
        getDaysDiff(h.checkup_date) >= -60
      );

      if (!recentVaccination) {
        let urgency: TaskUrgency = 'upcoming';
        if (boosterDiff < 0) urgency = 'overdue';
        else if (boosterDiff === 0) urgency = 'due_today';
        else if (boosterDiff <= 7) urgency = 'upcoming';
        else urgency = 'routine';

        const doeGoat = goatMap.get(b.female_id);

        tasks.push({
          id: `vac-cdt-doe-${b.female_id}-${b.id}`,
          category: 'vaccination',
          title: `Pre-Kidding CD/T Toxoid Booster: ${b.female_id}`,
          goat_id: b.female_id,
          goat_name: doeGoat?.name,
          goat_breed: doeGoat?.breed,
          due_date: cdtDueDate,
          days_remaining: boosterDiff,
          urgency,
          description: `Administer 2ml subcutaneous CD/T booster 4 weeks before delivery (Expected: ${b.expected_birth}) for maternal antibody transfer in colostrum.`,
          recommended_treatment: 'Clostridium Perfringens C&D + Tetanus Toxoid 2ml SC',
          last_record_date: b.mating_date,
          related_entity_id: b.id,
        });
      }
    });

    // B. Annual / Semi-Annual Vaccine Boosters from existing health records
    const healthVaccinations = health.filter(h =>
      h.checkup_type === 'Vaccination' ||
      h.treatment.toLowerCase().includes('vaccin') ||
      h.treatment.toLowerCase().includes('cd/t') ||
      h.treatment.toLowerCase().includes('ppr') ||
      h.treatment.toLowerCase().includes('ccpp') ||
      h.treatment.toLowerCase().includes('anthrax')
    );

    // Group by goat to find the latest vaccination
    const latestVacByGoat = new Map<string, typeof health[0]>();
    healthVaccinations.forEach(h => {
      const existing = latestVacByGoat.get(h.goat_id);
      if (!existing || new Date(h.checkup_date) > new Date(existing.checkup_date)) {
        latestVacByGoat.set(h.goat_id, h);
      }
    });

    latestVacByGoat.forEach((record, goatId) => {
      // Annual booster due 365 days after previous vaccination
      const nextDue = addDaysToDate(record.checkup_date, 365);
      const diff = getDaysDiff(nextDue);

      // Only surface if due within 30 days or overdue
      if (diff <= 30) {
        let urgency: TaskUrgency = 'routine';
        if (diff < 0) urgency = 'overdue';
        else if (diff === 0) urgency = 'due_today';
        else if (diff <= 14) urgency = 'upcoming';

        const g = goatMap.get(goatId);
        tasks.push({
          id: `vac-booster-${goatId}-${record.id}`,
          category: 'vaccination',
          title: `Annual Clostridial / PPR Booster: ${goatId}`,
          goat_id: goatId,
          goat_name: g?.name,
          goat_breed: g?.breed,
          due_date: nextDue,
          days_remaining: diff,
          urgency,
          description: `Annual vaccination cycle renewal following ${record.treatment} given on ${record.checkup_date}.`,
          recommended_treatment: record.treatment || 'Annual Polyvalent Booster Vaccine 2ml SC',
          last_record_date: record.checkup_date,
          related_entity_id: record.id,
        });
      }
    });

    // C. Default herd vaccination if herd has active goats with no recorded vaccine
    if (tasks.filter(t => t.category === 'vaccination').length === 0 && goats.length > 0) {
      const unvaccinatedGoat = goats.find(g => !healthVaccinations.some(h => h.goat_id === g.tag_number)) || goats[0];
      tasks.push({
        id: `vac-primary-${unvaccinatedGoat.tag_number}`,
        category: 'vaccination',
        title: `Primary CD/T & Clostridial Vaccination: ${unvaccinatedGoat.tag_number}`,
        goat_id: unvaccinatedGoat.tag_number,
        goat_name: unvaccinatedGoat.name,
        goat_breed: unvaccinatedGoat.breed,
        due_date: todayStr,
        days_remaining: 0,
        urgency: 'due_today',
        description: `Primary immunization protocol against enterotoxemia (pulpy kidney) and tetanus for active herd member.`,
        recommended_treatment: 'CD/T Toxoid 2ml Subcutaneous (with 21-day booster follow-up)',
      });
    }

    // -------------------------------------------------------------
    // 2. DEWORMING SCHEDULES (Parasite / FAMACHA / Anthelmintic)
    // -------------------------------------------------------------
    const healthDewormings = health.filter(h =>
      h.checkup_type === 'Deworming' ||
      h.treatment.toLowerCase().includes('deworm') ||
      h.treatment.toLowerCase().includes('albendazole') ||
      h.treatment.toLowerCase().includes('ivermectin') ||
      h.treatment.toLowerCase().includes('levamisole') ||
      h.treatment.toLowerCase().includes('drench') ||
      h.condition.toLowerCase().includes('worm') ||
      h.condition.toLowerCase().includes('parasite')
    );

    const latestDewormByGoat = new Map<string, typeof health[0]>();
    healthDewormings.forEach(h => {
      const existing = latestDewormByGoat.get(h.goat_id);
      if (!existing || new Date(h.checkup_date) > new Date(existing.checkup_date)) {
        latestDewormByGoat.set(h.goat_id, h);
      }
    });

    // Standard goat anthelmintic rotation: 60-90 days interval
    latestDewormByGoat.forEach((record, goatId) => {
      const nextDue = addDaysToDate(record.checkup_date, 75); // 75 days cycle
      const diff = getDaysDiff(nextDue);

      if (diff <= 21) { // surface if due within 3 weeks or overdue
        let urgency: TaskUrgency = 'routine';
        if (diff < 0) urgency = 'overdue';
        else if (diff === 0) urgency = 'due_today';
        else if (diff <= 7) urgency = 'upcoming';

        const g = goatMap.get(goatId);
        tasks.push({
          id: `deworm-cycle-${goatId}-${record.id}`,
          category: 'deworming',
          title: `Quarterly Anthelmintic Deworming: ${goatId}`,
          goat_id: goatId,
          goat_name: g?.name,
          goat_breed: g?.breed,
          due_date: nextDue,
          days_remaining: diff,
          urgency,
          description: `Scheduled 75-day rotational parasite drench following previous treatment on ${record.checkup_date} (${record.treatment}).`,
          recommended_treatment: 'Albendazole 10% Oral Drench (or Ivermectin pour-on rotation)',
          last_record_date: record.checkup_date,
          related_entity_id: record.id,
        });
      }
    });

    // If herd has goats without any deworming record, generate proactive schedule
    const unDewormedGoats = goats.filter(g => (g.status === 'Active' || !g.status) && !latestDewormByGoat.has(g.tag_number));
    if (unDewormedGoats.length > 0) {
      unDewormedGoats.slice(0, 2).forEach(g => {
        tasks.push({
          id: `deworm-routine-${g.tag_number}`,
          category: 'deworming',
          title: `Herd Deworming & FAMACHA Inspection: ${g.tag_number}`,
          goat_id: g.tag_number,
          goat_name: g.name,
          goat_breed: g.breed,
          due_date: todayStr,
          days_remaining: 0,
          urgency: 'due_today',
          description: `Examine eyelid mucous membrane color (FAMACHA score 1-5) and administer weight-calibrated broad-spectrum anthelmintic drench.`,
          recommended_treatment: 'Oral Broad-Spectrum Anthelmintic Drench (calibrated for live weight)',
        });
      });
    }

    // -------------------------------------------------------------
    // 3. HOOF TRIMMING SCHEDULES (Claw / Scald / Foot Rot Prevention)
    // -------------------------------------------------------------
    const healthHoofRecords = health.filter(h =>
      h.treatment.toLowerCase().includes('hoof') ||
      h.treatment.toLowerCase().includes('trim') ||
      h.condition.toLowerCase().includes('hoof') ||
      h.condition.toLowerCase().includes('rot') ||
      h.condition.toLowerCase().includes('scald') ||
      h.condition.toLowerCase().includes('lameness')
    );

    const latestHoofByGoat = new Map<string, typeof health[0]>();
    healthHoofRecords.forEach(h => {
      const existing = latestHoofByGoat.get(h.goat_id);
      if (!existing || new Date(h.checkup_date) > new Date(existing.checkup_date)) {
        latestHoofByGoat.set(h.goat_id, h);
      }
    });

    // Routine caprine hoof trimming is required every 6 to 8 weeks (approx 45 days)
    latestHoofByGoat.forEach((record, goatId) => {
      const nextDue = addDaysToDate(record.checkup_date, 45);
      const diff = getDaysDiff(nextDue);

      if (diff <= 14) {
        let urgency: TaskUrgency = 'routine';
        if (diff < 0) urgency = 'overdue';
        else if (diff === 0) urgency = 'due_today';
        else if (diff <= 5) urgency = 'upcoming';

        const g = goatMap.get(goatId);
        tasks.push({
          id: `hoof-maintenance-${goatId}-${record.id}`,
          category: 'hoof',
          title: `Claw & Hoof Trimming Maintenance: ${goatId}`,
          goat_id: goatId,
          goat_name: g?.name,
          goat_breed: g?.breed,
          due_date: nextDue,
          days_remaining: diff,
          urgency,
          description: `Periodic 6-week claw trimming to balance weight bearing, eliminate overgrown wall pockets, and prevent foot scald.`,
          recommended_treatment: 'Clean hooves, pare overgrown wall flush with sole, spray with copper/zinc sulfate',
          last_record_date: record.checkup_date,
          related_entity_id: record.id,
        });
      }
    });

    // If no recent hoof trim records exist, surface herd hoof inspection schedule
    if (tasks.filter(t => t.category === 'hoof').length === 0 && goats.length > 0) {
      const candidateGoat = goats[0];
      tasks.push({
        id: `hoof-routine-herd-${candidateGoat.tag_number}`,
        category: 'hoof',
        title: `Routine Hoof Trimming & Foot Rot Inspection: ${candidateGoat.tag_number}`,
        goat_id: candidateGoat.tag_number,
        goat_name: candidateGoat.name,
        goat_breed: candidateGoat.breed,
        due_date: todayStr,
        days_remaining: 0,
        urgency: 'due_today',
        description: `Inspect hooves for interdigital dermatitis, pare outer horn flush with sole, and evaluate gait across stalls.`,
        recommended_treatment: 'Biannual/Quarterly Hoof Shears Maintenance & Antiseptic Footbath',
      });
    }

    // -------------------------------------------------------------
    // 4. CLINICAL MEDICAL FOLLOW-UPS (Sick, Recovering, or Critical)
    // -------------------------------------------------------------
    const activeConditions = health.filter(h =>
      h.status === 'Under Treatment' ||
      h.status === 'Critical' ||
      h.status === 'Observation' ||
      h.condition.toLowerCase().includes('sick') ||
      h.condition.toLowerCase().includes('fever') ||
      h.condition.toLowerCase().includes('mastitis') ||
      h.condition.toLowerCase().includes('wound') ||
      h.condition.toLowerCase().includes('pneumonia')
    );

    activeConditions.slice(0, 3).forEach(rec => {
      const g = goatMap.get(rec.goat_id);
      tasks.push({
        id: `clinical-followup-${rec.goat_id}-${rec.id}`,
        category: 'clinical',
        title: `Clinical Medical Follow-Up: ${rec.goat_id}`,
        goat_id: rec.goat_id,
        goat_name: g?.name,
        goat_breed: g?.breed,
        due_date: todayStr,
        days_remaining: 0,
        urgency: rec.status === 'Critical' ? 'overdue' : 'due_today',
        description: `Active clinical diagnosis: "${rec.condition}". Verify response to prescribed therapy (${rec.treatment}) and record vital signs.`,
        recommended_treatment: rec.treatment || 'Check temperature, respiratory rate, and appetite',
        last_record_date: rec.checkup_date,
        related_entity_id: rec.id,
      });
    });

    // Sort by urgency: overdue first, then due today, then upcoming, then routine
    const urgencyOrder: Record<TaskUrgency, number> = {
      overdue: 1,
      due_today: 2,
      upcoming: 3,
      routine: 4,
    };

    tasks.sort((a, b) => {
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return a.days_remaining - b.days_remaining;
    });

    return tasks;
  }, [goats, health, breeding, todayStr]);

  // Handle Mark Done and Record to Realtime Database
  const handleCompleteAndLog = async (task: PendingTaskItem) => {
    setIsLoggingId(task.id);
    setActionFeedback(null);

    try {
      // Map category to checkup_type
      let checkupType: 'Vaccination' | 'Deworming' | 'Routine' = 'Routine';
      if (task.category === 'vaccination') checkupType = 'Vaccination';
      else if (task.category === 'deworming') checkupType = 'Deworming';

      // Record to RTDB via addHealth
      await addHealth({
        goat_id: task.goat_id,
        condition: task.category === 'vaccination'
          ? 'Routine Vaccination Completed'
          : task.category === 'deworming'
          ? 'Anthelmintic Parasite Drench'
          : task.category === 'hoof'
          ? 'Routine Claw & Hoof Trimming'
          : 'Clinical Checkup & Follow-Up Completed',
        treatment: task.recommended_treatment,
        checkup_date: todayStr,
        checkup_type: checkupType,
        status: 'Healthy',
        vet_name: 'Farm Veterinary Care',
      });

      // Mark completed in local state
      const updated = { ...completedTaskIds, [task.id]: true };
      setCompletedTaskIds(updated);
      try {
        localStorage.setItem(`sgm_pending_tasks_done_${todayStr}`, JSON.stringify(updated));
      } catch {
        // ignore
      }

      setActionFeedback(`✅ Completed & saved health record for ${task.goat_id}!`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error recording completed task:', err);
      setActionFeedback(`Failed to save record: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoggingId(null);
    }
  };

  // Toggle quick check without adding new record
  const handleToggleCheck = (taskId: string) => {
    const updated = { ...completedTaskIds, [taskId]: !completedTaskIds[taskId] };
    setCompletedTaskIds(updated);
    try {
      localStorage.setItem(`sgm_pending_tasks_done_${todayStr}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Filter tasks based on active category
  const filteredTasks = useMemo(() => {
    if (activeCategory === 'all') return generatedTasks;
    return generatedTasks.filter(t => t.category === activeCategory);
  }, [generatedTasks, activeCategory]);

  const totalPending = generatedTasks.filter(t => !completedTaskIds[t.id]).length;
  const overdueCount = generatedTasks.filter(t => !completedTaskIds[t.id] && t.urgency === 'overdue').length;
  const vacCount = generatedTasks.filter(t => t.category === 'vaccination' && !completedTaskIds[t.id]).length;
  const dewormCount = generatedTasks.filter(t => t.category === 'deworming' && !completedTaskIds[t.id]).length;
  const hoofCount = generatedTasks.filter(t => t.category === 'hoof' && !completedTaskIds[t.id]).length;
  const clinicalCount = generatedTasks.filter(t => t.category === 'clinical' && !completedTaskIds[t.id]).length;

  return (
    <section id="section-pending-tasks" className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden transition-colors">
      {/* Top Header */}
      <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/70 dark:bg-stone-900/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white tracking-tight">
                  Pending Tasks & Health Schedules
                </h3>
                {overdueCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    {overdueCount} Overdue
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {totalPending} Pending
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Surfacing upcoming vaccination, deworming, and hoof trimming maintenance derived directly from health & breeding records.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenAddHealthModal && (
            <button
              type="button"
              id="btn-pending-tasks-add-health"
              onClick={onOpenAddHealthModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Log Health Checkup</span>
            </button>
          )}
          {onNavigateToHealth && (
            <button
              type="button"
              id="btn-pending-tasks-view-records"
              onClick={onNavigateToHealth}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Health Ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between transition-all">
          <span>{actionFeedback}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="px-5 sm:px-6 py-3 border-b border-stone-100 dark:border-stone-800/60 flex items-center gap-1.5 overflow-x-auto bg-stone-50/40 dark:bg-stone-900/30">
        <button
          type="button"
          id="tab-pending-all"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeCategory === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
          }`}
        >
          <span>All Pending Tasks</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeCategory === 'all' ? 'bg-emerald-800 text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
          }`}>
            {totalPending}
          </span>
        </button>

        <button
          type="button"
          id="tab-pending-vac"
          onClick={() => setActiveCategory('vaccination')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeCategory === 'vaccination'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
          }`}
        >
          <Syringe className="w-3.5 h-3.5" />
          <span>Vaccinations</span>
          {vacCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeCategory === 'vaccination' ? 'bg-purple-800 text-white' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
            }`}>
              {vacCount}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-pending-deworm"
          onClick={() => setActiveCategory('deworming')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeCategory === 'deworming'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Deworming</span>
          {dewormCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeCategory === 'deworming' ? 'bg-amber-800 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
            }`}>
              {dewormCount}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-pending-hoof"
          onClick={() => setActiveCategory('hoof')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeCategory === 'hoof'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Hoof Trimming</span>
          {hoofCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeCategory === 'hoof' ? 'bg-teal-800 text-white' : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
            }`}>
              {hoofCount}
            </span>
          )}
        </button>

        {clinicalCount > 0 && (
          <button
            type="button"
            id="tab-pending-clinical"
            onClick={() => setActiveCategory('clinical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeCategory === 'clinical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Clinical Follow-Up</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeCategory === 'clinical' ? 'bg-rose-800 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
            }`}>
              {clinicalCount}
            </span>
          </button>
        )}
      </div>

      {/* Task Cards List */}
      <div className="p-5 sm:p-6 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-stone-500 dark:text-stone-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              All Tasks Completed & Up to Date!
            </h4>
            <p className="text-xs max-w-md mx-auto leading-relaxed">
              No pending vaccination, deworming, or hoof trimming schedules due for this category. New tasks will be dynamically scheduled based on your health records and gestation cycles.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isDone = !!completedTaskIds[task.id];
            const isLogging = isLoggingId === task.id;

            // Distinct badge icon and styling by category
            let categoryIcon = <Syringe className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
            let categoryBg = 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/80';
            let categoryLabel = 'Vaccination';

            if (task.category === 'deworming') {
              categoryIcon = <Pill className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
              categoryBg = 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/80';
              categoryLabel = 'Deworming';
            } else if (task.category === 'hoof') {
              categoryIcon = <Scissors className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
              categoryBg = 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800/80';
              categoryLabel = 'Hoof Trimming';
            } else if (task.category === 'clinical') {
              categoryIcon = <Stethoscope className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
              categoryBg = 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/80';
              categoryLabel = 'Clinical Care';
            }

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800/60 opacity-60'
                    : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Checkbox button */}
                    <button
                      type="button"
                      onClick={() => handleToggleCheck(task.id)}
                      title={isDone ? 'Mark as pending' : 'Quick mark done'}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-300 dark:border-stone-700 hover:border-emerald-500 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    {/* Icon container */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${categoryBg}`}>
                      {categoryIcon}
                    </div>

                    {/* Main details */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm font-bold leading-tight ${
                          isDone ? 'line-through text-stone-500 dark:text-stone-500' : 'text-stone-900 dark:text-white'
                        }`}>
                          {task.title}
                        </h4>

                        {/* Category tag */}
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          {categoryLabel}
                        </span>

                        {/* Urgency status badge */}
                        {task.urgency === 'overdue' && !isDone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            🔴 Overdue by {Math.abs(task.days_remaining)}d
                          </span>
                        )}
                        {task.urgency === 'due_today' && !isDone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            🟡 Due Today
                          </span>
                        )}
                        {task.urgency === 'upcoming' && !isDone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            📅 Due in {task.days_remaining}d ({task.due_date})
                          </span>
                        )}
                        {task.urgency === 'routine' && !isDone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            🕒 Due: {task.due_date}
                          </span>
                        )}
                        {isDone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            ✅ Completed Today
                          </span>
                        )}
                      </div>

                      {/* Description & Protocol */}
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Recommended: {task.recommended_treatment}
                        </span>
                        {task.goat_breed && (
                          <span>Breed: {task.goat_breed}</span>
                        )}
                        {task.last_record_date && (
                          <span>Last logged: {task.last_record_date}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0 sm:self-center pl-8 sm:pl-0">
                    {!isDone ? (
                      <button
                        type="button"
                        disabled={isLogging}
                        onClick={() => handleCompleteAndLog(task)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        {isLogging ? (
                          <span>Recording...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete & Log Record</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleCheck(task.id)}
                        className="px-2.5 py-1 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Undo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Banner */}
      <div className="px-5 sm:px-6 py-3 border-t border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span>
            Tasks are dynamically evaluated against gestation stages (pre-kidding CD/T 4-6 weeks prior), quarterly parasite cycles (60-75 days), and 6-week claw trims.
          </span>
        </div>
        {onNavigateToBreedingEstimator && (
          <button
            type="button"
            onClick={onNavigateToBreedingEstimator}
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline shrink-0 flex items-center gap-1"
          >
            <span>Breeding Predictor</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </section>
  );
};
