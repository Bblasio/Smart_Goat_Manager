import { GoatRecord, BreedingRecord, HealthRecord } from '../types';

export interface FarmNotification {
  id: string;
  type: 'breeding' | 'vaccination' | 'health';
  priority: 'urgent' | 'high' | 'normal';
  title: string;
  message: string;
  date: string;
  isToday: boolean;
  daysDiff: number; // 0 for today, > 0 for upcoming
  goatId?: string;
  goatName?: string;
  details?: string;
  badge: string;
}

/**
 * Get current system date in ISO format YYYY-MM-DD
 */
export function getSystemDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Helper to compute day difference between target date and today
 */
function getDaysDiff(targetDateStr: string, baseDateStr: string): number {
  try {
    const target = new Date(targetDateStr);
    const base = new Date(baseDateStr);
    const diffTime = target.getTime() - base.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Adds days to a date string and returns YYYY-MM-DD
 */
function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

/**
 * Evaluates herd data and returns all relevant notifications,
 * prioritizing events scheduled for the current day.
 */
export function getFarmNotifications(
  goats: GoatRecord[] = [],
  breeding: BreedingRecord[] = [],
  health: HealthRecord[] = [],
  customToday?: string
): {
  all: FarmNotification[];
  todayNotifications: FarmNotification[];
  upcomingNotifications: FarmNotification[];
  todayBreedingCount: number;
  todayVaccineCount: number;
} {
  const todayStr = customToday || getSystemDateStr();
  const goatMap = new Map<string, GoatRecord>();
  goats.forEach(g => {
    goatMap.set(g.tag_number, g);
    goatMap.set(g.id, g);
  });

  const notifications: FarmNotification[] = [];

  // =========================================================================
  // 1. BREEDING NOTIFICATIONS: Kidding Deliveries & Mating
  // =========================================================================
  breeding.forEach(b => {
    if (b.status === 'Delivered' || b.status === 'Failed') return;

    const femaleGoat = goatMap.get(b.female_id);
    const femaleName = femaleGoat?.name ? `${femaleGoat.name} (${b.female_id})` : b.female_id;

    // Check Expected Kidding Date
    if (b.expected_birth) {
      const diff = getDaysDiff(b.expected_birth, todayStr);

      if (diff === 0) {
        // DUE TODAY!
        notifications.push({
          id: `notif-kidding-today-${b.id}`,
          type: 'breeding',
          priority: 'urgent',
          title: `Expected Kidding Due Today: ${femaleName}`,
          message: `Doe ${femaleName} has reached her projected delivery date (${b.expected_birth}). Monitor closely for labor contractions, vulva relaxation, and prepare sterile kidding supplies.`,
          date: b.expected_birth,
          isToday: true,
          daysDiff: 0,
          goatId: b.female_id,
          goatName: femaleGoat?.name,
          details: b.notes || 'Ultrasound/natural gestation tracking',
          badge: '🍼 Kidding Due Today',
        });
      } else if (diff > 0 && diff <= 3) {
        // Upcoming within 1-3 days
        notifications.push({
          id: `notif-kidding-upcoming-${b.id}`,
          type: 'breeding',
          priority: 'high',
          title: `Upcoming Kidding in ${diff} Day${diff > 1 ? 's' : ''}: ${femaleName}`,
          message: `Doe ${femaleName} is due for kidding on ${b.expected_birth}. Ensure clean bedding and maternity pen separation.`,
          date: b.expected_birth,
          isToday: false,
          daysDiff: diff,
          goatId: b.female_id,
          goatName: femaleGoat?.name,
          details: b.notes,
          badge: `🍼 Due in ${diff}d`,
        });
      }

      // Pre-Kidding CD/T Booster (30 days before birth)
      const cdtDueDate = addDays(b.expected_birth, -30);
      const cdtDiff = getDaysDiff(cdtDueDate, todayStr);
      if (cdtDiff === 0) {
        notifications.push({
          id: `notif-prekidding-cdt-${b.id}`,
          type: 'vaccination',
          priority: 'urgent',
          title: `Pre-Kidding CD/T Booster Due Today: ${femaleName}`,
          message: `Administer CD/T toxoid vaccine to doe ${femaleName} today (4 weeks prior to kidding ${b.expected_birth}) to maximize protective colostral antibodies for newborns.`,
          date: cdtDueDate,
          isToday: true,
          daysDiff: 0,
          goatId: b.female_id,
          goatName: femaleGoat?.name,
          details: 'Clostridium perfringens Types C & D + Tetanus Booster',
          badge: '💉 CD/T Vaccine Due Today',
        });
      }
    }

    // Check Scheduled Mating Today
    if (b.mating_date) {
      const matingDiff = getDaysDiff(b.mating_date, todayStr);
      if (matingDiff === 0 && b.status === 'Active') {
        notifications.push({
          id: `notif-mating-today-${b.id}`,
          type: 'breeding',
          priority: 'high',
          title: `Breeding Service Scheduled Today: ${femaleName}`,
          message: `Scheduled mating for doe ${femaleName} with Sire ${b.male_id} recorded for today. Verify buck turnout and observe mating acceptance.`,
          date: b.mating_date,
          isToday: true,
          daysDiff: 0,
          goatId: b.female_id,
          goatName: femaleGoat?.name,
          details: `Sire: ${b.male_id}`,
          badge: '🐐 Mating Scheduled Today',
        });
      }
    }
  });

  // =========================================================================
  // 2. VACCINATION & HEALTH NOTIFICATIONS
  // =========================================================================
  health.forEach(h => {
    const goat = goatMap.get(h.goat_id);
    const goatDisplayName = goat?.name ? `${goat.name} (${h.goat_id})` : h.goat_id;
    const isVaccine =
      h.checkup_type === 'Vaccination' ||
      h.treatment.toLowerCase().includes('vaccin') ||
      h.treatment.toLowerCase().includes('booster') ||
      h.treatment.toLowerCase().includes('toxoid') ||
      h.treatment.toLowerCase().includes('bar-vac') ||
      h.treatment.toLowerCase().includes('cd/t') ||
      h.treatment.toLowerCase().includes('cdt') ||
      h.treatment.toLowerCase().includes('ccpp') ||
      h.treatment.toLowerCase().includes('anthrax');

    if (h.checkup_date) {
      const diff = getDaysDiff(h.checkup_date, todayStr);

      if (diff === 0) {
        // SCHEDULED FOR TODAY
        if (isVaccine) {
          notifications.push({
            id: `notif-vaccine-today-${h.id}`,
            type: 'vaccination',
            priority: 'urgent',
            title: `Vaccination Reminder: ${goatDisplayName}`,
            message: `Vaccine treatment scheduled for today: "${h.treatment}". Administer according to protocol (subcutaneous / intramuscular) and record batch info.`,
            date: h.checkup_date,
            isToday: true,
            daysDiff: 0,
            goatId: h.goat_id,
            goatName: goat?.name,
            details: `Veterinarian / Administrator: ${h.vet_name || 'Farm Staff'}`,
            badge: '💉 Vaccination Due Today',
          });
        } else if (h.status === 'Under Treatment' || h.checkup_type === 'Illness') {
          notifications.push({
            id: `notif-treatment-today-${h.id}`,
            type: 'health',
            priority: 'high',
            title: `Medical Follow-Up Scheduled Today: ${goatDisplayName}`,
            message: `Follow-up evaluation for condition "${h.condition}". Prescribed treatment: ${h.treatment}.`,
            date: h.checkup_date,
            isToday: true,
            daysDiff: 0,
            goatId: h.goat_id,
            goatName: goat?.name,
            details: `Attending Vet: ${h.vet_name || 'Unassigned'}`,
            badge: '🩺 Checkup Due Today',
          });
        }
      } else if (diff > 0 && diff <= 3 && isVaccine) {
        // Upcoming vaccine in 1-3 days
        notifications.push({
          id: `notif-vaccine-upcoming-${h.id}`,
          type: 'vaccination',
          priority: 'high',
          title: `Upcoming Vaccination in ${diff} Day${diff > 1 ? 's' : ''}: ${goatDisplayName}`,
          message: `Vaccine "${h.treatment}" is scheduled for ${h.checkup_date}. Check cold-chain storage and syringe supply.`,
          date: h.checkup_date,
          isToday: false,
          daysDiff: diff,
          goatId: h.goat_id,
          goatName: goat?.name,
          details: `Vet: ${h.vet_name || 'Staff'}`,
          badge: `💉 Vaccine in ${diff}d`,
        });
      }
    }
  });

  // Sort: Today items first (urgent -> high -> normal), then upcoming by daysDiff ascending
  notifications.sort((a, b) => {
    if (a.isToday && !b.isToday) return -1;
    if (!a.isToday && b.isToday) return 1;
    if (a.isToday && b.isToday) {
      const prioOrder = { urgent: 0, high: 1, normal: 2 };
      return prioOrder[a.priority] - prioOrder[b.priority];
    }
    return a.daysDiff - b.daysDiff;
  });

  const todayNotifications = notifications.filter(n => n.isToday);
  const upcomingNotifications = notifications.filter(n => !n.isToday);

  const todayBreedingCount = todayNotifications.filter(n => n.type === 'breeding').length;
  const todayVaccineCount = todayNotifications.filter(n => n.type === 'vaccination').length;

  return {
    all: notifications,
    todayNotifications,
    upcomingNotifications,
    todayBreedingCount,
    todayVaccineCount,
  };
}
