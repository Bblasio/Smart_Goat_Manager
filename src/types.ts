export interface GoatRecord {
  id: string;
  tag_number: string;
  breed: string;
  gender: 'Male' | 'Female';
  dob: string;
  created_at: string;
  weight_kg?: number;
  status?: 'Active' | 'Sold' | 'Quarantine' | 'Pregnant';
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
  created_at: string;
}

export type RecordType = 'goat' | 'breeding' | 'health' | 'sale' | 'worker' | 'milk';
export type AppView = 'dashboard' | 'breeding_estimator' | 'records' | 'health_vet' | 'reports' | 'profile';
