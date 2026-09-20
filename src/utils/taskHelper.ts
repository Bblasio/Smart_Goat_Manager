import { GoatRecord, BreedingRecord, HealthRecord } from '../types';

export interface GoatTaskSuggestion {
  suggestedTag: 'Health Check' | 'Gestation' | null;
  suggestedCategory: 'breeding' | 'medical' | 'vaccination' | 'hoof' | 'deworming' | 'farm_record';
  suggestedTitle: string;
  reason: string;
  matchedGoat: GoatRecord | null;
  details?: {
    isPregnant?: boolean;
    expectedDueDate?: string;
    healthCondition?: string;
    healthStatus?: string;
    isQuarantined?: boolean;
  };
}

/**
 * Automatically suggests a 'Health Check' or 'Gestation' tag when a user creates
 * a task related to a specific goat ID, simplifying the task logging process.
 */
export function suggestTaskTagAndCategory(
  goatIdOrTag: string,
  goats: GoatRecord[],
  breedingRecords: BreedingRecord[] = [],
  healthRecords: HealthRecord[] = []
): GoatTaskSuggestion | null {
  if (!goatIdOrTag || !goatIdOrTag.trim()) {
    return null;
  }

  const query = goatIdOrTag.trim().toLowerCase();

  // Find goat by id or tag_number or name
  const matchedGoat = goats.find(
    g =>
      g.id.toLowerCase() === query ||
      g.tag_number.toLowerCase() === query ||
      (g.name && g.name.toLowerCase() === query)
  );

  if (!matchedGoat) {
    return null;
  }

  const goatIdentifier = matchedGoat.tag_number + (matchedGoat.name ? ` (${matchedGoat.name})` : '');

  // 1. Check for Gestation / Pregnancy status
  const isStatusPregnant = matchedGoat.status === 'Pregnant';
  const activeBreeding = breedingRecords.find(
    b =>
      (b.female_id === matchedGoat.id ||
        b.female_id === matchedGoat.tag_number ||
        (b as any).female_tag?.toLowerCase() === matchedGoat.tag_number.toLowerCase()) &&
      b.status !== 'Delivered' &&
      b.status !== 'Failed'
  );

  // Check health records for pregnancy check flags
  const pregnancyHealthCheck = healthRecords.find(
    h =>
      (h.goat_id === matchedGoat.id || h.goat_id === matchedGoat.tag_number) &&
      (h.is_pregnant || h.checkup_type === 'Pregnancy Check')
  );

  if (isStatusPregnant || activeBreeding || pregnancyHealthCheck?.is_pregnant) {
    const dueDate = activeBreeding?.expected_birth;
    return {
      suggestedTag: 'Gestation',
      suggestedCategory: 'breeding',
      suggestedTitle: `Gestation Monitoring & Maternity Care - ${matchedGoat.tag_number}`,
      reason: `Expectant Doe: ${goatIdentifier} is in gestation${dueDate ? ` (Expected delivery: ${dueDate})` : ''}.`,
      matchedGoat,
      details: {
        isPregnant: true,
        expectedDueDate: dueDate,
      },
    };
  }

  // 2. Check for Clinical Health / Quarantine / Sick conditions
  const isQuarantine = matchedGoat.status === 'Quarantine';
  const isUnderTreatment = (matchedGoat as any).health_status === 'Under Treatment' || (matchedGoat as any).health_status === 'Critical';

  // Find recent health records
  const recentHealth = healthRecords
    .filter(h => h.goat_id === matchedGoat.id || h.goat_id === matchedGoat.tag_number)
    .sort((a, b) => (b.checkup_date || '').localeCompare(a.checkup_date || ''))[0];

  const hasActiveHealthIssue =
    recentHealth &&
    (recentHealth.status === 'Under Treatment' ||
      recentHealth.status === 'Observation' ||
      recentHealth.status === 'Critical' ||
      recentHealth.condition ||
      recentHealth.treatment);

  if (isQuarantine || isUnderTreatment || hasActiveHealthIssue) {
    const condition = recentHealth?.condition || (isQuarantine ? 'Quarantine Isolation' : 'Medical Care');
    return {
      suggestedTag: 'Health Check',
      suggestedCategory: 'medical',
      suggestedTitle: `Health Check & Treatment Follow-up - ${matchedGoat.tag_number}`,
      reason: `Medical Attention: ${goatIdentifier} is ${isQuarantine ? 'in quarantine' : 'under clinical care'} (${condition}).`,
      matchedGoat,
      details: {
        healthCondition: condition,
        healthStatus: recentHealth?.status || (isQuarantine ? 'Quarantine' : 'Under Treatment'),
        isQuarantined: isQuarantine,
      },
    };
  }

  // 3. If Female without active gestation: check if due for reproductive check or general health check
  if (matchedGoat.gender === 'Female') {
    return {
      suggestedTag: 'Health Check',
      suggestedCategory: 'medical',
      suggestedTitle: `Health & Wellness Check - ${matchedGoat.tag_number}`,
      reason: `Routine evaluation for doe ${goatIdentifier}.`,
      matchedGoat,
    };
  }

  // Default for bucks or general herd members
  return {
    suggestedTag: 'Health Check',
    suggestedCategory: 'medical',
    suggestedTitle: `Health & Vitality Check - ${matchedGoat.tag_number}`,
    reason: `Routine clinical evaluation for ${goatIdentifier}.`,
    matchedGoat,
  };
}

export interface QuarantineTaskDefinition {
  id: string;
  title: string;
  goat_id: string;
  goat_name?: string;
  tag: 'Health Check';
  category: 'medical';
  due_date: string;
  days_from_start: number;
  description: string;
  is_important: boolean;
}

/**
 * Creates standardized 7-day intermediate and 14-day clearance biosecurity tasks
 * whenever one or more goats are isolated in quarantine.
 */
export function createQuarantineBiosecurityTasks(
  goat: GoatRecord,
  startDateStr: string = new Date().toISOString().split('T')[0]
): QuarantineTaskDefinition[] {
  const addDays = (base: string, days: number): string => {
    try {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return base;
    }
  };

  const day7Date = addDays(startDateStr, 7);
  const day14Date = addDays(startDateStr, 14);
  const goatLabel = goat.tag_number + (goat.name ? ` (${goat.name})` : '');

  return [
    {
      id: `task-quarantine-day7-${goat.id}-${startDateStr}`,
      title: `Quarantine 7-Day Health Review: ${goatLabel}`,
      goat_id: goat.tag_number,
      goat_name: goat.name,
      tag: 'Health Check',
      category: 'medical',
      due_date: day7Date,
      days_from_start: 7,
      description: `Midway biosecurity evaluation for ${goatLabel}. Audit respiratory sound, rectal temperature, ocular/nasal discharges, and feed intake.`,
      is_important: true,
    },
    {
      id: `task-quarantine-day14-${goat.id}-${startDateStr}`,
      title: `Quarantine 14-Day Clearance & Herd Re-entry: ${goatLabel}`,
      goat_id: goat.tag_number,
      goat_name: goat.name,
      tag: 'Health Check',
      category: 'medical',
      due_date: day14Date,
      days_from_start: 14,
      description: `Final biosecurity clearance inspection for ${goatLabel}. If asymptomatic and healthy for 14 continuous days, authorize transfer into general herd paddocks.`,
      is_important: true,
    },
  ];
}

