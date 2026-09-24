export interface GoatRecord {
  id: string;
  tag_number: string;
  name?: string;
  breed: string;
  gender: 'Male' | 'Female';
  dob: string;
  created_at: string;
  weight_kg?: number;
  status?: 'Active' | 'Sold' | 'Quarantine' | 'Pregnant' | 'Dead';
  quarantine_start_date?: string;
  dam_tag?: string;
  sire_tag?: string;
  photo_url?: string;
}

export interface BreedingRecord {
  id: string;
  female_id: string;
  male_id: string;
  mating_date: string;
  expected_birth: string;
  gestation_days?: number;
  status?: 'Active' | 'Delivered' | 'Failed';
  actual_birth_date?: string;
  kids_born?: number;
  notes?: string;
}

export interface HealthRecord {
  id: string;
  goat_id: string;
  condition: string;
  treatment: string;
  checkup_date: string;
  checkup_type?: 'Routine' | 'Pregnancy Check' | 'Vaccination' | 'Deworming' | 'Illness';
  status?: 'Healthy' | 'Under Treatment' | 'Critical' | 'Recovered' | 'Observation';
  is_pregnant?: boolean;
  fetal_age_days?: number;
  custom_gestation_days?: number;
  vet_name?: string;
}

export interface SaleRecord {
  id: string;
  goat_id: string;
  buyer_name: string;
  price: number;
  sale_date: string;
}

export type ExpenseCategory = 'Feed' | 'Vet' | 'Equipment' | 'Labor' | 'Other';

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: string;
  notes?: string;
  receipt_number?: string;
}

export interface WorkerRecord {
  id: string;
  full_name: string;
  phone: string;
  location: string;
}

export interface MilkRecord {
  id: string;
  goat_id: string;
  date: string;
  morning_liters: number;
  evening_liters: number;
  total_liters: number;
}

export interface FarmUser {
  uid: string;
  email: string;
  farm_name: string;
  owner_name?: string;
  manager_name?: string;
  location?: string;
  farm_size?: string;
  size?: string;
  primary_breed?: string;
  phone?: string;
  bio?: string;
  founded_year?: string;
  established_year?: string;
  farm_type?: string;
  production_focus?: string;
  grazing_system?: string;
  logo_url?: string;
  created_at: string;
}

export type RecordType = 'goat' | 'breeding' | 'health' | 'sale' | 'expense' | 'worker' | 'milk' | 'feed' | 'medication' | 'kid_growth';
export type AppView = 'dashboard' | 'tasks' | 'breeding_estimator' | 'records' | 'health_vet' | 'feed_supply' | 'reports' | 'profile' | 'settings';

export interface KidGrowthRecord {
  id: string;
  kid_tag: string;
  kid_name?: string;
  gender: 'Male' | 'Female';
  breed: string;
  dob: string;
  dam_tag?: string;
  dam_name?: string;
  sire_tag?: string;
  sire_name?: string;
  birth_weight_kg: number;
  thirty_day_weight_kg?: number;
  weaning_date?: string;
  weaning_weight_kg?: number;
  target_weaning_weight_kg?: number;
  adg_grams_per_day?: number;
  status: 'Nursing' | 'Weaned' | 'Sold' | 'Retained';
  notes?: string;
  created_at: string;
}

export type FeedCategory = 'Fodder & Hay' | 'Concentrate' | 'Mineral & Salt' | 'Silage' | 'Supplement';
export type FeedUnit = 'kg' | 'bags' | 'bales' | 'tons' | 'blocks';

export interface FeedRecord {
  id: string;
  name: string;
  category: FeedCategory;
  quantity: number;
  unit: FeedUnit;
  min_threshold: number;
  cost_per_unit?: number;
  supplier?: string;
  storage_location?: string;
  last_restocked?: string;
  expiry_date?: string;
  notes?: string;
}

export type MedicationCategory = 'Dewormer' | 'Antibiotic' | 'Vaccine' | 'Vitamin & Mineral' | 'Antiseptic' | 'Pain Relief';
export type MedicationUnit = 'vials' | 'bottles' | 'ml' | 'doses' | 'tubes' | 'bolus';

export interface MedicationRecord {
  id: string;
  name: string;
  category: MedicationCategory;
  quantity: number;
  unit: MedicationUnit;
  min_threshold: number;
  batch_number?: string;
  expiry_date: string;
  target_diseases?: string;
  withdrawal_period_days?: number;
  storage_requirements?: string;
  supplier?: string;
  cost_per_unit?: number;
  last_restocked?: string;
  notes?: string;
}
