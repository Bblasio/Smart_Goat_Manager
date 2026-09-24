import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Calendar,
  Filter,
  Plus,
  Search,
  RotateCcw,
  Sparkles,
  Baby,
  Stethoscope,
  Syringe,
  Pill,
  Scissors,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  BadgeAlert,
  Check,
  Tag
} from 'lucide-react';
import { AppView } from '../types';
import { suggestTaskTagAndCategory, GoatTaskSuggestion, createQuarantineBiosecurityTasks } from '../utils/taskHelper';

export type TaskTab = 'pending' | 'done' | 'important_history';
export type TaskCategory = 'all' | 'vaccination' | 'deworming' | 'breeding' | 'medical' | 'hoof' | 'farm_record';
export type TaskUrgency = 'overdue' | 'due_today' | 'upcoming' | 'routine';

export interface FarmTaskItem {
  id: string;
  title: string;
  goat_id?: string;
  goat_name?: string;
  tag?: 'Health Check' | 'Gestation' | string;
  category: 'vaccination' | 'deworming' | 'breeding' | 'medical' | 'hoof' | 'farm_record';
  due_date: string;
  days_remaining: number;
  urgency: TaskUrgency;
  description: string;
  is_important: boolean;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

interface TasksViewProps {
  onNavigate?: (view: AppView) => void;
  onOpenAddModal?: (type?: any) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onNavigate, onOpenAddModal }) => {
  const { goats, health, breeding, sales, farmName } = useFarm();

  const [activeTab, setActiveTab] = useState<TaskTab>('pending');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // New Custom Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newGoatId, setNewGoatId] = useState('');
  const [newTag, setNewTag] = useState<'Health Check' | 'Gestation' | ''>('');
  const [taskSuggestion, setTaskSuggestion] = useState<GoatTaskSuggestion | null>(null);
  const [newCategory, setNewCategory] = useState<FarmTaskItem['category']>('farm_record');
  const [newDueDate, setNewDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newDescription, setNewDescription] = useState('');
  const [newIsImportant, setNewIsImportant] = useState(true);

  // Handle changing goat ID with automatic tag and category suggestion
  const handleGoatIdChange = (val: string) => {
    setNewGoatId(val);
    const suggestion = suggestTaskTagAndCategory(val, goats, breeding, health);
    setTaskSuggestion(suggestion);
    if (suggestion) {
      if (suggestion.suggestedTag) {
        setNewTag(suggestion.suggestedTag);
      }
      if (!newTitle.trim() || newTitle.startsWith('Health') || newTitle.startsWith('Gestation') || newTitle.startsWith('Follow-up')) {
        setNewTitle(suggestion.suggestedTitle);
      }
      if (newCategory === 'farm_record') {
        setNewCategory(suggestion.suggestedCategory);
      }
    }
  };

  const applySuggestion = (suggestion: GoatTaskSuggestion) => {
    if (suggestion.suggestedTag) setNewTag(suggestion.suggestedTag);
    setNewCategory(suggestion.suggestedCategory);
    setNewTitle(suggestion.suggestedTitle);
  };

  // Completed status state synced with localStorage
  const [completedTaskMap, setCompletedTaskMap] = useState<Record<string, { completed_at: string }>>(() => {
    try {
      const saved = localStorage.getItem('sgm_farm_tasks_completed_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // User-created custom tasks
  const [customTasks, setCustomTasks] = useState<FarmTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('sgm_farm_custom_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

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

  const addDaysToDate = (dateStr: string, days: number): string => {
    try {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return todayStr;
    }
  };

  // Derive system tasks from real herd, health, and breeding data
  const systemGeneratedTasks = useMemo(() => {
    const list: FarmTaskItem[] = [];
    const goatMap = new Map<string, typeof goats[0]>();
    goats.forEach(g => goatMap.set(g.tag_number, g));

    // 1. CD/T Booster Vaccine for Expectant Does (Vital gestation task - only within 35 days of birth)
    breeding.forEach(b => {
      if (b.status === 'Delivered' || b.status === 'Failed' || !b.expected_birth) return;
      const dueInDays = getDaysDiff(b.expected_birth);
      // Realistic caprine protocol: only trigger when doe is in late gestation (within 35 days of delivery)
      if (dueInDays > 35 || dueInDays < -10) return;

      const cdtDueDate = addDaysToDate(b.expected_birth, -30);
      const diff = getDaysDiff(cdtDueDate);

      const hasRecentVaccine = health.some(
        h =>
          h.goat_id === b.female_id &&
          (h.checkup_type === 'Vaccination' || h.treatment.toLowerCase().includes('cd/t') || h.treatment.toLowerCase().includes('cdt')) &&
          getDaysDiff(h.checkup_date) >= -60
      );

      if (!hasRecentVaccine) {
        let urgency: TaskUrgency = 'upcoming';
        if (diff < 0) urgency = 'overdue';
        else if (diff === 0) urgency = 'due_today';
        else if (diff <= 7) urgency = 'upcoming';
        else urgency = 'routine';

        list.push({
          id: `task-cdt-${b.female_id}-${b.id}`,
          title: `Administer Pre-Kidding CD/T Booster (${b.female_id})`,
          goat_id: b.female_id,
          goat_name: goatMap.get(b.female_id)?.name,
          tag: 'Gestation',
          category: 'vaccination',
          due_date: cdtDueDate,
          days_remaining: diff,
          urgency,
          description: `Boost colostrum maternal antibodies before kidding date ${b.expected_birth}. Clostridium perfringens C&D + Tetanus.`,
          is_important: true,
          is_completed: !!completedTaskMap[`task-cdt-${b.female_id}-${b.id}`],
          completed_at: completedTaskMap[`task-cdt-${b.female_id}-${b.id}`]?.completed_at,
          created_at: b.mating_date || todayStr,
        });
      }
    });

    // 2. Kidding Stall Preparation & Maternity Care (Vital gestation task - only within 7 days of birth)
    breeding.forEach(b => {
      if (b.status === 'Delivered' || b.status === 'Failed' || !b.expected_birth) return;
      const dueInDays = getDaysDiff(b.expected_birth);
      // Only trigger if expected kidding is within 7 days
      if (dueInDays > 7 || dueInDays < -3) return;

      const prepDueDate = addDaysToDate(b.expected_birth, -5);
      const diff = getDaysDiff(prepDueDate);

      let urgency: TaskUrgency = 'upcoming';
      if (diff < 0) urgency = 'overdue';
      else if (diff === 0) urgency = 'due_today';
      else if (diff <= 3) urgency = 'upcoming';
      else urgency = 'routine';

      list.push({
        id: `task-maternity-prep-${b.female_id}-${b.id}`,
        title: `Prepare Clean Maternity Pen for Doe ${b.female_id}`,
        goat_id: b.female_id,
        goat_name: goatMap.get(b.female_id)?.name,
        tag: 'Gestation',
        category: 'breeding',
        due_date: prepDueDate,
        days_remaining: diff,
        urgency,
        description: `Disinfect kidding stall with lime, lay clean dry straw, verify heat lamps, iodine 7% navel dip, and clean towels. Expected kidding: ${b.expected_birth}.`,
        is_important: true,
        is_completed: !!completedTaskMap[`task-maternity-prep-${b.female_id}-${b.id}`],
        completed_at: completedTaskMap[`task-maternity-prep-${b.female_id}-${b.id}`]?.completed_at,
        created_at: b.mating_date || todayStr,
      });
    });

    // 3. Clinical follow-up for Sick / Quarantined Goats (Vital health task)
    goats.forEach(g => {
      if (g.status === 'Quarantine') {
        const diff = 0;
        list.push({
          id: `task-quarantine-eval-${g.tag_number}`,
          title: `Daily Quarantine Protocol & Health Check: ${g.tag_number}`,
          goat_id: g.tag_number,
          goat_name: g.name,
          tag: 'Health Check',
          category: 'medical',
          due_date: todayStr,
          days_remaining: 0,
          urgency: 'due_today',
          description: `Monitor vitals (temperature 38.5-39.7°C, rumen motility, appetite). Ensure strict biosecurity separation from main herd.`,
          is_important: true,
          is_completed: !!completedTaskMap[`task-quarantine-eval-${g.tag_number}`],
          completed_at: completedTaskMap[`task-quarantine-eval-${g.tag_number}`]?.completed_at,
          created_at: g.dob || g.created_at || todayStr,
        });
      }
    });

    // 4. Follow-up on Health Records made by the farm owner (Under Treatment or Critical)
    // Strictly limited to active clinical cases logged within the last 14 days
    health.forEach(h => {
      const cond = (h.condition || '').toLowerCase();
      const isCriticalOrTreating = h.status === 'Critical' || h.status === 'Under Treatment';
      const hasActiveIllness = cond.includes('sick') || cond.includes('mastitis') || cond.includes('foot rot') || cond.includes('fever') || cond.includes('wound');

      if (isCriticalOrTreating || hasActiveIllness) {
        const daysSinceCheckup = -getDaysDiff(h.checkup_date);
        // Only surface recent active clinical logs (within last 14 days)
        if (daysSinceCheckup >= 0 && daysSinceCheckup <= 14) {
          const nextCheckDate = addDaysToDate(h.checkup_date, 5);
          const diff = getDaysDiff(nextCheckDate);

          let urgency: TaskUrgency = 'upcoming';
          if (diff < 0) urgency = 'overdue';
          else if (diff === 0) urgency = 'due_today';
          else urgency = 'upcoming';

          list.push({
            id: `task-health-followup-${h.id}`,
            title: `Follow-up Clinical Check: ${h.goat_id} (${h.condition || 'Under Treatment'})`,
            goat_id: h.goat_id,
            tag: 'Health Check',
            category: 'medical',
            due_date: nextCheckDate,
            days_remaining: diff,
            urgency,
            description: `Follow up on owner-logged treatment: "${h.treatment}". Monitor recovery progress and animal well-being.`,
            is_important: true,
            is_completed: !!completedTaskMap[`task-health-followup-${h.id}`],
            completed_at: completedTaskMap[`task-health-followup-${h.id}`]?.completed_at,
            created_at: h.checkup_date,
          });
        }
      }
    });

    // 5. Automated Biosecurity Quarantine Timers (7-Day Intermediate & 14-Day Clearance)
    // Automatically schedules midway checkup and clearance evaluation for any goat in quarantine
    goats.filter(g => g.status === 'Quarantine').forEach(qGoat => {
      const qStartStr = qGoat.quarantine_start_date ? qGoat.quarantine_start_date.split('T')[0] : todayStr;
      const qTasks = createQuarantineBiosecurityTasks(qGoat, qStartStr);
      qTasks.forEach(qt => {
        const diff = getDaysDiff(qt.due_date);
        let urgency: TaskUrgency = 'upcoming';
        if (diff < 0) urgency = 'overdue';
        else if (diff === 0) urgency = 'due_today';
        else if (diff <= 7) urgency = 'upcoming';
        else urgency = 'routine';

        list.push({
          id: qt.id,
          title: qt.title,
          goat_id: qt.goat_id,
          goat_name: qt.goat_name,
          tag: qt.tag,
          category: qt.category,
          due_date: qt.due_date,
          days_remaining: diff,
          urgency,
          description: qt.description,
          is_important: qt.is_important,
          is_completed: !!completedTaskMap[qt.id],
          completed_at: completedTaskMap[qt.id]?.completed_at,
          created_at: todayStr,
        });
      });
    });

    return list;
  }, [goats, health, breeding, completedTaskMap, todayStr]);

  // Combine system tasks with custom farm tasks
  const allTasks: FarmTaskItem[] = useMemo(() => {
    const combined = [...systemGeneratedTasks, ...customTasks];
    return combined.map(t => ({
      ...t,
      is_completed: !!completedTaskMap[t.id],
      completed_at: completedTaskMap[t.id]?.completed_at || t.completed_at,
    }));
  }, [systemGeneratedTasks, customTasks, completedTaskMap]);

  // Handler to toggle task completion
  const handleToggleTask = (taskId: string) => {
    setCompletedTaskMap(prev => {
      const updated = { ...prev };
      if (updated[taskId]) {
        delete updated[taskId];
      } else {
        updated[taskId] = { completed_at: new Date().toISOString() };
      }
      try {
        localStorage.setItem('sgm_farm_tasks_completed_map', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save task completion to localStorage', err);
      }
      return updated;
    });
  };

  // Handler to create a new farm task
  const handleCreateCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const diff = getDaysDiff(newDueDate);
    let urgency: TaskUrgency = 'upcoming';
    if (diff < 0) urgency = 'overdue';
    else if (diff === 0) urgency = 'due_today';
    else if (diff <= 7) urgency = 'upcoming';
    else urgency = 'routine';

    const newTask: FarmTaskItem = {
      id: `task-custom-${Date.now()}`,
      title: newTitle.trim(),
      goat_id: newGoatId.trim() || undefined,
      tag: newTag || undefined,
      category: newCategory,
      due_date: newDueDate,
      days_remaining: diff,
      urgency,
      description: newDescription.trim() || 'Custom farm task recorded by manager.',
      is_important: newIsImportant,
      is_completed: false,
      created_at: todayStr,
    };

    const updatedTasks = [newTask, ...customTasks];
    setCustomTasks(updatedTasks);
    try {
      localStorage.setItem('sgm_farm_custom_tasks', JSON.stringify(updatedTasks));
    } catch (err) {
      console.warn('Failed to save custom task', err);
    }

    setNewTitle('');
    setNewGoatId('');
    setNewTag('');
    setTaskSuggestion(null);
    setNewDescription('');
    setShowAddTaskModal(false);
  };

  // Important History records: Farm records (Vital medical, breeding deliveries, herd registry milestones)
  const importantHistoryRecords = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      date: string;
      type: 'health' | 'breeding' | 'sale' | 'task_done';
      badge: string;
      goat_id?: string;
      description: string;
      importance: 'high' | 'critical';
    }> = [];

    // 1. Completed Vital Tasks
    allTasks
      .filter(t => t.is_completed && t.is_important)
      .forEach(t => {
        list.push({
          id: `hist-task-${t.id}`,
          title: `Task Completed: ${t.title}`,
          date: t.completed_at ? t.completed_at.split('T')[0] : t.due_date,
          type: 'task_done',
          badge: 'Completed Task',
          goat_id: t.goat_id,
          description: t.description,
          importance: 'high',
        });
      });

    // 2. Urgent / Critical Health Interventions (Only genuine critical cases or active owner logs, never mass uploaded routine vaccines)
    health
      .filter(h => h.status === 'Critical' || (h.status === 'Under Treatment' && (h.condition?.toLowerCase().includes('mastitis') || h.condition?.toLowerCase().includes('rot') || h.condition?.toLowerCase().includes('fracture'))))
      .slice(0, 15)
      .forEach(h => {
        list.push({
          id: `hist-health-${h.id}`,
          title: `Urgent Medical Intervention: ${h.goat_id} (${h.condition || 'Critical Care'})`,
          date: h.checkup_date,
          type: 'health',
          badge: h.status || 'Critical Health',
          goat_id: h.goat_id,
          description: `Condition: ${h.condition || 'Critical'}. Treatment: ${h.treatment || 'Intensive care'} by ${h.vet_name || 'Veterinarian'}.`,
          importance: 'critical',
        });
      });

    // 3. Vital Breeding Deliveries & Kidding Records (Capped to recent entries)
    breeding
      .filter(b => b.status === 'Delivered' || b.actual_birth_date)
      .slice(0, 15)
      .forEach(b => {
        list.push({
          id: `hist-breeding-${b.id}`,
          title: `Kidding Delivery Recorded: Doe ${b.female_id}`,
          date: b.actual_birth_date || b.expected_birth || todayStr,
          type: 'breeding',
          badge: 'Kidding Delivered',
          goat_id: b.female_id,
          description: `Successful kidding delivered with Sire ${b.male_id}. Registered in official farm breeding registry.`,
          importance: 'critical',
        });
      });

    // 4. Important Herd Sales / Transfers (Capped to recent entries)
    sales
      .slice(0, 15)
      .forEach(s => {
        list.push({
          id: `hist-sale-${s.id}`,
          title: `Livestock Sale Finalized: Goat ${s.goat_id}`,
          date: s.sale_date || todayStr,
          type: 'sale',
          badge: 'Herd Sale',
          goat_id: s.goat_id,
          description: `Sold to ${s.buyer_name || 'External Buyer'} for Ksh ${s.price.toLocaleString()}. Status updated to Sold.`,
          importance: 'high',
        });
      });

    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTasks, health, breeding, sales, todayStr]);

  // Filter pending tasks
  const pendingTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (t.is_completed) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchGoat = t.goat_id?.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        return matchTitle || matchGoat || matchDesc;
      }
      return true;
    });
  }, [allTasks, selectedCategory, searchQuery]);

  // Filter done tasks
  const doneTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (!t.is_completed) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchGoat = t.goat_id?.toLowerCase().includes(q);
        return matchTitle || matchGoat;
      }
      return true;
    });
  }, [allTasks, selectedCategory, searchQuery]);

  // Filter important history
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return importantHistoryRecords;
    const q = searchQuery.toLowerCase();
    return importantHistoryRecords.filter(
      h =>
        h.title.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.goat_id?.toLowerCase().includes(q)
    );
  }, [importantHistoryRecords, searchQuery]);

  const pendingCount = allTasks.filter(t => !t.is_completed).length;
  const overdueCount = allTasks.filter(t => !t.is_completed && t.urgency === 'overdue').length;
  const doneCount = allTasks.filter(t => t.is_completed).length;
  const importantHistoryCount = importantHistoryRecords.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700 shadow-sm bg-stone-100 dark:bg-stone-800">
              <img
                src="/images/nav/tasks.jpg"
                alt="Tasks & Operations"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 mb-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Farm Operations & Task Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                Tasks &amp; Important Farm Records
              </h1>
              <p className="text-stone-500 dark:text-stone-400 text-sm mt-1 max-w-2xl">
                Track pending livestock management tasks, log completed health actions, and review the chronological history of vital farm records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-create-task-modal"
              onClick={() => setShowAddTaskModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Farm Task</span>
            </button>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-100 dark:border-stone-800">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
            <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Pending Tasks
            </div>
            <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">
              {pendingCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/60">
            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Overdue
            </div>
            <div className="text-2xl font-black text-rose-800 dark:text-rose-300 mt-0.5">
              {overdueCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Completed (Done)
            </div>
            <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-0.5">
              {doneCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60">
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Important Records
            </div>
            <div className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-0.5">
              {importantHistoryCount}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs transition-colors space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              id="tab-tasks-pending"
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending Tasks</span>
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono ${activeTab === 'pending' ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              id="tab-tasks-done"
              onClick={() => setActiveTab('done')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'done'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done</span>
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono ${activeTab === 'done' ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                {doneCount}
              </span>
            </button>

            <button
              type="button"
              id="tab-tasks-history"
              onClick={() => setActiveTab('important_history')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'important_history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Important History (Farm Records)</span>
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono ${activeTab === 'important_history' ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                {importantHistoryCount}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by tag, task, or record..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Filters for Pending & Done */}
        {activeTab !== 'important_history' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-400 font-semibold shrink-0">Filter:</span>
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'vaccination', label: 'Vaccinations' },
              { id: 'deworming', label: 'Deworming' },
              { id: 'breeding', label: 'Breeding & Maternity' },
              { id: 'medical', label: 'Clinical Medical' },
              { id: 'farm_record', label: 'Farm Records' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as TaskCategory)}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* TAB 1: PENDING TASKS */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  All Pending Tasks Up to Date!
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                  There are no overdue or pending livestock tasks for this category. You can add custom reminders or log new farm records anytime.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-500"
                >
                  + Add New Task
                </button>
              </div>
            ) : (
              pendingTasks.map(task => {
                const isOverdue = task.urgency === 'overdue';
                const isDueToday = task.urgency === 'due_today';

                return (
                  <div
                    key={task.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isOverdue
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/70'
                        : isDueToday
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/70'
                        : 'bg-stone-50/60 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        id={`btn-complete-task-${task.id}`}
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5 w-6 h-6 rounded-lg border-2 border-stone-300 dark:border-stone-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-center transition-colors shrink-0"
                        title="Mark task as done"
                      >
                        <Check className="w-3.5 h-3.5 text-transparent hover:text-emerald-600" />
                      </button>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">
                            {task.title}
                          </span>

                          {task.is_important && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                              ⭐ Important Farm Task
                            </span>
                          )}

                          {task.tag === 'Gestation' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300/60 dark:border-purple-800 flex items-center gap-1">
                              <span>🤰</span>
                              <span>Gestation</span>
                            </span>
                          )}

                          {task.tag === 'Health Check' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800 flex items-center gap-1">
                              <span>🩺</span>
                              <span>Health Check</span>
                            </span>
                          )}

                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                              Overdue by {Math.abs(task.days_remaining)}d
                            </span>
                          )}

                          {isDueToday && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              Due Today
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                          {task.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400 pt-1">
                          {task.goat_id && (
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                              🏷️ {task.goat_id} {task.goat_name ? `(${task.goat_name})` : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            Target: {task.due_date}
                          </span>
                          <span className="capitalize">
                            Category: {task.category.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark as Done</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: DONE TASKS */}
        {activeTab === 'done' && (
          <div className="space-y-3">
            {doneTasks.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
                <Clock className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  No Completed Tasks in this View
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Once you finish pending vaccination, breeding, or health tasks, click "Mark as Done" to log them here.
                </p>
              </div>
            ) : (
              doneTasks.map(task => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-stone-50/40 dark:bg-stone-800/20 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-90 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800 dark:text-stone-200 text-sm line-through">
                          {task.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          Done
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {task.description}
                      </p>
                      {task.completed_at && (
                        <div className="text-[11px] text-stone-400 mt-1">
                          Completed on: {new Date(task.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reopen Task</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: IMPORTANT HISTORY (FARM RECORDS) */}
        {activeTab === 'important_history' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Important Farm Records History:</strong> Displays critical clinical interventions, kidding births, herd sales, and completed high-priority management tasks.
                </span>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('records')}
                  className="underline font-bold text-emerald-800 dark:text-emerald-200 shrink-0 hover:text-emerald-600"
                >
                  View Full Herd Registry →
                </button>
              )}
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
                <FileSpreadsheet className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  No Historical Records Found
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Important health logs, deliveries, and finalized herd actions will populate here automatically.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-emerald-500/40 dark:border-emerald-500/20 ml-4 sm:ml-6 pl-5 sm:pl-7 space-y-6">
                {filteredHistory.map((item, idx) => {
                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline node */}
                      <div className="absolute -left-[27px] sm:-left-[35px] top-1.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white dark:border-stone-900 shadow-xs" />

                      <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/80 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              {item.badge}
                            </span>
                            {item.importance === 'critical' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                                Vital Record
                              </span>
                            )}
                            <h4 className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">
                              {item.title}
                            </h4>
                          </div>

                          <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400">
                            📅 {item.date}
                          </span>
                        </div>

                        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                          {item.description}
                        </p>

                        {item.goat_id && (
                          <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            Goat Tag: #{item.goat_id}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Add Custom Farm Task */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-stone-900 dark:text-white">
                  Add Farm Task or Schedule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomTask} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Annual Rabies Vaccination or Hoof Trimming Stall 2"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Related Goat ID / Tag
                  </label>
                  <input
                    type="text"
                    value={newGoatId}
                    onChange={e => handleGoatIdChange(e.target.value)}
                    placeholder="e.g. GT-101 or Doe Name"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                  >
                    <option value="vaccination">Vaccination</option>
                    <option value="deworming">Deworming</option>
                    <option value="breeding">Breeding & Maternity</option>
                    <option value="medical">Clinical Medical</option>
                    <option value="hoof">Hoof Trimming</option>
                    <option value="farm_record">Farm Record / Management</option>
                  </select>
                </div>
              </div>

              {/* Smart Tag / Focus Selector */}
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1.5">
                  Task Focus Tag (Smart Filter)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTag('')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      newTag === ''
                        ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200 shadow-2xs'
                        : 'bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTag('Health Check')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                      newTag === 'Health Check'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                        : 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/70 hover:border-sky-400'
                    }`}
                  >
                    <span>🩺</span>
                    <span>Health Check</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTag('Gestation')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                      newTag === 'Gestation'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/70 hover:border-purple-400'
                    }`}
                  >
                    <span>🤰</span>
                    <span>Gestation</span>
                  </button>
                </div>
              </div>

              {/* Automatic Tag and Protocol Suggestion Banner */}
              {taskSuggestion && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-emerald-950/50 border border-emerald-300/80 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black tracking-wider uppercase text-emerald-800 dark:text-emerald-300">
                        ⚡ Auto-Detected Suggestion:
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          taskSuggestion.suggestedTag === 'Gestation'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300/70'
                            : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300/70'
                        }`}
                      >
                        {taskSuggestion.suggestedTag === 'Gestation' ? '🤰 Gestation' : '🩺 Health Check'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">
                      {taskSuggestion.reason}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applySuggestion(taskSuggestion)}
                    className="self-start sm:self-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs"
                  >
                    Apply Suggestion
                  </button>
                </div>
              )}

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  Target Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  Description / Action Protocol
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Specific dosage, veterinary notes, or instructions..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-important-task"
                  checked={newIsImportant}
                  onChange={e => setNewIsImportant(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm border-stone-300 focus:ring-emerald-500"
                />
                <label htmlFor="chk-important-task" className="text-stone-700 dark:text-stone-300 font-bold cursor-pointer">
                  Mark as Important Farm Task (Recorded in Important History)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
