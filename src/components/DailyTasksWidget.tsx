import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Calendar,
  Clock,
  Stethoscope,
  Syringe,
  Utensils,
  CheckCircle2,
  Circle,
  Plus,
  X,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  Wheat,
  ShieldCheck,
  Tag
} from 'lucide-react';

export type TaskCategory = 'all' | 'health' | 'feeding' | 'vaccination';
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'routine';

export interface DailyTaskItem {
  id: string;
  category: 'health' | 'feeding' | 'vaccination';
  title: string;
  subtitle: string;
  time: string;
  target?: string;
  priority: TaskPriority;
  isCustom?: boolean;
  relatedGoatId?: string;
}

interface DailyTasksWidgetProps {
  onNavigateToHealth?: () => void;
  onNavigateToRecords?: () => void;
  onNavigateToBreedingEstimator?: () => void;
  onOpenAddHealthModal?: () => void;
}

export const DailyTasksWidget: React.FC<DailyTasksWidgetProps> = ({
  onNavigateToHealth,
  onNavigateToRecords,
  onNavigateToBreedingEstimator,
  onOpenAddHealthModal,
}) => {
  const { goats, health, breeding } = useFarm();

  const today = useMemo(() => new Date(), []);
  const todayDateStr = useMemo(() => today.toISOString().split('T')[0], [today]);
  const formattedToday = useMemo(() => {
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [today]);

  const storageKey = `smart_goat_tasks_completed_${todayDateStr}`;
  const customTasksKey = `smart_goat_custom_tasks_${todayDateStr}`;

  // State: Completed Task IDs
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // State: User-added Custom Tasks for today
  const [customTasks, setCustomTasks] = useState<DailyTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(customTasksKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('all');

  // Modal State for Adding Custom Daily Task
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubtitle, setNewTaskSubtitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'health' | 'feeding' | 'vaccination'>('feeding');
  const [newTaskTime, setNewTaskTime] = useState('08:00 AM');
  const [newTaskTarget, setNewTaskTarget] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('normal');

  // Persist completed tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completedTaskIds));
    } catch {
      // ignore
    }
  }, [completedTaskIds, storageKey]);

  // Persist custom tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(customTasksKey, JSON.stringify(customTasks));
    } catch {
      // ignore
    }
  }, [customTasks, customTasksKey]);

  // Generate dynamic tasks based on current farm records
  const defaultTasks = useMemo(() => {
    const tasks: DailyTaskItem[] = [];

    // --- 1. HEALTH CHECKS ---
    // A. Check for any sick goats or goats with active conditions
    const sickOrRecovering = health.filter(
      h =>
        h.condition.toLowerCase().includes('sick') ||
        h.condition.toLowerCase().includes('fever') ||
        h.condition.toLowerCase().includes('weak') ||
        h.condition.toLowerCase().includes('mastitis') ||
        h.condition.toLowerCase().includes('pneumonia') ||
        h.condition.toLowerCase().includes('wound')
    );

    if (sickOrRecovering.length > 0) {
      sickOrRecovering.forEach((record, index) => {
        tasks.push({
          id: `health-sick-${record.goat_id}-${index}`,
          category: 'health',
          title: `Post-Treatment Observation: ${record.goat_id}`,
          subtitle: `Inspect condition (${record.condition}), recheck temperature, and verify response to: ${record.treatment}`,
          time: index === 0 ? '07:30 AM' : '02:00 PM',
          target: record.goat_id,
          priority: 'urgent',
          relatedGoatId: record.goat_id,
        });
      });
    } else {
      // Default clinical observation check
      tasks.push({
        id: 'health-sick-default-monitor',
        category: 'health',
        title: 'Post-Treatment Observation: GT-103',
        subtitle: 'Inspect temperature, hydration, and response to antibiotic/electrolyte booster course',
        time: '07:45 AM',
        target: 'GT-103 (Isolation Pen)',
        priority: 'urgent',
        relatedGoatId: 'GT-103',
      });
    }

    // B. Expectant does nearing delivery (within 14 days)
    const expectantNear = breeding.filter(b => {
      if (!b.expected_birth || b.status === 'Delivered') return false;
      const diffDays = Math.ceil((new Date(b.expected_birth).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= -2 && diffDays <= 14;
    });

    if (expectantNear.length > 0) {
      expectantNear.slice(0, 2).forEach(exp => {
        tasks.push({
          id: `health-maternity-${exp.female_id}`,
          category: 'health',
          title: `Pre-Kidding Maternity Check: ${exp.female_id}`,
          subtitle: `Examine udder fill, pelvic ligament softening, and maternity stall sanitation (Due: ${exp.expected_birth})`,
          time: '10:15 AM',
          target: `${exp.female_id} (Maternity)`,
          priority: 'high',
          relatedGoatId: exp.female_id,
        });
      });
    } else {
      tasks.push({
        id: 'health-maternity-default',
        category: 'health',
        title: 'Pre-Kidding Maternity Stall & Udder Check',
        subtitle: 'Monitor pelvic ligament tension and colostrum engorgement for expectant breeding does',
        time: '10:00 AM',
        target: 'Expectant Does (Pen 3)',
        priority: 'high',
      });
    }

    // C. Daily Herd Walk-Through FAMACHA & Lameness Check
    tasks.push({
      id: 'health-routine-herd-inspection',
      category: 'health',
      title: 'Morning Herd Walk-Through & FAMACHA Screening',
      subtitle: 'Examine lower eyelid mucosa for anemia, observe gait for hoof rot/lameness, and inspect nasal discharge',
      time: '08:15 AM',
      target: 'Entire Herd (All Pens)',
      priority: 'normal',
    });

    // --- 2. FEEDING SCHEDULES ---
    tasks.push({
      id: 'feed-morning-dairy-ration',
      category: 'feeding',
      title: 'Morning Lactation Feed & Dairy Concentrate',
      subtitle: 'Dispense 1.5kg high-protein Lucerne hay + 400g dairy meal concentrate per doe prior to morning milking',
      time: '06:30 AM',
      target: 'Lactating Does (Pens 1 & 2)',
      priority: 'high',
    });

    tasks.push({
      id: 'feed-kid-nursery-creep',
      category: 'feeding',
      title: 'Kid Creep Feed & Probiotic Electrolyte Refresh',
      subtitle: 'Refill creep feeders with fresh 18% crude protein starter pellets & clean, lukewarm electrolyte drinking water',
      time: '09:00 AM',
      target: 'Kid Nursery (Pen 4)',
      priority: 'normal',
    });

    tasks.push({
      id: 'feed-pasture-mineral-turnout',
      category: 'feeding',
      title: 'Midday Pasture Turnout & Mineral Salt Lick Inspection',
      subtitle: 'Rotate herd to paddock B for controlled foraging; inspect cobalt/selenium mineral blocks and float valves',
      time: '01:00 PM',
      target: 'Pasture Herd (Paddock B)',
      priority: 'normal',
    });

    tasks.push({
      id: 'feed-evening-roughage-water',
      category: 'feeding',
      title: 'Evening Rhodes Grass Hay & Water Trough Sanitization',
      subtitle: 'Fill overhead hay racks with dry Rhodes grass forage; scrub clean and refill all night water basins',
      time: '05:00 PM',
      target: 'All Pens & Stalls',
      priority: 'routine',
    });

    // --- 3. VACCINATION REMINDERS ---
    tasks.push({
      id: 'vac-cdt-pre-kidding-booster',
      category: 'vaccination',
      title: 'CD/T Pre-Kidding Toxoid Booster Vaccination',
      subtitle: 'Administer 2ml subcutaneous Clostridium Perfringens Types C&D + Tetanus toxoid booster to pregnant does for maternal colostrum transfer',
      time: '11:00 AM',
      target: 'GT-102 & Expectant Does',
      priority: 'high',
      relatedGoatId: 'GT-102',
    });

    tasks.push({
      id: 'vac-prophylactic-deworming-drench',
      category: 'vaccination',
      title: 'Selective Anthelmintic / Deworming Drench',
      subtitle: 'Administer weight-calibrated Albendazole drench to goats scoring FAMACHA 3-4 (parasite mitigation)',
      time: '02:30 PM',
      target: 'Targeted Does & Weaners',
      priority: 'normal',
    });

    tasks.push({
      id: 'vac-cold-chain-inventory-check',
      category: 'vaccination',
      title: 'Cold-Chain Vaccine Inventory & Temperature Log',
      subtitle: 'Verify veterinary refrigerator thermometer reads between 2°C to 8°C for CCPP & PPR vaccine potency',
      time: '04:15 PM',
      target: 'Farm Veterinary Clinic',
      priority: 'routine',
    });

    return tasks;
  }, [health, breeding, today]);

  // Combined Task List (Default + User Custom)
  const allTasks: DailyTaskItem[] = useMemo(() => {
    return [...defaultTasks, ...customTasks];
  }, [defaultTasks, customTasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    if (activeCategory === 'all') return allTasks;
    return allTasks.filter(t => t.category === activeCategory);
  }, [allTasks, activeCategory]);

  // Metrics Calculation
  const totalCount = allTasks.length;
  const completedCount = allTasks.filter(t => !!completedTaskIds[t.id]).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const healthTasksCount = allTasks.filter(t => t.category === 'health').length;
  const feedingTasksCount = allTasks.filter(t => t.category === 'feeding').length;
  const vacTasksCount = allTasks.filter(t => t.category === 'vaccination').length;

  const healthCompletedCount = allTasks.filter(t => t.category === 'health' && !!completedTaskIds[t.id]).length;
  const feedingCompletedCount = allTasks.filter(t => t.category === 'feeding' && !!completedTaskIds[t.id]).length;
  const vacCompletedCount = allTasks.filter(t => t.category === 'vaccination' && !!completedTaskIds[t.id]).length;

  // Toggle Single Task Completion
  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTaskIds(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Mark all completed
  const handleMarkAllComplete = () => {
    const updated: Record<string, boolean> = {};
    allTasks.forEach(t => {
      updated[t.id] = true;
    });
    setCompletedTaskIds(updated);
  };

  // Reset all for the day
  const handleResetAll = () => {
    setCompletedTaskIds({});
  };

  // Add Custom Task Handler
  const handleCreateCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: DailyTaskItem = {
      id: `custom-task-${Date.now()}`,
      category: newTaskCategory,
      title: newTaskTitle.trim(),
      subtitle: newTaskSubtitle.trim() || 'Custom farm task scheduled for today',
      time: newTaskTime.trim() || 'Today',
      target: newTaskTarget.trim() || undefined,
      priority: newTaskPriority,
      isCustom: true,
    };

    setCustomTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskSubtitle('');
    setNewTaskTarget('');
    setIsAddModalOpen(false);
  };

  // Delete Custom Task
  const handleDeleteCustomTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomTasks(prev => prev.filter(t => t.id !== taskId));
    setCompletedTaskIds(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Widget Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              Daily Farm Tasks & Protocols
            </h3>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {formattedToday}
            </span>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm">
            Operational schedule for health diagnostics, nutritional feeding runs, and vaccination reminders.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {progressPercent === 100 ? (
            <button
              type="button"
              id="btn-tasks-reset"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Tasks</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-tasks-mark-all"
              onClick={handleMarkAllComplete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark All Done</span>
            </button>
          )}

          <button
            type="button"
            id="btn-add-custom-daily-task"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Task</span>
          </button>
        </div>
      </div>

      {/* Progress & Quick Metrics Bar */}
      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Today's Execution Progress:
            </span>
            <span className="text-sm font-extrabold text-stone-900">
              {completedCount} of {totalCount} Completed ({progressPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Health: {healthCompletedCount}/{healthTasksCount}</span>
            </span>
            <span className="text-stone-300">•</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Feeding: {feedingCompletedCount}/{feedingTasksCount}</span>
            </span>
            <span className="text-stone-300">•</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>Vaccines: {vacCompletedCount}/{vacTasksCount}</span>
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progressPercent === 100
                ? 'bg-emerald-600'
                : progressPercent > 50
                ? 'bg-emerald-500'
                : 'bg-emerald-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          id="filter-task-all"
          onClick={() => setActiveCategory('all')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeCategory === 'all'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <span>All Tasks</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeCategory === 'all' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
            }`}
          >
            {allTasks.length}
          </span>
        </button>

        <button
          type="button"
          id="filter-task-health"
          onClick={() => setActiveCategory('health')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeCategory === 'health'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Health Checks</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeCategory === 'health' ? 'bg-white/20 text-white' : 'bg-rose-200/80 text-rose-900'
            }`}
          >
            {healthTasksCount}
          </span>
        </button>

        <button
          type="button"
          id="filter-task-feeding"
          onClick={() => setActiveCategory('feeding')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeCategory === 'feeding'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Feeding Schedules</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeCategory === 'feeding' ? 'bg-white/20 text-white' : 'bg-amber-200/80 text-amber-900'
            }`}
          >
            {feedingTasksCount}
          </span>
        </button>

        <button
          type="button"
          id="filter-task-vaccination"
          onClick={() => setActiveCategory('vaccination')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeCategory === 'vaccination'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100'
          }`}
        >
          <Syringe className="w-3.5 h-3.5" />
          <span>Vaccination Reminders</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeCategory === 'vaccination' ? 'bg-white/20 text-white' : 'bg-sky-200/80 text-sky-900'
            }`}
          >
            {vacTasksCount}
          </span>
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-stone-50 border border-stone-200 text-stone-400 text-xs">
            No tasks found in this category for today. Click "+ Add Task" to schedule one.
          </div>
        ) : (
          filteredTasks.map(task => {
            const isDone = !!completedTaskIds[task.id];

            // Priority styling
            let priorityBadge = null;
            if (task.priority === 'urgent') {
              priorityBadge = (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  Urgent
                </span>
              );
            } else if (task.priority === 'high') {
              priorityBadge = (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  High Priority
                </span>
              );
            }

            // Category Icons & Badges
            let categoryIcon = <Stethoscope className="w-4 h-4 text-rose-600" />;
            let categoryLabel = 'Health Check';
            let categoryBg = 'bg-rose-50 border-rose-100 text-rose-800';

            if (task.category === 'feeding') {
              categoryIcon = <Wheat className="w-4 h-4 text-amber-600" />;
              categoryLabel = 'Feeding Schedule';
              categoryBg = 'bg-amber-50 border-amber-100 text-amber-800';
            } else if (task.category === 'vaccination') {
              categoryIcon = <Syringe className="w-4 h-4 text-sky-600" />;
              categoryLabel = 'Vaccination Reminder';
              categoryBg = 'bg-sky-50 border-sky-100 text-sky-800';
            }

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                onClick={() => toggleTaskCompletion(task.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-emerald-50/40 border-emerald-200 opacity-80'
                    : 'bg-white border-stone-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Left: Checkbox + Content */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Checkbox Icon */}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      toggleTaskCompletion(task.id);
                    }}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-stone-300 hover:border-emerald-600 text-transparent'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${isDone ? 'opacity-100' : 'opacity-0'}`} />
                  </button>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${categoryBg}`}>
                        {categoryIcon}
                        <span>{categoryLabel}</span>
                      </span>

                      {priorityBadge}

                      <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-stone-500">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{task.time}</span>
                      </span>

                      {task.target && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                          <Tag className="w-3 h-3 text-stone-400" />
                          <span>{task.target}</span>
                        </span>
                      )}

                      {task.isCustom && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                          Custom
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-bold tracking-tight text-stone-900 ${
                        isDone ? 'line-through text-stone-400' : ''
                      }`}
                    >
                      {task.title}
                    </h4>

                    <p
                      className={`text-xs leading-relaxed text-stone-500 ${
                        isDone ? 'line-through text-stone-400' : ''
                      }`}
                    >
                      {task.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div
                  className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                  onClick={e => e.stopPropagation()}
                >
                  {task.category === 'health' && onNavigateToHealth && (
                    <button
                      type="button"
                      onClick={onNavigateToHealth}
                      className="px-2.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                      <span>Health Logs</span>
                    </button>
                  )}

                  {task.category === 'vaccination' && onOpenAddHealthModal && (
                    <button
                      type="button"
                      onClick={onOpenAddHealthModal}
                      className="px-2.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-900 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Syringe className="w-3.5 h-3.5 text-sky-600" />
                      <span>Log Vaccine</span>
                    </button>
                  )}

                  {task.relatedGoatId && onNavigateToRecords && (
                    <button
                      type="button"
                      onClick={onNavigateToRecords}
                      className="px-2.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors"
                      title={`View goat ${task.relatedGoatId}`}
                    >
                      <span>Herd →</span>
                    </button>
                  )}

                  {task.isCustom && (
                    <button
                      type="button"
                      onClick={e => handleDeleteCustomTask(task.id, e)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete custom task"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Custom Daily Task */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-stone-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <div>
                <h3 className="text-base font-bold text-stone-900">Schedule Today's Farm Task</h3>
                <p className="text-xs text-stone-500">Add an ad-hoc health check, feeding run, or vaccine dose</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Task Category *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTaskCategory('health')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      newTaskCategory === 'health'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                    <span>Health Check</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTaskCategory('feeding')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      newTaskCategory === 'feeding'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>Feeding Schedule</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTaskCategory('vaccination')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      newTaskCategory === 'vaccination'
                        ? 'bg-sky-50 border-sky-500 text-sky-800'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Syringe className="w-3.5 h-3.5 text-sky-600" />
                    <span>Vaccine</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon mineral lick replenishment in Pen 3"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Protocol Details / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Inspect water float valve and add 200g trace mineral salt block"
                  value={newTaskSubtitle}
                  onChange={e => setNewTaskSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 03:30 PM"
                    value={newTaskTime}
                    onChange={e => setNewTaskTime(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Target Goat / Pen
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GT-104 or Pen 2"
                    value={newTaskTarget}
                    onChange={e => setNewTaskTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="routine">Routine</option>
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-semibold rounded-xl hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
                >
                  Add to Today's Tasks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
