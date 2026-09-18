import { GoatRecord, BreedingRecord, HealthRecord, SaleRecord, WorkerRecord, MilkRecord, FarmUser, ExpenseRecord } from '../types';

export const initialFarmUser: FarmUser = {
  uid: 'usr-default-01',
  email: 'farmer@smartgoatfarm.com',
  farm_name: 'Smart Goat Farm',
  owner_name: '',
  location: 'Nakuru, Kenya',
  farm_size: '25 Acres',
  primary_breed: 'Boer & Galla Dairy',
  phone: '',
  bio: 'Commercial and dairy goat management system.',
  production_focus: 'Dual-Purpose (Dairy Milk & Stud Breeding Stock)',
  grazing_system: 'Semi-Intensive Pasture & Paddock Rotation',
  founded_year: '2021',
  created_at: '2026-01-15T08:00:00Z',
};

export const initialGoats: GoatRecord[] = [
  {
    id: 'goat-1',
    tag_number: 'GT-101',
    name: 'Apollo',
    breed: 'Boer',
    gender: 'Male',
    dob: '2024-03-12',
    created_at: '2024-03-12T10:00:00Z',
    weight_kg: 78,
    status: 'Active',
  },
  {
    id: 'goat-2',
    tag_number: 'GT-102',
    name: 'Bella',
    breed: 'Galla',
    gender: 'Female',
    dob: '2024-05-18',
    created_at: '2024-05-18T11:00:00Z',
    weight_kg: 54,
    status: 'Pregnant',
  },
  {
    id: 'goat-3',
    tag_number: 'GT-103',
    name: 'Nala',
    breed: 'Toggenburg',
    gender: 'Female',
    dob: '2024-08-01',
    created_at: '2024-08-01T09:30:00Z',
    weight_kg: 49,
    status: 'Pregnant',
  },
  {
    id: 'goat-4',
    tag_number: 'GT-104',
    name: 'Daisy',
    breed: 'Saanen',
    gender: 'Female',
    dob: '2025-01-20',
    created_at: '2025-01-20T14:15:00Z',
    weight_kg: 52,
    status: 'Active',
  },
  {
    id: 'goat-5',
    tag_number: 'GT-105',
    name: 'Chloe',
    breed: 'Boer',
    gender: 'Female',
    dob: '2025-02-14',
    created_at: '2025-02-14T08:45:00Z',
    weight_kg: 58,
    status: 'Pregnant',
  },
  {
    id: 'goat-6',
    tag_number: 'GT-106',
    name: 'Simba',
    breed: 'East African Dwarf',
    gender: 'Male',
    dob: '2025-04-10',
    created_at: '2025-04-10T16:20:00Z',
    weight_kg: 36,
    status: 'Active',
  },
  {
    id: 'goat-7',
    tag_number: 'GT-107',
    name: 'Maya',
    breed: 'Alpine',
    gender: 'Female',
    dob: '2025-06-05',
    created_at: '2025-06-05T12:00:00Z',
    weight_kg: 50,
    status: 'Pregnant',
  },
  {
    id: 'goat-8',
    tag_number: 'GT-108',
    name: 'Luna',
    breed: 'Galla',
    gender: 'Female',
    dob: '2025-07-22',
    created_at: '2025-07-22T09:00:00Z',
    weight_kg: 45,
    status: 'Quarantine',
  }
];

export const initialBreeding: BreedingRecord[] = [
  {
    id: 'brd-1',
    female_id: 'GT-102',
    male_id: 'GT-101',
    mating_date: '2026-04-24',
    expected_birth: '2026-09-21',
    gestation_days: 150,
    status: 'Active',
    notes: 'Natural mating; doe showing strong udder development.',
  },
  {
    id: 'brd-2',
    female_id: 'GT-103',
    male_id: 'GT-101',
    mating_date: '2026-05-15',
    expected_birth: '2026-10-12',
    gestation_days: 150,
    status: 'Active',
    notes: 'Ultrasound confirmed twin fetus on 2026-07-15.',
  },
  {
    id: 'brd-3',
    female_id: 'GT-105',
    male_id: 'GT-106',
    mating_date: '2026-06-02',
    expected_birth: '2026-10-30',
    gestation_days: 150,
    status: 'Active',
    notes: 'First-time dam (primiparous).',
  },
  {
    id: 'brd-4',
    female_id: 'GT-107',
    male_id: 'GT-101',
    mating_date: '2026-07-10',
    expected_birth: '2026-12-07',
    gestation_days: 150,
    status: 'Active',
    notes: 'Pen breeding protocol.',
  }
];

export const initialHealth: HealthRecord[] = [
  {
    id: 'hlt-1',
    goat_id: 'GT-103',
    condition: 'Weak / Mild Fever',
    treatment: 'Antibiotic course & electrolyte booster',
    checkup_date: '2026-09-15',
    checkup_type: 'Illness',
    status: 'Under Treatment',
    vet_name: 'Dr. Kariuki',
  },
  {
    id: 'hlt-2',
    goat_id: 'GT-101',
    condition: 'Healthy - Active Sire',
    treatment: 'Routine deworming (Albendazole) & Vitamin AD3E',
    checkup_date: '2026-08-20',
    checkup_type: 'Deworming',
    status: 'Healthy',
    vet_name: 'Dr. Kariuki',
  },
  {
    id: 'hlt-3',
    goat_id: 'GT-102',
    condition: 'Late Gestation Check - Excellent Condition',
    treatment: 'Pre-kidding CD/T booster vaccine and mineral block',
    checkup_date: '2026-09-10',
    checkup_type: 'Pregnancy Check',
    status: 'Healthy',
    is_pregnant: true,
    fetal_age_days: 139,
    custom_gestation_days: 150,
    vet_name: 'Dr. Mutua (Ultrasound)',
  },
  {
    id: 'hlt-4',
    goat_id: 'GT-104',
    condition: 'Healthy Dairy Producer',
    treatment: 'Hoof trimming and teat dip sanitization',
    checkup_date: '2026-08-30',
    checkup_type: 'Routine',
    status: 'Healthy',
    vet_name: 'Mary Wambui (Herder)',
  },
  {
    id: 'hlt-5',
    goat_id: 'GT-105',
    condition: 'Pregnancy Confirmed - Single Fetus',
    treatment: 'Nutritional flush and selenium drench',
    checkup_date: '2026-08-05',
    checkup_type: 'Pregnancy Check',
    status: 'Healthy',
    is_pregnant: true,
    fetal_age_days: 64,
    custom_gestation_days: 150,
    vet_name: 'Dr. Mutua (Ultrasound)',
  },
  {
    id: 'hlt-6',
    goat_id: 'GT-107',
    condition: 'Early Pregnancy Verified',
    treatment: 'High-energy pasture supplement',
    checkup_date: '2026-08-25',
    checkup_type: 'Pregnancy Check',
    status: 'Healthy',
    is_pregnant: true,
    fetal_age_days: 46,
    custom_gestation_days: 150,
    vet_name: 'Dr. Mutua',
  }
];

export const initialSales: SaleRecord[] = [
  {
    id: 'sale-1',
    goat_id: 'GT-089',
    buyer_name: 'David Mwangi',
    price: 18500,
    sale_date: '2026-05-14',
  },
  {
    id: 'sale-2',
    goat_id: 'GT-092',
    buyer_name: 'Grace Achieng',
    price: 24000,
    sale_date: '2026-06-02',
  },
  {
    id: 'sale-3',
    goat_id: 'GT-095',
    buyer_name: 'Rift Valley Livestock Co.',
    price: 32000,
    sale_date: '2026-06-25',
  },
  {
    id: 'sale-4',
    goat_id: 'GT-097',
    buyer_name: 'Peter Kiprono',
    price: 19500,
    sale_date: '2026-07-19',
  },
  {
    id: 'sale-5',
    goat_id: 'GT-099',
    buyer_name: 'Nairobi Organic Meat',
    price: 27500,
    sale_date: '2026-08-11',
  },
  {
    id: 'sale-6',
    goat_id: 'GT-100',
    buyer_name: 'Esther Wanjiku',
    price: 45000,
    sale_date: '2026-09-02',
  }
];

export const initialWorkers: WorkerRecord[] = [
  {
    id: 'wrk-1',
    full_name: 'Samuel Kipchoge',
    phone: '+254 712 345 678',
    location: 'Barn 1 - Breeding & Maternity Section',
  },
  {
    id: 'wrk-2',
    full_name: 'Mary Wambui',
    phone: '+254 723 456 789',
    location: 'Feed & Veterinary Dispensary',
  },
  {
    id: 'wrk-3',
    full_name: 'John Omondi',
    phone: '+254 734 567 890',
    location: 'Pasture & Grazing Field',
  }
];

export const initialMilk: MilkRecord[] = [
  {
    id: 'mlk-1',
    goat_id: 'GT-104',
    date: '2026-09-16',
    morning_liters: 2.4,
    evening_liters: 1.8,
    total_liters: 4.2,
  },
  {
    id: 'mlk-2',
    goat_id: 'GT-108',
    date: '2026-09-16',
    morning_liters: 1.6,
    evening_liters: 1.2,
    total_liters: 2.8,
  },
  {
    id: 'mlk-3',
    goat_id: 'GT-104',
    date: '2026-09-15',
    morning_liters: 2.3,
    evening_liters: 1.9,
    total_liters: 4.2,
  },
  {
    id: 'mlk-4',
    goat_id: 'GT-108',
    date: '2026-09-15',
    morning_liters: 1.5,
    evening_liters: 1.3,
    total_liters: 2.8,
  }
];

export const initialExpenses: ExpenseRecord[] = [
  {
    id: 'exp-1',
    category: 'Feed',
    title: 'High-Protein Lucerne & Dairy Meal (12 bags)',
    amount: 19800,
    date: '2026-08-28',
    notes: 'Bulk feed delivery from Rift Feeds Millers',
    receipt_number: 'REC-2026-881'
  },
  {
    id: 'exp-2',
    category: 'Vet',
    title: 'Herd CCPP Vaccinations & Deworming Drenches',
    amount: 9400,
    date: '2026-08-16',
    notes: 'Administered by Dr. Mutua to all active does and bucks',
    receipt_number: 'VET-9021'
  },
  {
    id: 'exp-3',
    category: 'Equipment',
    title: 'Automatic Stainless Nipple Drinkers & Feed Troughs',
    amount: 14500,
    date: '2026-08-04',
    notes: 'Installation in Maternity and Weaner Pens',
    receipt_number: 'EQP-552'
  },
  {
    id: 'exp-4',
    category: 'Feed',
    title: 'Rhodes Grass Bales & Mineral Lick Blocks',
    amount: 12600,
    date: '2026-07-25',
    notes: 'Dry forage reserves for grazing paddocks',
    receipt_number: 'REC-2026-742'
  },
  {
    id: 'exp-5',
    category: 'Vet',
    title: 'Ultrasound Scan Kit & Maternity Sterile Supplies',
    amount: 8200,
    date: '2026-07-12',
    notes: 'Pregnancy confirmation scans and obstetric antiseptic',
    receipt_number: 'VET-8834'
  },
  {
    id: 'exp-6',
    category: 'Equipment',
    title: 'Solar Fence Energizer & Perimeter Polywire',
    amount: 17800,
    date: '2026-06-20',
    notes: 'Predator-proof paddock fencing upgrade',
    receipt_number: 'EQP-491'
  }
];

