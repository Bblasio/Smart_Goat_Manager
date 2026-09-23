import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  GoatRecord,
  BreedingRecord,
  HealthRecord,
  SaleRecord,
  ExpenseRecord,
  WorkerRecord,
  MilkRecord,
  FarmUser,
  FeedRecord,
  MedicationRecord,
  KidGrowthRecord
} from '../types';
import {
  initialFarmUser,
  initialGoats,
  initialBreeding,
  initialHealth,
  initialSales,
  initialExpenses,
  initialWorkers,
  initialMilk,
  initialFeeds,
  initialMedications,
  initialKidGrowthRecords
} from '../data/mockData';
import {
  auth,
  rtdb,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  ref,
  onValue,
  set,
  push,
  remove,
  get,
  update,
  User
} from '../lib/firebase';

export type SyncStatus = 'connected' | 'connecting' | 'local_fallback' | 'error';

interface FarmContextType {
  user: FarmUser | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isDemoMode: boolean;
  farmName: string;
  daysActive: number;
  syncStatus: SyncStatus;
  syncError: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  isFirebaseActive: boolean;
  recordsLoaded: boolean;
  goats: GoatRecord[];
  breeding: BreedingRecord[];
  health: HealthRecord[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  workers: WorkerRecord[];
  milk: MilkRecord[];
  feeds: FeedRecord[];
  medications: MedicationRecord[];
  kidGrowthRecords: KidGrowthRecord[];
  login: (email: string, password?: string, farmName?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    farmName: string,
    profileDetails?: {
      owner_name?: string;
      location?: string;
      farm_size?: string;
      primary_breed?: string;
      phone?: string;
      bio?: string;
      production_focus?: string;
      grazing_system?: string;
      founded_year?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  updateFarmProfile: (profile: Partial<FarmUser>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  enterDemoMode: () => void;
  addGoat: (goat: Omit<GoatRecord, 'id' | 'created_at'>) => Promise<void>;
  updateGoat: (id: string, updates: Partial<GoatRecord>) => Promise<void>;
  bulkUpdateGoats: (ids: string[], updates: Partial<GoatRecord>) => Promise<void>;
  bulkDeleteGoats: (ids: string[]) => Promise<void>;
  deleteGoat: (id: string) => Promise<void>;
  addBreeding: (breed: Omit<BreedingRecord, 'id'>) => Promise<void>;
  updateBreeding: (id: string, breed: Partial<BreedingRecord>) => Promise<void>;
  deleteBreeding: (id: string) => Promise<void>;
  addHealth: (item: Omit<HealthRecord, 'id'>) => Promise<void>;
  deleteHealth: (id: string) => Promise<void>;
  addSale: (sale: Omit<SaleRecord, 'id'>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addWorker: (worker: Omit<WorkerRecord, 'id'>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  addMilk: (milkItem: Omit<MilkRecord, 'id'>) => Promise<void>;
  deleteMilk: (id: string) => Promise<void>;
  addFeed: (feed: Omit<FeedRecord, 'id'>) => Promise<void>;
  updateFeed: (id: string, updates: Partial<FeedRecord>) => Promise<void>;
  deleteFeed: (id: string) => Promise<void>;
  clearAllFeeds: () => Promise<void>;
  consumeFeed: (id: string, amount: number, notes?: string) => Promise<void>;
  restockFeed: (id: string, amount: number, cost?: number) => Promise<void>;
  addMedication: (med: Omit<MedicationRecord, 'id'>) => Promise<void>;
  updateMedication: (id: string, updates: Partial<MedicationRecord>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  clearAllMedications: () => Promise<void>;
  consumeMedication: (id: string, amount: number, goatId?: string, notes?: string) => Promise<void>;
  restockMedication: (id: string, amount: number) => Promise<void>;
  addKidGrowthRecord: (record: Omit<KidGrowthRecord, 'id' | 'created_at'>) => Promise<void>;
  updateKidGrowthRecord: (id: string, updates: Partial<KidGrowthRecord>) => Promise<void>;
  deleteKidGrowthRecord: (id: string) => Promise<void>;
  clearAllKidGrowthRecords: () => Promise<void>;
  importBatchRecords: (records: {
    goats?: Omit<GoatRecord, 'id' | 'created_at'>[];
    breeding?: Omit<BreedingRecord, 'id'>[];
    health?: Omit<HealthRecord, 'id'>[];
    milk?: Omit<MilkRecord, 'id'>[];
    sales?: Omit<SaleRecord, 'id'>[];
    expenses?: Omit<ExpenseRecord, 'id'>[];
    workers?: Omit<WorkerRecord, 'id'>[];
  }) => Promise<{ totalImported: number }>;
  pushSeedDataToFirebase: () => Promise<{ success: boolean; message: string }>;
  syncAllCurrentRecordsToFirebase: () => Promise<{ success: boolean; message: string }>;
  resetToSampleData: () => void;
  refreshFromFirebase: () => Promise<{ success: boolean; message: string }>;
  confirmActivation: (email?: string) => Promise<{ success: boolean; error?: string }>;
  checkActivationStatus: (email?: string) => Promise<{ activated: boolean; emailVerified: boolean }>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);
  const [recordsLoaded, setRecordsLoaded] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => new Date());

  // Demo mode flag
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('sgm_is_demo') === 'true';
  });

  // User state
  const [user, setUser] = useState<FarmUser | null>(() => {
    const isDemo = localStorage.getItem('sgm_is_demo') === 'true';
    const saved = localStorage.getItem('sgm_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.uid === 'usr-default-01' || parsed.uid === 'usr-demo-farm') {
          if (isDemo) {
            return parsed;
          }
          return null;
        }
        return parsed;
      } catch {
        return isDemo ? initialFarmUser : null;
      }
    }
    if (isDemo) {
      return initialFarmUser;
    }
    return null;
  });

  // Herd and farm records
  const [goats, setGoats] = useState<GoatRecord[]>(() => {
    if (localStorage.getItem('sgm_is_demo') === 'true') {
      return initialGoats;
    }
    return [];
  });

  const [breeding, setBreeding] = useState<BreedingRecord[]>(() => {
    if (localStorage.getItem('sgm_is_demo') === 'true') {
      return initialBreeding;
    }
    return [];
  });

  const [health, setHealth] = useState<HealthRecord[]>(() => {
    if (localStorage.getItem('sgm_is_demo') === 'true') {
      return initialHealth;
    }
    return [];
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    if (localStorage.getItem('sgm_is_demo') === 'true') {
      return initialSales;
    }
    return [];
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    if (localStorage.getItem('sgm_is_demo') === 'true') {
      return initialExpenses;
    }
    const saved = localStorage.getItem('sgm_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [workers, setWorkers] = useState<WorkerRecord[]>(() => {
    if (localStorage.getItem('sgm_is_demo') === 'true') {
      return initialWorkers;
    }
    return [];
  });

  const [milk, setMilk] = useState<MilkRecord[]>(() => {
    if (localStorage.getItem('sgm_is_demo') === 'true') {
      return initialMilk;
    }
    return [];
  });

  const [feeds, setFeeds] = useState<FeedRecord[]>(() => {
    const saved = localStorage.getItem('sgm_feeds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude any legacy mock feeds ('feed-1' through 'feed-5')
          const customFeeds = parsed.filter(
            (f: FeedRecord) => !['feed-1', 'feed-2', 'feed-3', 'feed-4', 'feed-5'].includes(f.id)
          );
          return customFeeds;
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [medications, setMedications] = useState<MedicationRecord[]>(() => {
    const saved = localStorage.getItem('sgm_medications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore
      }
    }
    return initialMedications;
  });

  const [kidGrowthRecords, setKidGrowthRecords] = useState<KidGrowthRecord[]>(() => {
    const saved = localStorage.getItem('sgm_kid_growth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore
      }
    }
    return initialKidGrowthRecords;
  });

  // Ref to track active UID to avoid stale closures
  const activeUidRef = useRef<string | null>(null);
  activeUidRef.current = firebaseUser?.uid || (isDemoMode ? 'usr-demo-farm' : null);

  // Monitor browser network online/offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (firebaseUser) {
        setSyncStatus('connecting');
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('local_fallback');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [firebaseUser]);

  // Monitor connection to Firebase RTDB server
  useEffect(() => {
    const connectedRef = ref(rtdb, '.info/connected');
    const unsubscribe = onValue(connectedRef, snap => {
      const isConnected = snap.val() === true;
      if (isConnected) {
        setIsFirebaseActive(true);
        if (firebaseUser) {
          setSyncStatus('connected');
          setLastSyncedAt(new Date());
        }
      } else {
        if (!navigator.onLine) {
          setIsOnline(false);
          setSyncStatus('local_fallback');
        } else if (firebaseUser) {
          setSyncStatus('connecting');
        }
      }
    }, err => {
      console.warn('Firebase RTDB .info/connected warning:', err.message);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // Helper to safely execute async promises with a strict timeout to prevent indefinite hangs
  const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
    ]);
  };

  // Hard safety fallback: guarantee authLoading never lingers indefinitely on initial load
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 800);
    return () => clearTimeout(safetyTimer);
  }, []);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      setFirebaseUser(fbUser);
      setAuthLoading(false);

      if (fbUser) {
        setIsDemoMode(false);
        localStorage.removeItem('sgm_is_demo');
        setIsFirebaseActive(true);
        setSyncStatus('connecting');

        // Retrieve cached profile for this user UID first so profile details are never lost on reload
        const prefix = (fbUser.email || 'Farm').split('@')[0];
        let defaultFarmName = fbUser.displayName || (prefix.charAt(0).toUpperCase() + prefix.slice(1) + ' Goat Farm');
        let initialCachedUser: FarmUser | null = null;
        try {
          const cached = localStorage.getItem(`sgm_profile_${fbUser.uid}`) || localStorage.getItem('sgm_user');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.uid === fbUser.uid) {
              initialCachedUser = parsed;
              defaultFarmName = parsed.farm_name || defaultFarmName;
            }
          }
        } catch {
          // ignore
        }

        const immediateUser: FarmUser = initialCachedUser || {
          uid: fbUser.uid,
          email: fbUser.email || '',
          farm_name: defaultFarmName,
          created_at: new Date().toISOString(),
        };

        setUser(immediateUser);
        localStorage.setItem('sgm_user', JSON.stringify(immediateUser));
        localStorage.setItem(`sgm_profile_${fbUser.uid}`, JSON.stringify(immediateUser));

        // Fetch user profile from RTDB (read-only; never overwrite with blanks if fetch is slow)
        try {
          const profileRef = ref(rtdb, `users/${fbUser.uid}/user_profile`);
          const profileSnap = await withTimeout(get(profileRef), 3500, null);

          let val = profileSnap && profileSnap.exists() ? profileSnap.val() : null;

          if (!val) {
            // Check fallback path users/{uid}/profile
            const altSnap = await withTimeout(get(ref(rtdb, `users/${fbUser.uid}/profile`)), 2000, null);
            if (altSnap && altSnap.exists()) {
              val = altSnap.val();
            }
          }

          if (val) {
            const resolvedFarmName = val.farm_name || val.farmName || fbUser.displayName || immediateUser.farm_name || defaultFarmName;
            const currentProfile: FarmUser = {
              ...immediateUser,
              uid: fbUser.uid,
              email: fbUser.email || val.email || immediateUser.email,
              farm_name: resolvedFarmName,
              owner_name: val.owner_name || val.ownerName || immediateUser.owner_name || '',
              location: val.location || val.county || immediateUser.location || '',
              farm_size: val.farm_size || val.farmSize || immediateUser.farm_size || '',
              primary_breed: val.primary_breed || val.primaryBreed || immediateUser.primary_breed || '',
              phone: val.phone || val.phoneNumber || immediateUser.phone || '',
              bio: val.bio || immediateUser.bio || '',
              production_focus: val.production_focus || val.productionFocus || immediateUser.production_focus || '',
              grazing_system: val.grazing_system || val.grazingSystem || immediateUser.grazing_system || '',
              founded_year: val.founded_year || val.foundedYear || immediateUser.founded_year || '',
              logo_url: val.logo_url || val.logoUrl || immediateUser.logo_url || '',
              created_at: val.created_at || immediateUser.created_at,
            };

            setUser(currentProfile);
            localStorage.setItem('sgm_user', JSON.stringify(currentProfile));
            localStorage.setItem(`sgm_profile_${fbUser.uid}`, JSON.stringify(currentProfile));
          }
        } catch (err: any) {
          console.warn('Firebase profile fetch notice:', err.message);
        }
      } else {
        // No Firebase user
        const demoActive = localStorage.getItem('sgm_is_demo') === 'true';
        if (demoActive) {
          setIsDemoMode(true);
          const savedDemoUser = (() => {
            try {
              const s = localStorage.getItem('sgm_user');
              return s ? JSON.parse(s) : null;
            } catch {
              return null;
            }
          })();
          setUser(savedDemoUser || initialFarmUser);
          setGoats(initialGoats);
          setBreeding(initialBreeding);
          setHealth(initialHealth);
          setSales(initialSales);
          setWorkers(initialWorkers);
          setMilk(initialMilk);
          setSyncStatus('local_fallback');
          setRecordsLoaded(true);
        } else {
          setUser(null);
          setGoats([]);
          setBreeding([]);
          setHealth([]);
          setSales([]);
          setWorkers([]);
          setMilk([]);
          setSyncStatus('local_fallback');
          setRecordsLoaded(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Central helper to parse and apply database snapshot to state and local storage
  const applyDatabaseSnapshot = (userData: any, uid: string) => {
    if (!userData) {
      setGoats([]);
      setBreeding([]);
      setHealth([]);
      setSales([]);
      setExpenses([]);
      setWorkers([]);
      setMilk([]);
      setFeeds([]);
      setMedications([]);
      setKidGrowthRecords([]);
      return;
    }

    // Sync full profile if present
    const profile = userData.user_profile || userData.profile;
    if (profile) {
      const cloudFarmName = profile.farm_name || profile.farmName || 'Smart Goat Farm';
      setUser(prev => {
        const updated: FarmUser = {
          uid: prev?.uid || uid,
          email: profile.email || prev?.email || firebaseUser?.email || '',
          farm_name: cloudFarmName,
          owner_name: profile.owner_name || profile.ownerName || prev?.owner_name || '',
          location: profile.location || profile.county || prev?.location || '',
          farm_size: profile.farm_size || profile.farmSize || prev?.farm_size || '',
          primary_breed: profile.primary_breed || profile.primaryBreed || prev?.primary_breed || '',
          phone: profile.phone || profile.phoneNumber || prev?.phone || '',
          bio: profile.bio || prev?.bio || '',
          production_focus: profile.production_focus || profile.productionFocus || prev?.production_focus || '',
          grazing_system: profile.grazing_system || profile.grazingSystem || prev?.grazing_system || '',
          founded_year: profile.founded_year || profile.foundedYear || prev?.founded_year || '',
          logo_url: profile.logo_url || profile.logoUrl || prev?.logo_url || '',
          created_at: profile.created_at || prev?.created_at || new Date().toISOString(),
        };
        localStorage.setItem('sgm_user', JSON.stringify(updated));
        localStorage.setItem(`sgm_profile_${uid}`, JSON.stringify(updated));
        return updated;
      });
    }

    const recordsContainer = userData.records || userData;

    // Goats
    if (recordsContainer.goats) {
      const rawGoats = recordsContainer.goats;
      const parsedGoats: GoatRecord[] = Object.entries(rawGoats).map(([key, val]: [string, any]) => ({
        id: key,
        tag_number: val.tag_number || val.tagNumber || val.tag || val.tag_no || key,
        breed: val.breed || 'Boer',
        gender: val.gender || val.sex || 'Female',
        dob: val.dob || val.date_of_birth || new Date().toISOString().split('T')[0],
        created_at: val.created_at || val.createdAt || new Date().toISOString(),
        weight_kg: val.weight_kg != null ? Number(val.weight_kg) : (val.weight != null ? Number(val.weight) : 45),
        status: val.status || 'Active',
      }));
      setGoats(parsedGoats);
    } else {
      setGoats([]);
    }

    // Breeding
    if (recordsContainer.breeding) {
      const rawBreeding = recordsContainer.breeding;
      const parsedBreeding: BreedingRecord[] = Object.entries(rawBreeding).map(([key, val]: [string, any]) => ({
        id: key,
        female_id: val.female_id || val.femaleId || val.dam || '',
        male_id: val.male_id || val.maleId || val.sire || '',
        mating_date: val.mating_date || val.matingDate || val.date || '',
        expected_birth: val.expected_birth || val.expectedBirth || val.kidding_date || '',
        gestation_days: Number(val.gestation_days || val.gestationDays || 150),
        status: val.status || 'Active',
        notes: val.notes || '',
        actual_birth_date: val.actual_birth_date || val.actualBirthDate || undefined,
        kids_born: val.kids_born != null ? Number(val.kids_born) : undefined,
      }));
      setBreeding(parsedBreeding);
    } else {
      setBreeding([]);
    }

    // Health
    if (recordsContainer.health) {
      const rawHealth = recordsContainer.health;
      const parsedHealth: HealthRecord[] = Object.entries(rawHealth).map(([key, val]: [string, any]) => ({
        id: key,
        goat_id: val.goat_id || val.goatId || '',
        condition: val.condition || val.diagnosis || '',
        treatment: val.treatment || val.medication || '',
        checkup_date: val.checkup_date || val.checkupDate || val.date || '',
        checkup_type: val.checkup_type || val.checkupType || 'Routine',
        is_pregnant: Boolean(val.is_pregnant || val.pregnant),
        fetal_age_days: val.fetal_age_days != null ? Number(val.fetal_age_days) : undefined,
        custom_gestation_days: val.custom_gestation_days != null ? Number(val.custom_gestation_days) : undefined,
        vet_name: val.vet_name || val.vetName || '',
      }));
      setHealth(parsedHealth);
    } else {
      setHealth([]);
    }

    // Sales
    if (recordsContainer.sales) {
      const rawSales = recordsContainer.sales;
      const parsedSales: SaleRecord[] = Object.entries(rawSales).map(([key, val]: [string, any]) => ({
        id: key,
        goat_id: val.goat_id || val.goatId || '',
        buyer_name: val.buyer_name || val.buyer || '',
        price: Number(val.price) || 0,
        sale_date: val.sale_date || val.date || '',
      }));
      setSales(parsedSales);
    } else {
      setSales([]);
    }

    // Expenses
    if (recordsContainer.expenses) {
      const rawExpenses = recordsContainer.expenses;
      const parsedExpenses: ExpenseRecord[] = Object.entries(rawExpenses).map(([key, val]: [string, any]) => ({
        id: key,
        category: val.category || 'Other',
        title: val.title || val.description || 'Expense',
        amount: Number(val.amount) || 0,
        date: val.date || new Date().toISOString().split('T')[0],
        notes: val.notes || '',
        receipt_number: val.receipt_number || val.receiptNumber || '',
      }));
      setExpenses(parsedExpenses);
    } else {
      setExpenses([]);
    }

    // Workers
    if (recordsContainer.workers) {
      const rawWorkers = recordsContainer.workers;
      const parsedWorkers: WorkerRecord[] = Object.entries(rawWorkers).map(([key, val]: [string, any]) => ({
        id: key,
        full_name: val.full_name || val.name || '',
        phone: val.phone || val.phoneNumber || '',
        location: val.location || val.address || '',
      }));
      setWorkers(parsedWorkers);
    } else {
      setWorkers([]);
    }

    // Milk
    if (recordsContainer.milk) {
      const rawMilk = recordsContainer.milk;
      const parsedMilk: MilkRecord[] = Object.entries(rawMilk).map(([key, val]: [string, any]) => ({
        id: key,
        goat_id: val.goat_id || val.goatId || '',
        date: val.date || '',
        morning_liters: Number(val.morning_liters || val.morning) || 0,
        evening_liters: Number(val.evening_liters || val.evening) || 0,
        total_liters: Number(val.total_liters) || (Number(val.morning_liters || 0) + Number(val.evening_liters || 0)),
      }));
      setMilk(parsedMilk);
    } else {
      setMilk([]);
    }

    // Feeds
    if (recordsContainer.feeds) {
      const rawFeeds = recordsContainer.feeds;
      const parsedFeeds: FeedRecord[] = Object.entries(rawFeeds)
        .filter(([k]) => !['feed-1', 'feed-2', 'feed-3', 'feed-4', 'feed-5'].includes(k))
        .map(([key, val]: [string, any]) => ({
          id: key,
          name: val.name || '',
          category: val.category || 'Fodder & Hay',
          quantity: Number(val.quantity) || 0,
          unit: val.unit || 'kg',
          min_threshold: Number(val.min_threshold) || 0,
          cost_per_unit: val.cost_per_unit !== undefined ? Number(val.cost_per_unit) : undefined,
          supplier: val.supplier || '',
          storage_location: val.storage_location || '',
          last_restocked: val.last_restocked || '',
          expiry_date: val.expiry_date || '',
          notes: val.notes || '',
        }));
      setFeeds(parsedFeeds);
      localStorage.setItem('sgm_feeds', JSON.stringify(parsedFeeds));
    } else {
      setFeeds([]);
      localStorage.setItem('sgm_feeds', JSON.stringify([]));
    }

    // Medications
    if (recordsContainer.medications) {
      const rawMeds = recordsContainer.medications;
      const parsedMeds: MedicationRecord[] = Object.entries(rawMeds).map(([key, val]: [string, any]) => ({
        id: key,
        name: val.name || '',
        category: val.category || 'Antibiotic',
        quantity: Number(val.quantity) || 0,
        unit: val.unit || 'vials',
        min_threshold: Number(val.min_threshold) || 0,
        batch_number: val.batch_number || '',
        expiry_date: val.expiry_date || '',
        target_diseases: val.target_diseases || '',
        withdrawal_period_days: val.withdrawal_period_days !== undefined ? Number(val.withdrawal_period_days) : undefined,
        storage_requirements: val.storage_requirements || '',
        supplier: val.supplier || '',
        last_restocked: val.last_restocked || '',
        notes: val.notes || '',
      }));
      setMedications(parsedMeds);
      localStorage.setItem('sgm_medications', JSON.stringify(parsedMeds));
    } else {
      setMedications([]);
      localStorage.setItem('sgm_medications', JSON.stringify([]));
    }

    // Kid Growth
    if (recordsContainer.kid_growth) {
      const rawKids = recordsContainer.kid_growth;
      const parsedKids: KidGrowthRecord[] = Object.entries(rawKids).map(([id, val]: [string, any]) => ({
        id,
        kid_tag: val.kid_tag || '',
        kid_name: val.kid_name || '',
        gender: val.gender || 'Male',
        breed: val.breed || '',
        dob: val.dob || '',
        dam_tag: val.dam_tag || '',
        dam_name: val.dam_name || '',
        sire_tag: val.sire_tag || '',
        sire_name: val.sire_name || '',
        birth_weight_kg: Number(val.birth_weight_kg) || 0,
        thirty_day_weight_kg: val.thirty_day_weight_kg !== undefined ? Number(val.thirty_day_weight_kg) : undefined,
        weaning_date: val.weaning_date || '',
        weaning_weight_kg: val.weaning_weight_kg !== undefined ? Number(val.weaning_weight_kg) : undefined,
        target_weaning_weight_kg: val.target_weaning_weight_kg !== undefined ? Number(val.target_weaning_weight_kg) : undefined,
        adg_grams_per_day: val.adg_grams_per_day !== undefined ? Number(val.adg_grams_per_day) : undefined,
        status: val.status || 'Nursing',
        notes: val.notes || '',
        created_at: val.created_at || new Date().toISOString(),
      }));
      setKidGrowthRecords(parsedKids);
      localStorage.setItem('sgm_kid_growth', JSON.stringify(parsedKids));
    } else {
      setKidGrowthRecords([]);
      localStorage.setItem('sgm_kid_growth', JSON.stringify([]));
    }
  };

  // Sync with Firebase Realtime Database for active authenticated user
  useEffect(() => {
    if (!firebaseUser) {
      if (isDemoMode) {
        setSyncStatus('local_fallback');
        setRecordsLoaded(true);
      }
      return;
    }

    const uid = firebaseUser.uid;
    setSyncStatus('connecting');
    setSyncError(null);

    // Primary listener on users/{uid}
    const userRootRef = ref(rtdb, `users/${uid}`);

    const unsubscribe = onValue(
      userRootRef,
      snapshot => {
        setSyncStatus('connected');
        setIsFirebaseActive(true);
        setSyncError(null);
        setRecordsLoaded(true);

        if (snapshot.exists()) {
          applyDatabaseSnapshot(snapshot.val(), uid);
        } else {
          applyDatabaseSnapshot(null, uid);
        }
      },
      error => {
        console.warn('Realtime Database listener error:', error.message);
        setSyncStatus('error');
        setSyncError(error.message);
        setRecordsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  // AUTH ACTIONS
  const login = async (email: string, password?: string, farmName?: string): Promise<{ success: boolean; error?: string }> => {
    // Demo Mode Trigger
    if (!password || password === 'demo' || email.trim().toLowerCase() === 'demo@farm.com') {
      enterDemoMode();
      return { success: true };
    }

    try {
      setIsDemoMode(false);
      localStorage.removeItem('sgm_is_demo');

      // Strict timeout on Firebase Auth to ensure it never hangs indefinitely
      const userCredential = await withTimeout(
        signInWithEmailAndPassword(auth, email.trim(), password),
        10000,
        null as any
      );

      if (!userCredential || !userCredential.user) {
        setAuthLoading(false);
        throw new Error('Authentication request timed out. Please check your network connection.');
      }

      const fbUser = userCredential.user;
      setFirebaseUser(fbUser);
      setAuthLoading(false);
      setIsFirebaseActive(true);
      setSyncStatus('connecting');

      // Establish profile immediately from local cache so sign-in is instant
      let resolvedFarmName = fbUser.displayName || '';
      let initialOwner = '';
      let cachedProfile: FarmUser | null = null;
      try {
        const cached = localStorage.getItem(`sgm_profile_${fbUser.uid}`) || localStorage.getItem('sgm_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.uid === fbUser.uid) {
            cachedProfile = parsed;
            resolvedFarmName = parsed.farm_name || resolvedFarmName;
            initialOwner = parsed.owner_name || '';
          }
        }
      } catch {
        // ignore
      }

      if (!resolvedFarmName) {
        const prefix = email.split('@')[0];
        resolvedFarmName = prefix.charAt(0).toUpperCase() + prefix.slice(1) + ' Goat Farm';
      }

      const immediateProfile: FarmUser = cachedProfile || {
        uid: fbUser.uid,
        email: fbUser.email || email,
        farm_name: resolvedFarmName,
        owner_name: initialOwner,
        created_at: new Date().toISOString(),
      };

      setUser(immediateProfile);
      localStorage.setItem('sgm_user', JSON.stringify(immediateProfile));
      localStorage.setItem(`sgm_profile_${fbUser.uid}`, JSON.stringify(immediateProfile));

      // Attempt to load profile from RTDB in background without blocking login
      withTimeout(get(ref(rtdb, `users/${fbUser.uid}/user_profile`)), 3500, null)
        .then(snap => {
          let val = snap && snap.exists() ? snap.val() : null;
          if (!val) {
            return withTimeout(get(ref(rtdb, `users/${fbUser.uid}/profile`)), 2000, null).then(altSnap => {
              return altSnap && altSnap.exists() ? altSnap.val() : null;
            });
          }
          return val;
        })
        .then(val => {
          if (val) {
            const cloudFarmName = val.farm_name || val.farmName || resolvedFarmName;
            setUser(prev => {
              const updated: FarmUser = {
                ...(prev || immediateProfile),
                farm_name: cloudFarmName,
                owner_name: val.owner_name || val.ownerName || prev?.owner_name || '',
                location: val.location || val.county || prev?.location || '',
                farm_size: val.farm_size || val.farmSize || prev?.farm_size || '',
                primary_breed: val.primary_breed || val.primaryBreed || prev?.primary_breed || '',
                phone: val.phone || val.phoneNumber || prev?.phone || '',
                bio: val.bio || prev?.bio || '',
                production_focus: val.production_focus || val.productionFocus || prev?.production_focus || '',
                grazing_system: val.grazing_system || val.grazingSystem || prev?.grazing_system || '',
                founded_year: val.founded_year || val.foundedYear || prev?.founded_year || '',
                logo_url: val.logo_url || val.logoUrl || prev?.logo_url || '',
                created_at: val.created_at || prev?.created_at || new Date().toISOString(),
              };
              localStorage.setItem('sgm_user', JSON.stringify(updated));
              localStorage.setItem(`sgm_profile_${fbUser.uid}`, JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(e => console.warn('Background profile fetch notice:', e));

      return { success: true };
    } catch (err: any) {
      setAuthLoading(false);
      const code = err?.code || '';
      const msg = (err?.message || '').toLowerCase();
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email' ||
        code === 'auth/user-disabled' ||
        msg.includes('invalid-credential') ||
        msg.includes('wrong-password') ||
        msg.includes('user-not-found') ||
        msg.includes('invalid_login_credentials') ||
        msg.includes('invalid email')
      ) {
        return {
          success: false,
          error: 'Incorrect email or password. Please verify your credentials or click "Forgot password?" to reset.',
        };
      }
      if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
        return {
          success: false,
          error: 'Too many failed login attempts. Access is paused temporarily. Please reset your password or retry shortly.',
        };
      }
      if (code === 'auth/network-request-failed' || msg.includes('network') || msg.includes('timed out')) {
        return {
          success: false,
          error: 'Network connectivity issue. Please check your internet connection and try again.',
        };
      }

      console.warn('Login error:', err.message || err);
      return { success: false, error: err?.message || 'Incorrect sign-in details' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    farmName: string,
    profileDetails?: {
      owner_name?: string;
      location?: string;
      farm_size?: string;
      primary_breed?: string;
      phone?: string;
      bio?: string;
      production_focus?: string;
      grazing_system?: string;
      founded_year?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsDemoMode(false);
      localStorage.removeItem('sgm_is_demo');

      const cleanedFarmName = farmName.trim() || 'Smart Goat Farm';

      // 1. Create account in Firebase Auth
      const userCredential = await withTimeout(
        createUserWithEmailAndPassword(auth, email.trim(), password),
        10000,
        null as any
      );

      if (!userCredential || !userCredential.user) {
        throw new Error('Registration timed out. Please check your network connection.');
      }

      const fbUser = userCredential.user;

      // 2. Set Firebase Auth displayName to the user's farm name
      try {
        await updateProfile(fbUser, { displayName: cleanedFarmName });
      } catch (err) {
        console.warn('Could not update Firebase displayName:', err);
      }

      const newProfile: FarmUser = {
        uid: fbUser.uid,
        email: fbUser.email || email,
        farm_name: cleanedFarmName,
        owner_name: profileDetails?.owner_name?.trim() || '',
        location: profileDetails?.location?.trim() || '',
        farm_size: profileDetails?.farm_size?.trim() || '',
        primary_breed: profileDetails?.primary_breed?.trim() || '',
        phone: profileDetails?.phone?.trim() || '',
        bio: profileDetails?.bio?.trim() || '',
        production_focus: profileDetails?.production_focus?.trim() || '',
        grazing_system: profileDetails?.grazing_system?.trim() || '',
        founded_year: profileDetails?.founded_year?.trim() || '',
        created_at: new Date().toISOString(),
      };

      // 3. Reset records to empty for new farm account
      setGoats([]);
      setBreeding([]);
      setHealth([]);
      setSales([]);
      setExpenses([]);
      setWorkers([]);
      setMilk([]);
      setRecordsLoaded(true);

      // 4. Directly activate and log in the user immediately
      setFirebaseUser(fbUser);
      setIsFirebaseActive(true);
      setUser(newProfile);
      localStorage.setItem('sgm_user', JSON.stringify(newProfile));

      // 5. Store user_profile in Firebase Realtime Database in background
      withTimeout(
        set(ref(rtdb, `users/${fbUser.uid}/user_profile`), {
          ...newProfile,
          email_verified: true,
          is_activated: true,
          updated_at: new Date().toISOString(),
        }),
        2500,
        null
      ).catch(e => console.warn('Could not auto-write profile to RTDB:', e));

      return { success: true };
    } catch (err: any) {
      console.warn('Signup error:', err);
      let userFriendlyMessage = err.message || 'Failed to create account';
      if (err.code === 'auth/email-already-in-use') {
        userFriendlyMessage = 'An account with this email address already exists. Please sign in or reset your password.';
      } else if (err.code === 'auth/weak-password') {
        userFriendlyMessage = 'Password must meet security policies: 6+ chars, uppercase, lowercase, number, and special character.';
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMessage = 'Please enter a valid email address.';
      }
      return { success: false, error: userFriendlyMessage };
    }
  };

  const checkActivationStatus = async (targetEmail?: string): Promise<{ activated: boolean; emailVerified: boolean }> => {
    try {
      const email = (targetEmail || auth.currentUser?.email || '').trim().toLowerCase();
      if (!email && !auth.currentUser) return { activated: false, emailVerified: false };

      if (auth.currentUser) {
        await auth.currentUser.reload().catch(() => {});
      }

      const fbUser = auth.currentUser;
      const isEmailVerified = Boolean(fbUser?.emailVerified);
      const isLocalActivated = localStorage.getItem('sgm_activated_' + email) === 'true';
      const urlParams = new URLSearchParams(window.location.search);
      const isUrlActivated = urlParams.get('activated') === 'true' && (!urlParams.get('email') || urlParams.get('email')?.trim().toLowerCase() === email);

      let isRtdbVerified = false;
      if (fbUser) {
        try {
          const snap = await get(ref(rtdb, `users/${fbUser.uid}/user_profile`));
          if (snap.exists() && (snap.val().email_verified === true || snap.val().is_activated === true)) {
            isRtdbVerified = true;
          }
        } catch {
          // ignore
        }
      }

      const activated = isEmailVerified || isLocalActivated || isUrlActivated || isRtdbVerified;
      if (activated && email) {
        localStorage.setItem('sgm_activated_' + email, 'true');
      }

      return { activated, emailVerified: isEmailVerified };
    } catch {
      return { activated: false, emailVerified: false };
    }
  };

  const confirmActivation = async (targetEmail?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const email = (targetEmail || auth.currentUser?.email || '').trim().toLowerCase();
      if (!email && !auth.currentUser) {
        return { success: false, error: 'No account email available to activate.' };
      }

      if (email) {
        localStorage.setItem('sgm_activated_' + email, 'true');
      }

      if (auth.currentUser) {
        await auth.currentUser.reload().catch(() => {});
      }

      const fbUser = auth.currentUser;
      if (fbUser) {
        setFirebaseUser(fbUser);
        setIsFirebaseActive(true);

        let profileName = fbUser.displayName || '';
        const profileRef = ref(rtdb, `users/${fbUser.uid}/user_profile`);
        const profileSnap = await get(profileRef).catch(() => null);

        if (profileSnap && profileSnap.exists()) {
          const val = profileSnap.val();
          profileName = val.farm_name || val.farmName || profileName;
          await set(ref(rtdb, `users/${fbUser.uid}/user_profile/email_verified`), true).catch(() => {});
          await set(ref(rtdb, `users/${fbUser.uid}/user_profile/is_activated`), true).catch(() => {});
        }

        if (!profileName) {
          const prefix = (fbUser.email || email).split('@')[0];
          profileName = prefix.charAt(0).toUpperCase() + prefix.slice(1) + ' Goat Farm';
        }

        const activeProfile: FarmUser = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          farm_name: profileName,
          created_at: profileSnap && profileSnap.exists() && profileSnap.val().created_at
            ? profileSnap.val().created_at
            : new Date().toISOString(),
        };

        setUser(activeProfile);
        localStorage.setItem('sgm_user', JSON.stringify(activeProfile));
        setRecordsLoaded(true);
      }

      return { success: true };
    } catch (err: any) {
      console.warn('confirmActivation error:', err);
      return { success: false, error: err.message || 'Activation failed.' };
    }
  };

  const resendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      }
      return { success: false, error: 'No active session found to resend verification link.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to resend verification email.' };
    }
  };

  const updateFarmProfile = async (updates: Partial<FarmUser>): Promise<{ success: boolean; error?: string }> => {
    try {
      const activeUid = firebaseUser?.uid;
      const current = user || initialFarmUser;
      const merged: FarmUser = {
        ...current,
        ...updates,
        farm_name: updates.farm_name ? updates.farm_name.trim() : current.farm_name,
      };

      setUser(merged);
      localStorage.setItem('sgm_user', JSON.stringify(merged));
      if (activeUid) {
        localStorage.setItem(`sgm_profile_${activeUid}`, JSON.stringify(merged));
      }

      if (activeUid) {
        const payload = {
          farm_name: merged.farm_name,
          email: merged.email,
          owner_name: merged.owner_name || '',
          location: merged.location || '',
          farm_size: merged.farm_size || '',
          primary_breed: merged.primary_breed || '',
          phone: merged.phone || '',
          bio: merged.bio || '',
          production_focus: merged.production_focus || '',
          grazing_system: merged.grazing_system || '',
          founded_year: merged.founded_year || '',
          logo_url: merged.logo_url || '',
          updated_at: new Date().toISOString(),
          created_at: merged.created_at || new Date().toISOString(),
          is_activated: true,
          email_verified: true,
        };

        await Promise.all([
          set(ref(rtdb, `users/${activeUid}/user_profile`), payload),
          set(ref(rtdb, `users/${activeUid}/profile`), payload)
        ]);

        if (firebaseUser && updates.farm_name) {
          try {
            await updateProfile(firebaseUser, { displayName: updates.farm_name.trim() });
          } catch {
            // ignore
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Update profile error:', err);
      return { success: false, error: err.message || 'Failed to update farm profile' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      console.error('Firebase password reset error:', err);
      return { success: false, error: err.message || 'Could not send reset email' };
    }
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem('sgm_is_demo', 'true');
    setUser(initialFarmUser);
    setGoats(initialGoats);
    setBreeding(initialBreeding);
    setHealth(initialHealth);
    setSales(initialSales);
    setExpenses(initialExpenses);
    setWorkers(initialWorkers);
    setMilk(initialMilk);
    setSyncStatus('local_fallback');
    setRecordsLoaded(true);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setFirebaseUser(null);
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('sgm_user');
    localStorage.removeItem('sgm_is_demo');
    setGoats([]);
    setBreeding([]);
    setHealth([]);
    setSales([]);
    setExpenses([]);
    setWorkers([]);
    setMilk([]);
    setSyncStatus('local_fallback');
    setRecordsLoaded(true);
  };

  const refreshFromFirebase = async (): Promise<{ success: boolean; message: string }> => {
    if (!firebaseUser) {
      return { success: false, message: 'No authenticated farm account found. Please sign in first.' };
    }
    try {
      setSyncStatus('connecting');
      const snap = await withTimeout(get(ref(rtdb, `users/${firebaseUser.uid}`)), 6000, null);
      if (snap && snap.exists()) {
        applyDatabaseSnapshot(snap.val(), firebaseUser.uid);
        setSyncStatus('connected');
        setIsFirebaseActive(true);
        setSyncError(null);
        setRecordsLoaded(true);
        setLastSyncedAt(new Date());
        return { success: true, message: 'Database details successfully fetched and updated!' };
      } else {
        setSyncStatus('connected');
        setRecordsLoaded(true);
        return { success: true, message: 'Connected to database! (No stored records found for this account).' };
      }
    } catch (e: any) {
      setSyncStatus('error');
      setSyncError(e.message);
      return { success: false, message: e.message || 'Failed to fetch database details' };
    }
  };

  // Helper to persist records in localStorage as backup
  const persistRecordsLocally = (
    uid: string | null | undefined,
    overrides?: {
      goats?: GoatRecord[];
      breeding?: BreedingRecord[];
      health?: HealthRecord[];
      sales?: SaleRecord[];
      expenses?: ExpenseRecord[];
      workers?: WorkerRecord[];
      milk?: MilkRecord[];
      feeds?: FeedRecord[];
      medications?: MedicationRecord[];
      kid_growth?: KidGrowthRecord[];
    }
  ) => {
    try {
      const key = uid ? `sgm_records_${uid}` : 'sgm_records_offline';
      const payload = {
        goats: overrides?.goats !== undefined ? overrides.goats : goats,
        breeding: overrides?.breeding !== undefined ? overrides.breeding : breeding,
        health: overrides?.health !== undefined ? overrides.health : health,
        sales: overrides?.sales !== undefined ? overrides.sales : sales,
        expenses: overrides?.expenses !== undefined ? overrides.expenses : expenses,
        workers: overrides?.workers !== undefined ? overrides.workers : workers,
        milk: overrides?.milk !== undefined ? overrides.milk : milk,
        feeds: overrides?.feeds !== undefined ? overrides.feeds : feeds,
        medications: overrides?.medications !== undefined ? overrides.medications : medications,
        kid_growth: overrides?.kid_growth !== undefined ? overrides.kid_growth : kidGrowthRecords,
        saved_at: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
      if (overrides?.feeds !== undefined) {
        localStorage.setItem('sgm_feeds', JSON.stringify(overrides.feeds));
      }
      if (overrides?.medications !== undefined) {
        localStorage.setItem('sgm_medications', JSON.stringify(overrides.medications));
      }
      if (overrides?.kid_growth !== undefined) {
        localStorage.setItem('sgm_kid_growth', JSON.stringify(overrides.kid_growth));
      }
    } catch (e) {
      console.warn('LocalStorage backup error:', e);
    }
  };

  // MUTATION ACTIONS (Directly synced to Firebase Realtime Database with instant optimistic local persistence)
  const addGoat = async (data: Omit<GoatRecord, 'id' | 'created_at'>) => {
    const activeUid = firebaseUser?.uid;
    const createdAt = new Date().toISOString();
    let id = 'gt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    if (activeUid) {
      try {
        const goatsRef = ref(rtdb, `users/${activeUid}/records/goats`);
        const newRef = push(goatsRef);
        if (newRef.key) id = newRef.key;
      } catch (err) {
        console.warn('Could not generate Firebase key, using fallback ID:', err);
      }
    }

    const newGoat: GoatRecord = {
      ...data,
      name: data.name || '',
      id,
      created_at: createdAt,
    };

    // Immediate optimistic update
    setGoats(prev => {
      const updated = [newGoat, ...prev];
      persistRecordsLocally(activeUid, { goats: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/goats/${id}`);
        const goatPayload: Record<string, any> = {
          tag_number: newGoat.tag_number,
          name: newGoat.name || '',
          breed: newGoat.breed,
          gender: newGoat.gender,
          dob: newGoat.dob,
          created_at: createdAt,
          weight_kg: newGoat.weight_kg || 45,
          status: newGoat.status || 'Active',
        };
        if (newGoat.photo_url) {
          goatPayload.photo_url = newGoat.photo_url;
        }
        await set(itemRef, goatPayload);
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase addGoat write error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Permission denied on Realtime Database write');
      }
    }
  };

  const updateGoat = async (id: string, updates: Partial<GoatRecord>) => {
    const activeUid = firebaseUser?.uid;
    setGoats(prev => {
      const updated = prev.map(g => (g.id === id ? { ...g, ...updates } : g));
      persistRecordsLocally(activeUid, { goats: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/goats/${id}`);
        const sanitizedUpdates: Record<string, any> = {};
        Object.entries(updates).forEach(([k, v]) => {
          if (v !== undefined) {
            sanitizedUpdates[k] = v;
          } else if (k === 'photo_url') {
            sanitizedUpdates[k] = null;
          }
        });
        await update(itemRef, sanitizedUpdates);
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase updateGoat error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to update goat record in database');
      }
    }
  };

  const bulkUpdateGoats = async (ids: string[], updates: Partial<GoatRecord>) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const activeUid = firebaseUser?.uid;
    setIsSyncing(true);
    setGoats(prev => {
      const updated = prev.map(g => (idSet.has(g.id) ? { ...g, ...updates } : g));
      persistRecordsLocally(activeUid, { goats: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const updatePayload: Record<string, any> = {};
        ids.forEach(id => {
          Object.entries(updates).forEach(([key, val]) => {
            updatePayload[`users/${activeUid}/records/goats/${id}/${key}`] = val;
          });
        });
        await update(ref(rtdb), updatePayload);
        setSyncStatus('connected');
        setSyncError(null);
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.warn('Firebase bulkUpdateGoats error:', err);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(false);
    }
  };

  const bulkDeleteGoats = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const activeUid = firebaseUser?.uid;
    setIsSyncing(true);
    setGoats(prev => {
      const updated = prev.filter(g => !idSet.has(g.id));
      persistRecordsLocally(activeUid, { goats: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const deletePayload: Record<string, any> = {};
        ids.forEach(id => {
          deletePayload[`users/${activeUid}/records/goats/${id}`] = null;
        });
        await update(ref(rtdb), deletePayload);
        setSyncStatus('connected');
        setSyncError(null);
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.warn('Firebase bulkDeleteGoats error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to remove selected goats from database');
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(false);
    }
  };

  const deleteGoat = async (id: string) => {
    const activeUid = firebaseUser?.uid;
    setIsSyncing(true);
    setGoats(prev => {
      const updated = prev.filter(g => g.id !== id);
      persistRecordsLocally(activeUid, { goats: updated });
      return updated;
    });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/goats/${id}`));
        setSyncStatus('connected');
        setSyncError(null);
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.warn('Firebase deleteGoat error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to remove goat from database');
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(false);
    }
  };

  const addBreeding = async (data: Omit<BreedingRecord, 'id'>) => {
    const activeUid = firebaseUser?.uid;
    let id = 'brd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    if (activeUid) {
      try {
        const breedRef = ref(rtdb, `users/${activeUid}/records/breeding`);
        const newRef = push(breedRef);
        if (newRef.key) id = newRef.key;
      } catch (err) {
        console.warn('Could not generate breed key:', err);
      }
    }

    const newRecord: BreedingRecord = {
      ...data,
      id,
      gestation_days: data.gestation_days || 150,
      status: data.status || 'Active',
    };

    setBreeding(prev => {
      const updated = [newRecord, ...prev];
      persistRecordsLocally(activeUid, { breeding: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/breeding/${id}`);
        await set(itemRef, {
          female_id: newRecord.female_id,
          male_id: newRecord.male_id,
          mating_date: newRecord.mating_date,
          expected_birth: newRecord.expected_birth,
          gestation_days: newRecord.gestation_days,
          status: newRecord.status,
          notes: newRecord.notes || '',
          actual_birth_date: newRecord.actual_birth_date || '',
          kids_born: newRecord.kids_born != null ? newRecord.kids_born : 0,
        });
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase addBreeding error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to write breeding record to database');
      }
    }
  };

  const updateBreeding = async (id: string, updates: Partial<BreedingRecord>) => {
    const activeUid = firebaseUser?.uid;
    setBreeding(prev => {
      const updated = prev.map(b => (b.id === id ? { ...b, ...updates } : b));
      persistRecordsLocally(activeUid, { breeding: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/breeding/${id}`);
        const snap = await get(itemRef);
        if (snap.exists()) {
          await set(itemRef, { ...snap.val(), ...updates });
        } else {
          await set(itemRef, updates);
        }
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase updateBreeding error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to update breeding record');
      }
    }
  };

  const deleteBreeding = async (id: string) => {
    const activeUid = firebaseUser?.uid;
    setBreeding(prev => {
      const updated = prev.filter(b => b.id !== id);
      persistRecordsLocally(activeUid, { breeding: updated });
      return updated;
    });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/breeding/${id}`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase deleteBreeding error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to delete breeding record');
      }
    }
  };

  const addHealth = async (data: Omit<HealthRecord, 'id'>) => {
    const activeUid = firebaseUser?.uid;
    let id = 'hlt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    if (activeUid) {
      try {
        const healthRef = ref(rtdb, `users/${activeUid}/records/health`);
        const newRef = push(healthRef);
        if (newRef.key) id = newRef.key;
      } catch (err) {
        console.warn('Could not generate health key:', err);
      }
    }

    const newRecord: HealthRecord = {
      ...data,
      id,
      checkup_type: data.checkup_type || 'Routine',
      status: data.status || 'Healthy',
    };

    setHealth(prev => {
      const updated = [newRecord, ...prev];
      persistRecordsLocally(activeUid, { health: updated });
      return updated;
    });

    // Automatically update goat status based on health record
    // Critical / Under Treatment -> Quarantine; Healthy / Recovered -> Active (if was Quarantine)
    // Note: As explicitly requested, pregnancy status is NOT automated and must be changed manually.
    let matchedHealthGoatId: string | null = null;
    let nextGoatStatus: 'Quarantine' | 'Active' | null = null;

    if (newRecord.status === 'Under Treatment' || newRecord.status === 'Critical') {
      nextGoatStatus = 'Quarantine';
    } else if (newRecord.status === 'Healthy' || newRecord.status === 'Recovered') {
      nextGoatStatus = 'Active';
    }

    if (nextGoatStatus) {
      setGoats(prev => {
        const updated = prev.map(g => {
          if (
            g.tag_number.toUpperCase() === newRecord.goat_id.trim().toUpperCase() ||
            g.id === newRecord.goat_id.trim()
          ) {
            matchedHealthGoatId = g.id;
            // Never overwrite Sold status
            if (g.status === 'Sold') return g;
            // Only set to Active if goat was in Quarantine (preserve Pregnant status!)
            if (nextGoatStatus === 'Active' && g.status !== 'Quarantine') return g;
            return { ...g, status: nextGoatStatus! };
          }
          return g;
        });
        persistRecordsLocally(activeUid, { goats: updated });
        return updated;
      });
    }

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/health/${id}`);
        await set(itemRef, {
          goat_id: newRecord.goat_id,
          condition: newRecord.condition,
          treatment: newRecord.treatment,
          checkup_date: newRecord.checkup_date,
          checkup_type: newRecord.checkup_type,
          status: newRecord.status,
          vet_name: newRecord.vet_name || '',
          is_pregnant: Boolean(newRecord.is_pregnant),
          fetal_age_days: newRecord.fetal_age_days || null,
          custom_gestation_days: newRecord.custom_gestation_days || null,
        });

        if (matchedHealthGoatId && nextGoatStatus) {
          try {
            await update(ref(rtdb, `users/${activeUid}/records/goats/${matchedHealthGoatId}`), {
              status: nextGoatStatus,
            });
          } catch (e) {
            console.warn('Firebase goat status update on health record error:', e);
          }
        }

        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase addHealth error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to save health record to database');
      }
    }
  };

  const deleteHealth = async (id: string) => {
    const activeUid = firebaseUser?.uid;
    setHealth(prev => {
      const updated = prev.filter(h => h.id !== id);
      persistRecordsLocally(activeUid, { health: updated });
      return updated;
    });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/health/${id}`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase deleteHealth error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to delete health record');
      }
    }
  };

  const addSale = async (data: Omit<SaleRecord, 'id'>) => {
    const activeUid = firebaseUser?.uid;
    let id = 'sale-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    if (activeUid) {
      try {
        const salesRef = ref(rtdb, `users/${activeUid}/records/sales`);
        const newRef = push(salesRef);
        if (newRef.key) id = newRef.key;
      } catch (err) {
        console.warn('Could not generate sale key:', err);
      }
    }

    const newRecord: SaleRecord = {
      ...data,
      id,
    };

    setSales(prev => {
      const updated = [newRecord, ...prev];
      persistRecordsLocally(activeUid, { sales: updated });
      return updated;
    });

    // Automatically update goat status to 'Sold' when a sale record has been made
    let matchedSaleGoatId: string | null = null;
    const cleanGoatInput = newRecord.goat_id.trim().toUpperCase();
    setGoats(prev => {
      const updated = prev.map(g => {
        if (
          g.tag_number.toUpperCase() === cleanGoatInput ||
          g.id === newRecord.goat_id.trim() ||
          (g.name && g.name.trim().toUpperCase() === cleanGoatInput)
        ) {
          matchedSaleGoatId = g.id;
          return { ...g, status: 'Sold' as const };
        }
        return g;
      });
      persistRecordsLocally(activeUid, { goats: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/sales/${id}`);
        await set(itemRef, {
          goat_id: newRecord.goat_id,
          buyer_name: newRecord.buyer_name,
          price: newRecord.price,
          sale_date: newRecord.sale_date,
        });

        if (matchedSaleGoatId) {
          try {
            await update(ref(rtdb, `users/${activeUid}/records/goats/${matchedSaleGoatId}`), {
              status: 'Sold',
            });
          } catch (e) {
            console.warn('Firebase goat status update on sale record error:', e);
          }
        }

        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase addSale error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to save sale record to database');
      }
    }
  };

  const deleteSale = async (id: string) => {
    const activeUid = firebaseUser?.uid;
    setSales(prev => {
      const updated = prev.filter(s => s.id !== id);
      persistRecordsLocally(activeUid, { sales: updated });
      return updated;
    });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/sales/${id}`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase deleteSale error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to delete sale record');
      }
    }
  };

  const addExpense = async (data: Omit<ExpenseRecord, 'id'>) => {
    const activeUid = firebaseUser?.uid;
    let id = 'exp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    if (activeUid) {
      try {
        const expensesRef = ref(rtdb, `users/${activeUid}/records/expenses`);
        const newRef = push(expensesRef);
        if (newRef.key) id = newRef.key;
      } catch (err) {
        console.warn('Could not generate expense key:', err);
      }
    }

    const newRecord: ExpenseRecord = {
      ...data,
      id,
    };

    setExpenses(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('sgm_expenses', JSON.stringify(updated));
      persistRecordsLocally(activeUid, { expenses: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/expenses/${id}`);
        await set(itemRef, {
          category: newRecord.category,
          title: newRecord.title,
          amount: newRecord.amount,
          date: newRecord.date,
          notes: newRecord.notes || '',
          receipt_number: newRecord.receipt_number || '',
        });
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase addExpense error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to save expense record to database');
      }
    }
  };

  const deleteExpense = async (id: string) => {
    const activeUid = firebaseUser?.uid;
    setExpenses(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem('sgm_expenses', JSON.stringify(updated));
      persistRecordsLocally(activeUid, { expenses: updated });
      return updated;
    });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/expenses/${id}`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase deleteExpense error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to delete expense record');
      }
    }
  };

  const addWorker = async (data: Omit<WorkerRecord, 'id'>) => {
    const activeUid = firebaseUser?.uid;
    let id = 'wrk-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    if (activeUid) {
      try {
        const workersRef = ref(rtdb, `users/${activeUid}/records/workers`);
        const newRef = push(workersRef);
        if (newRef.key) id = newRef.key;
      } catch (err) {
        console.warn('Could not generate worker key:', err);
      }
    }

    const newRecord: WorkerRecord = {
      ...data,
      id,
    };

    setWorkers(prev => {
      const updated = [newRecord, ...prev];
      persistRecordsLocally(activeUid, { workers: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/workers/${id}`);
        await set(itemRef, {
          full_name: newRecord.full_name,
          phone: newRecord.phone,
          location: newRecord.location,
        });
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase addWorker error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to save worker record to database');
      }
    }
  };

  const deleteWorker = async (id: string) => {
    const activeUid = firebaseUser?.uid;
    setWorkers(prev => {
      const updated = prev.filter(w => w.id !== id);
      persistRecordsLocally(activeUid, { workers: updated });
      return updated;
    });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/workers/${id}`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase deleteWorker error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to delete worker record');
      }
    }
  };

  const addMilk = async (data: Omit<MilkRecord, 'id'>) => {
    const activeUid = firebaseUser?.uid;
    let id = 'mlk-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    if (activeUid) {
      try {
        const milkRef = ref(rtdb, `users/${activeUid}/records/milk`);
        const newRef = push(milkRef);
        if (newRef.key) id = newRef.key;
      } catch (err) {
        console.warn('Could not generate milk key:', err);
      }
    }

    const newRecord: MilkRecord = {
      ...data,
      id,
    };

    setMilk(prev => {
      const updated = [newRecord, ...prev];
      persistRecordsLocally(activeUid, { milk: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/milk/${id}`);
        await set(itemRef, {
          goat_id: newRecord.goat_id,
          date: newRecord.date,
          morning_liters: newRecord.morning_liters,
          evening_liters: newRecord.evening_liters,
          total_liters: newRecord.total_liters,
        });
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase addMilk error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to save milk record to database');
      }
    }
  };

  const deleteMilk = async (id: string) => {
    const activeUid = firebaseUser?.uid;
    setMilk(prev => {
      const updated = prev.filter(m => m.id !== id);
      persistRecordsLocally(activeUid, { milk: updated });
      return updated;
    });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/milk/${id}`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Delete milk error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to delete milk record');
      }
    }
  };

  // FEED INVENTORY ACTIONS
  const addFeed = async (data: Omit<FeedRecord, 'id'>) => {
    const activeUid = firebaseUser?.uid;
    let id = 'feed-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    if (activeUid) {
      try {
        const feedsRef = ref(rtdb, `users/${activeUid}/records/feeds`);
        const newRef = push(feedsRef);
        if (newRef.key) id = newRef.key;
      } catch (err) {
        console.warn('Could not generate feed key:', err);
      }
    }

    const newRecord: FeedRecord = {
      ...data,
      id,
    };

    setFeeds(prev => {
      const updated = [newRecord, ...prev];
      persistRecordsLocally(activeUid, { feeds: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/feeds/${id}`);
        // Ensure no undefined values are sent to Firebase Realtime Database
        const payloadToSave: Record<string, any> = {
          name: newRecord.name || '',
          category: newRecord.category || 'Fodder & Hay',
          quantity: Number(newRecord.quantity) || 0,
          unit: newRecord.unit || 'bales',
          min_threshold: Number(newRecord.min_threshold) || 0,
          last_restocked: newRecord.last_restocked || new Date().toISOString().split('T')[0],
          notes: newRecord.notes || '',
          supplier: newRecord.supplier || '',
          storage_location: newRecord.storage_location || '',
          expiry_date: newRecord.expiry_date || '',
        };
        if (newRecord.cost_per_unit !== undefined && newRecord.cost_per_unit !== null && !isNaN(Number(newRecord.cost_per_unit))) {
          payloadToSave.cost_per_unit = Number(newRecord.cost_per_unit);
        }
        await set(itemRef, payloadToSave);
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase addFeed error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to save feed record to database');
      }
    }
  };

  const updateFeed = async (id: string, updates: Partial<FeedRecord>) => {
    const activeUid = firebaseUser?.uid;

    setFeeds(prev => {
      const updated = prev.map(f => (f.id === id ? { ...f, ...updates } : f));
      persistRecordsLocally(activeUid, { feeds: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/feeds/${id}`);
        // Filter out undefined values to avoid RTDB crashes
        const cleanUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) {
            cleanUpdates[k] = v;
          }
        }
        await update(itemRef, cleanUpdates);
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase updateFeed error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to update feed record');
      }
    }
  };

  const deleteFeed = async (id: string) => {
    const activeUid = firebaseUser?.uid;
    setFeeds(prev => {
      const updated = prev.filter(f => f.id !== id);
      localStorage.setItem('sgm_feeds', JSON.stringify(updated));
      persistRecordsLocally(activeUid, { feeds: updated });
      return updated;
    });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/feeds/${id}`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Delete feed error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to delete feed record');
      }
    }
  };

  const clearAllFeeds = async () => {
    const activeUid = firebaseUser?.uid;
    setFeeds([]);
    localStorage.setItem('sgm_feeds', JSON.stringify([]));
    persistRecordsLocally(activeUid, { feeds: [] });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/feeds`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Clear all feeds error:', err);
      }
    }
  };

  const consumeFeed = async (id: string, amount: number, notes?: string) => {
    const target = feeds.find(f => f.id === id);
    if (!target) return;
    const newQty = Math.max(0, target.quantity - amount);
    await updateFeed(id, {
      quantity: newQty,
      notes: notes ? `${notes} (Used ${amount} ${target.unit})` : target.notes || '',
    });
  };

  const restockFeed = async (id: string, amount: number, cost?: number) => {
    const target = feeds.find(f => f.id === id);
    if (!target) return;
    const newQty = target.quantity + amount;
    const now = new Date().toISOString().split('T')[0];
    const updatePayload: Partial<FeedRecord> = {
      quantity: newQty,
      last_restocked: now,
    };
    if (cost !== undefined && cost !== null && !isNaN(cost)) {
      updatePayload.cost_per_unit = cost;
    }
    await updateFeed(id, updatePayload);

    // Automatically record an expense if cost was provided
    if (cost && cost > 0) {
      await addExpense({
        category: 'Feed',
        title: `Restock: ${target.name} (${amount} ${target.unit})`,
        amount: Math.round(amount * cost),
        date: now,
        notes: `Automated inventory restock ledger. Supplier: ${target.supplier || 'N/A'}`
      });
    }
  };

  // MEDICATION INVENTORY ACTIONS
  const addMedication = async (data: Omit<MedicationRecord, 'id'>) => {
    const activeUid = firebaseUser?.uid;
    let id = 'med-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    if (activeUid) {
      try {
        const medsRef = ref(rtdb, `users/${activeUid}/records/medications`);
        const newRef = push(medsRef);
        if (newRef.key) id = newRef.key;
      } catch (err) {
        console.warn('Could not generate medication key:', err);
      }
    }

    const newRecord: MedicationRecord = {
      ...data,
      id,
    };

    setMedications(prev => {
      const updated = [newRecord, ...prev];
      persistRecordsLocally(activeUid, { medications: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/medications/${id}`);
        const payloadToSave: Record<string, any> = {
          name: newRecord.name || '',
          category: newRecord.category || 'Antibiotics',
          quantity: Number(newRecord.quantity) || 0,
          unit: newRecord.unit || 'ml',
          min_threshold: Number(newRecord.min_threshold) || 0,
          expiry_date: newRecord.expiry_date || '',
          batch_number: newRecord.batch_number || '',
          target_diseases: newRecord.target_diseases || '',
          storage_requirements: newRecord.storage_requirements || '',
          supplier: newRecord.supplier || '',
          notes: newRecord.notes || '',
          last_restocked: newRecord.last_restocked || new Date().toISOString().split('T')[0],
        };
        await set(itemRef, payloadToSave);
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase addMedication error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to save medication record to database');
      }
    }
  };

  const updateMedication = async (id: string, updates: Partial<MedicationRecord>) => {
    const activeUid = firebaseUser?.uid;

    setMedications(prev => {
      const updated = prev.map(m => (m.id === id ? { ...m, ...updates } : m));
      persistRecordsLocally(activeUid, { medications: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/medications/${id}`);
        const cleanUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) {
            cleanUpdates[k] = v;
          }
        }
        await update(itemRef, cleanUpdates);
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase updateMedication error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to update medication record');
      }
    }
  };

  const deleteMedication = async (id: string) => {
    const activeUid = firebaseUser?.uid;
    setMedications(prev => {
      const updated = prev.filter(m => m.id !== id);
      localStorage.setItem('sgm_medications', JSON.stringify(updated));
      persistRecordsLocally(activeUid, { medications: updated });
      return updated;
    });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/medications/${id}`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Delete medication error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to delete medication record');
      }
    }
  };

  const clearAllMedications = async () => {
    const activeUid = firebaseUser?.uid;
    setMedications([]);
    localStorage.setItem('sgm_medications', JSON.stringify([]));
    persistRecordsLocally(activeUid, { medications: [] });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/medications`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Clear all medications error:', err);
      }
    }
  };

  const consumeMedication = async (id: string, amount: number, goatId?: string, notes?: string) => {
    const target = medications.find(m => m.id === id);
    if (!target) return;
    const newQty = Math.max(0, target.quantity - amount);
    await updateMedication(id, {
      quantity: newQty,
      notes: notes ? `${notes} (Administered ${amount} ${target.unit}${goatId ? ' to goat ' + goatId : ''})` : target.notes,
    });
  };

  const restockMedication = async (id: string, amount: number) => {
    const target = medications.find(m => m.id === id);
    if (!target) return;
    const newQty = target.quantity + amount;
    const now = new Date().toISOString().split('T')[0];
    await updateMedication(id, {
      quantity: newQty,
      last_restocked: now,
    });
  };

  // KID GROWTH & WEANING ACTIONS
  const addKidGrowthRecord = async (data: Omit<KidGrowthRecord, 'id' | 'created_at'>) => {
    const activeUid = firebaseUser?.uid;
    const createdAt = new Date().toISOString();
    let id = 'kid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    if (activeUid) {
      try {
        const kidsRef = ref(rtdb, `users/${activeUid}/records/kid_growth`);
        const newRef = push(kidsRef);
        if (newRef.key) id = newRef.key;
      } catch (err) {
        console.warn('Could not generate kid_growth key:', err);
      }
    }

    // Auto-calculate ADG if weaning weight or 30-day weight is provided
    let calculatedAdg = data.adg_grams_per_day;
    if (!calculatedAdg) {
      if (data.weaning_weight_kg && data.birth_weight_kg && data.weaning_date && data.dob) {
        const days = Math.max(1, Math.round((new Date(data.weaning_date).getTime() - new Date(data.dob).getTime()) / (1000 * 60 * 60 * 24)));
        calculatedAdg = Math.round(((data.weaning_weight_kg - data.birth_weight_kg) / days) * 1000);
      } else if (data.thirty_day_weight_kg && data.birth_weight_kg) {
        calculatedAdg = Math.round(((data.thirty_day_weight_kg - data.birth_weight_kg) / 30) * 1000);
      }
    }

    const newRecord: KidGrowthRecord = {
      ...data,
      adg_grams_per_day: calculatedAdg,
      id,
      created_at: createdAt,
    };

    setKidGrowthRecords(prev => {
      const updated = [newRecord, ...prev];
      persistRecordsLocally(activeUid, { kid_growth: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const itemRef = ref(rtdb, `users/${activeUid}/records/kid_growth/${id}`);
        await set(itemRef, newRecord);
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase addKidGrowthRecord error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to save kid growth record to database');
      }
    }
  };

  const updateKidGrowthRecord = async (id: string, updates: Partial<KidGrowthRecord>) => {
    const activeUid = firebaseUser?.uid;

    setKidGrowthRecords(prev => {
      const updated = prev.map(k => {
        if (k.id !== id) return k;
        const merged = { ...k, ...updates };
        if (merged.weaning_weight_kg && merged.birth_weight_kg && merged.weaning_date && merged.dob && !updates.adg_grams_per_day) {
          const days = Math.max(1, Math.round((new Date(merged.weaning_date).getTime() - new Date(merged.dob).getTime()) / (1000 * 60 * 60 * 24)));
          merged.adg_grams_per_day = Math.round(((merged.weaning_weight_kg - merged.birth_weight_kg) / days) * 1000);
        }
        return merged;
      });
      persistRecordsLocally(activeUid, { kid_growth: updated });
      return updated;
    });

    if (activeUid) {
      try {
        const targetRef = ref(rtdb, `users/${activeUid}/records/kid_growth/${id}`);
        await update(targetRef, updates);
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Firebase updateKidGrowthRecord error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to update kid growth record');
      }
    }
  };

  const deleteKidGrowthRecord = async (id: string) => {
    const activeUid = firebaseUser?.uid;

    setKidGrowthRecords(prev => {
      const updated = prev.filter(k => k.id !== id);
      persistRecordsLocally(activeUid, { kid_growth: updated });
      return updated;
    });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/kid_growth/${id}`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Delete kid growth error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to delete kid growth record');
      }
    }
  };

  const clearAllKidGrowthRecords = async () => {
    const activeUid = firebaseUser?.uid;
    setKidGrowthRecords([]);
    localStorage.setItem('sgm_kid_growth', JSON.stringify([]));
    persistRecordsLocally(activeUid, { kid_growth: [] });

    if (activeUid) {
      try {
        await remove(ref(rtdb, `users/${activeUid}/records/kid_growth`));
        setSyncStatus('connected');
        setSyncError(null);
      } catch (err: any) {
        console.warn('Clear all kid growth error:', err);
      }
    }
  };

  const importBatchRecords = async (records: {
    goats?: Omit<GoatRecord, 'id' | 'created_at'>[];
    breeding?: Omit<BreedingRecord, 'id'>[];
    health?: Omit<HealthRecord, 'id'>[];
    milk?: Omit<MilkRecord, 'id'>[];
    sales?: Omit<SaleRecord, 'id'>[];
    expenses?: Omit<ExpenseRecord, 'id'>[];
    workers?: Omit<WorkerRecord, 'id'>[];
  }): Promise<{ totalImported: number }> => {
    let count = 0;
    const activeUid = firebaseUser?.uid;
    const timestamp = new Date().toISOString();

    // 1. Goats
    if (records.goats && records.goats.length > 0) {
      const newGoatsList: GoatRecord[] = [];
      for (const g of records.goats) {
        count++;
        const id = 'gt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const newGoat: GoatRecord = {
          ...g,
          name: g.name || '',
          id,
          created_at: timestamp,
        };
        newGoatsList.push(newGoat);

        if (activeUid) {
          try {
            const goatsRef = ref(rtdb, `users/${activeUid}/records/goats/${id}`);
            await set(goatsRef, {
              tag_number: newGoat.tag_number,
              name: newGoat.name || '',
              breed: newGoat.breed,
              gender: newGoat.gender,
              dob: newGoat.dob,
              created_at: timestamp,
              weight_kg: newGoat.weight_kg || 45,
              status: newGoat.status || 'Active',
            });
          } catch (err: any) {
            console.warn('Batch goat cloud write fallback:', err);
          }
        }
      }
      setGoats(prev => {
        const updated = [...newGoatsList, ...prev];
        persistRecordsLocally(activeUid, { goats: updated });
        return updated;
      });
    }

    // 2. Breeding
    if (records.breeding && records.breeding.length > 0) {
      const newBreedingList: BreedingRecord[] = [];
      for (const b of records.breeding) {
        count++;
        const id = 'brd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const newBrd: BreedingRecord = {
          ...b,
          id,
          gestation_days: b.gestation_days || 150,
          status: b.status || 'Active',
        };
        newBreedingList.push(newBrd);

        if (activeUid) {
          try {
            const breedRef = ref(rtdb, `users/${activeUid}/records/breeding/${id}`);
            await set(breedRef, {
              female_id: newBrd.female_id,
              male_id: newBrd.male_id,
              mating_date: newBrd.mating_date,
              expected_birth: newBrd.expected_birth,
              gestation_days: newBrd.gestation_days,
              status: newBrd.status,
              notes: newBrd.notes || '',
              actual_birth_date: newBrd.actual_birth_date || '',
              kids_born: newBrd.kids_born != null ? newBrd.kids_born : 0,
            });
          } catch (err) {
            console.warn('Batch breeding cloud write fallback:', err);
          }
        }
      }
      setBreeding(prev => {
        const updated = [...newBreedingList, ...prev];
        persistRecordsLocally(activeUid, { breeding: updated });
        return updated;
      });
    }

    // 3. Health
    if (records.health && records.health.length > 0) {
      const newHealthList: HealthRecord[] = [];
      for (const h of records.health) {
        count++;
        const id = 'hlth-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const newH: HealthRecord = {
          ...h,
          id,
          checkup_type: h.checkup_type || 'Routine',
          status: h.status || 'Healthy',
        };
        newHealthList.push(newH);

        if (activeUid) {
          try {
            const healthRef = ref(rtdb, `users/${activeUid}/records/health/${id}`);
            await set(healthRef, {
              goat_id: newH.goat_id,
              condition: newH.condition,
              treatment: newH.treatment,
              checkup_date: newH.checkup_date,
              checkup_type: newH.checkup_type,
              status: newH.status,
              vet_name: newH.vet_name || '',
              is_pregnant: Boolean(newH.is_pregnant),
              fetal_age_days: newH.fetal_age_days || null,
              custom_gestation_days: newH.custom_gestation_days || null,
            });
          } catch (err) {
            console.warn('Batch health cloud write fallback:', err);
          }
        }
      }
      setHealth(prev => {
        const updated = [...newHealthList, ...prev];
        persistRecordsLocally(activeUid, { health: updated });
        return updated;
      });
    }

    // 4. Milk
    if (records.milk && records.milk.length > 0) {
      const newMilkList: MilkRecord[] = [];
      for (const m of records.milk) {
        count++;
        const id = 'mlk-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const newM: MilkRecord = {
          ...m,
          id,
        };
        newMilkList.push(newM);

        if (activeUid) {
          try {
            const milkRef = ref(rtdb, `users/${activeUid}/records/milk/${id}`);
            await set(milkRef, {
              goat_id: newM.goat_id,
              date: newM.date,
              morning_liters: newM.morning_liters,
              evening_liters: newM.evening_liters,
              total_liters: newM.total_liters,
            });
          } catch (err) {
            console.warn('Batch milk cloud write fallback:', err);
          }
        }
      }
      setMilk(prev => {
        const updated = [...newMilkList, ...prev];
        persistRecordsLocally(activeUid, { milk: updated });
        return updated;
      });
    }

    // 5. Sales
    if (records.sales && records.sales.length > 0) {
      const newSalesList: SaleRecord[] = [];
      for (const s of records.sales) {
        count++;
        const id = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const newS: SaleRecord = { ...s, id };
        newSalesList.push(newS);

        if (activeUid) {
          try {
            const saleRef = ref(rtdb, `users/${activeUid}/records/sales/${id}`);
            await set(saleRef, newS);
          } catch (err) {
            console.warn('Batch sale write fallback:', err);
          }
        }
      }
      setSales(prev => {
        const updated = [...newSalesList, ...prev];
        persistRecordsLocally(activeUid, { sales: updated });
        return updated;
      });
    }

    // 6. Expenses
    if (records.expenses && records.expenses.length > 0) {
      const newExpensesList: ExpenseRecord[] = [];
      for (const e of records.expenses) {
        count++;
        const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const newE: ExpenseRecord = { ...e, id };
        newExpensesList.push(newE);

        if (activeUid) {
          try {
            const expRef = ref(rtdb, `users/${activeUid}/records/expenses/${id}`);
            await set(expRef, newE);
          } catch (err) {
            console.warn('Batch expense write fallback:', err);
          }
        }
      }
      setExpenses(prev => {
        const updated = [...newExpensesList, ...prev];
        persistRecordsLocally(activeUid, { expenses: updated });
        return updated;
      });
    }

    // 7. Workers
    if (records.workers && records.workers.length > 0) {
      const newWorkersList: WorkerRecord[] = [];
      for (const w of records.workers) {
        count++;
        const id = `wrk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const newW: WorkerRecord = { ...w, id };
        newWorkersList.push(newW);

        if (activeUid) {
          try {
            const wrkRef = ref(rtdb, `users/${activeUid}/records/workers/${id}`);
            await set(wrkRef, newW);
          } catch (err) {
            console.warn('Batch worker write fallback:', err);
          }
        }
      }
      setWorkers(prev => {
        const updated = [...newWorkersList, ...prev];
        persistRecordsLocally(activeUid, { workers: updated });
        return updated;
      });
    }

    return { totalImported: count };
  };

  // Synchronize all currently displayed/loaded records to Firebase Realtime Database
  const syncAllCurrentRecordsToFirebase = async (): Promise<{ success: boolean; message: string }> => {
    const activeUid = firebaseUser?.uid;
    if (!activeUid) {
      return { success: false, message: 'Please log in with your farm account first to sync data.' };
    }

    try {
      setSyncStatus('connecting');
      const recordsRef = ref(rtdb, `users/${activeUid}/records`);
      const goatsObj: Record<string, any> = {};
      goats.forEach(g => {
        goatsObj[g.id] = {
          tag_number: g.tag_number,
          name: g.name || '',
          breed: g.breed,
          gender: g.gender,
          dob: g.dob,
          created_at: g.created_at,
          weight_kg: g.weight_kg || 45,
          status: g.status || 'Active',
        };
      });

      const breedingObj: Record<string, any> = {};
      breeding.forEach(b => {
        breedingObj[b.id] = {
          female_id: b.female_id,
          male_id: b.male_id,
          mating_date: b.mating_date,
          expected_birth: b.expected_birth,
          gestation_days: b.gestation_days || 150,
          status: b.status || 'Active',
          notes: b.notes || '',
          actual_birth_date: b.actual_birth_date || '',
          kids_born: b.kids_born != null ? b.kids_born : 0,
        };
      });

      const healthObj: Record<string, any> = {};
      health.forEach(h => {
        healthObj[h.id] = {
          goat_id: h.goat_id,
          condition: h.condition,
          treatment: h.treatment,
          checkup_date: h.checkup_date,
          checkup_type: h.checkup_type || 'Routine',
          status: h.status || 'Healthy',
          is_pregnant: h.is_pregnant || false,
          fetal_age_days: h.fetal_age_days || null,
          custom_gestation_days: h.custom_gestation_days || null,
          vet_name: h.vet_name || '',
        };
      });

      const salesObj: Record<string, any> = {};
      sales.forEach(s => {
        salesObj[s.id] = {
          goat_id: s.goat_id,
          buyer_name: s.buyer_name,
          price: s.price,
          sale_date: s.sale_date,
        };
      });

      const expensesObj: Record<string, any> = {};
      expenses.forEach(e => {
        expensesObj[e.id] = {
          category: e.category,
          title: e.title,
          amount: e.amount,
          date: e.date,
          notes: e.notes || '',
          receipt_number: e.receipt_number || '',
        };
      });

      const workersObj: Record<string, any> = {};
      workers.forEach(w => {
        workersObj[w.id] = {
          full_name: w.full_name,
          phone: w.phone,
          location: w.location,
        };
      });

      const milkObj: Record<string, any> = {};
      milk.forEach(m => {
        milkObj[m.id] = {
          goat_id: m.goat_id,
          date: m.date,
          morning_liters: m.morning_liters,
          evening_liters: m.evening_liters,
          total_liters: m.total_liters,
        };
      });

      const feedsObj: Record<string, any> = {};
      feeds.forEach(f => {
        feedsObj[f.id] = f;
      });

      const medicationsObj: Record<string, any> = {};
      medications.forEach(m => {
        medicationsObj[m.id] = m;
      });

      const kidGrowthObj: Record<string, any> = {};
      kidGrowthRecords.forEach(k => {
        kidGrowthObj[k.id] = k;
      });

      await set(recordsRef, {
        goats: goatsObj,
        breeding: breedingObj,
        health: healthObj,
        sales: salesObj,
        expenses: expensesObj,
        workers: workersObj,
        milk: milkObj,
        feeds: feedsObj,
        medications: medicationsObj,
        kid_growth: kidGrowthObj,
      });

      // Also ensure full profile is pushed to both user_profile and profile paths
      const profileData = {
        uid: user?.uid || activeUid,
        farm_name: user?.farm_name || 'My Goat Farm',
        email: user?.email || firebaseUser.email || '',
        owner_name: user?.owner_name || '',
        location: user?.location || '',
        farm_size: user?.farm_size || '',
        primary_breed: user?.primary_breed || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        production_focus: user?.production_focus || '',
        grazing_system: user?.grazing_system || '',
        founded_year: user?.founded_year || '',
        logo_url: user?.logo_url || '',
        created_at: user?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_activated: true,
        email_verified: true,
      };

      await Promise.all([
        set(ref(rtdb, `users/${activeUid}/user_profile`), profileData),
        set(ref(rtdb, `users/${activeUid}/profile`), profileData)
      ]);

      if (user) {
        localStorage.setItem(`sgm_profile_${activeUid}`, JSON.stringify(user));
      }

      setSyncStatus('connected');
      setSyncError(null);
      setLastSyncedAt(new Date());
      return { success: true, message: 'All farm records & profile successfully synchronized to Realtime Database!' };
    } catch (err: any) {
      console.error('syncAllCurrentRecordsToFirebase error:', err);
      setSyncStatus('error');
      setSyncError(err.message || 'Failed to sync records to database');
      return { success: false, message: err.message || 'Database write error' };
    }
  };

  // Seed initial sample data to Firebase for the current logged-in account
  const pushSeedDataToFirebase = async (): Promise<{ success: boolean; message: string }> => {
    const activeUid = firebaseUser?.uid;
    if (!activeUid) {
      return { success: false, message: 'Please log in with your farm account first to sync data.' };
    }

    try {
      const recordsRef = ref(rtdb, `users/${activeUid}/records`);
      const goatsObj: Record<string, any> = {};
      initialGoats.forEach(g => {
        goatsObj[g.id] = {
          tag_number: g.tag_number,
          breed: g.breed,
          gender: g.gender,
          dob: g.dob,
          created_at: g.created_at,
          weight_kg: g.weight_kg || 45,
          status: g.status || 'Active',
        };
      });

      const breedingObj: Record<string, any> = {};
      initialBreeding.forEach(b => {
        breedingObj[b.id] = {
          female_id: b.female_id,
          male_id: b.male_id,
          mating_date: b.mating_date,
          expected_birth: b.expected_birth,
          gestation_days: b.gestation_days || 150,
          status: b.status || 'Active',
          notes: b.notes || '',
        };
      });

      const healthObj: Record<string, any> = {};
      initialHealth.forEach(h => {
        healthObj[h.id] = {
          goat_id: h.goat_id,
          condition: h.condition,
          treatment: h.treatment,
          checkup_date: h.checkup_date,
          checkup_type: h.checkup_type || 'Routine',
          is_pregnant: h.is_pregnant || false,
          fetal_age_days: h.fetal_age_days || null,
          custom_gestation_days: h.custom_gestation_days || null,
          vet_name: h.vet_name || '',
        };
      });

      const salesObj: Record<string, any> = {};
      initialSales.forEach(s => {
        salesObj[s.id] = {
          goat_id: s.goat_id,
          buyer_name: s.buyer_name,
          price: s.price,
          sale_date: s.sale_date,
        };
      });

      const expensesObj: Record<string, any> = {};
      initialExpenses.forEach(e => {
        expensesObj[e.id] = {
          category: e.category,
          title: e.title,
          amount: e.amount,
          date: e.date,
          notes: e.notes || '',
          receipt_number: e.receipt_number || '',
        };
      });

      const workersObj: Record<string, any> = {};
      initialWorkers.forEach(w => {
        workersObj[w.id] = {
          full_name: w.full_name,
          phone: w.phone,
          location: w.location,
        };
      });

      const milkObj: Record<string, any> = {};
      initialMilk.forEach(m => {
        milkObj[m.id] = {
          goat_id: m.goat_id,
          date: m.date,
          morning_liters: m.morning_liters,
          evening_liters: m.evening_liters,
          total_liters: m.total_liters,
        };
      });

      const feedsObj: Record<string, any> = {};
      initialFeeds.forEach(f => {
        feedsObj[f.id] = f;
      });

      const medicationsObj: Record<string, any> = {};
      initialMedications.forEach(m => {
        medicationsObj[m.id] = m;
      });

      const kidGrowthObj: Record<string, any> = {};
      initialKidGrowthRecords.forEach(k => {
        kidGrowthObj[k.id] = k;
      });

      await set(recordsRef, {
        goats: goatsObj,
        breeding: breedingObj,
        health: healthObj,
        sales: salesObj,
        expenses: expensesObj,
        workers: workersObj,
        milk: milkObj,
        feeds: feedsObj,
        medications: medicationsObj,
        kid_growth: kidGrowthObj,
      });

      await set(ref(rtdb, `users/${activeUid}/user_profile`), {
        farm_name: user?.farm_name || 'My Goat Farm',
        email: user?.email || firebaseUser.email || '',
        created_at: user?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return { success: true, message: 'Sample farm records successfully saved to your database!' };
    } catch (err: any) {
      console.error('pushSeedDataToFirebase error:', err);
      return { success: false, message: err.message || 'Failed to write to database' };
    }
  };

  const resetToSampleData = () => {
    if (isDemoMode) {
      setUser(initialFarmUser);
      setGoats(initialGoats);
      setBreeding(initialBreeding);
      setHealth(initialHealth);
      setSales(initialSales);
      setExpenses(initialExpenses);
      setWorkers(initialWorkers);
      setMilk(initialMilk);
      setFeeds(initialFeeds);
      setMedications(initialMedications);
      setKidGrowthRecords(initialKidGrowthRecords);
      localStorage.setItem('sgm_feeds', JSON.stringify(initialFeeds));
      localStorage.setItem('sgm_medications', JSON.stringify(initialMedications));
      localStorage.setItem('sgm_kid_growth', JSON.stringify(initialKidGrowthRecords));
    }
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const rawEstYear = user?.established_year || user?.founded_year;
  const parsedEstYear = rawEstYear ? parseInt(rawEstYear, 10) : null;

  let daysActive = 1;
  if (parsedEstYear && !isNaN(parsedEstYear) && parsedEstYear > 1900 && parsedEstYear <= currentYear) {
    // Calculated from January 1 of the established year through today
    const estDate = new Date(parsedEstYear, 0, 1);
    daysActive = Math.max(1, Math.floor((now.getTime() - estDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  } else {
    const createdDate = user?.created_at ? new Date(user.created_at) : now;
    daysActive = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const isAuthenticated = !authLoading && (!!firebaseUser || !!user || isDemoMode);

  return (
    <FarmContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated,
        authLoading,
        isDemoMode,
        farmName: user?.farm_name || (isDemoMode ? 'Sunny Ridge Goat Farm' : 'Smart Goat Farm'),
        daysActive,
        syncStatus,
        syncError,
        isOnline,
        isSyncing,
        lastSyncedAt,
        isFirebaseActive,
        recordsLoaded,
        goats,
        breeding,
        health,
        sales,
        expenses,
        workers,
        milk,
        feeds,
        medications,
        kidGrowthRecords,
        login,
        signup,
        updateFarmProfile,
        resetPassword,
        logout,
        enterDemoMode,
        addGoat,
        updateGoat,
        bulkUpdateGoats,
        bulkDeleteGoats,
        deleteGoat,
        addBreeding,
        updateBreeding,
        deleteBreeding,
        addHealth,
        deleteHealth,
        addSale,
        deleteSale,
        addExpense,
        deleteExpense,
        addWorker,
        deleteWorker,
        addMilk,
        deleteMilk,
        addFeed,
        updateFeed,
        deleteFeed,
        clearAllFeeds,
        consumeFeed,
        restockFeed,
        addMedication,
        updateMedication,
        deleteMedication,
        clearAllMedications,
        consumeMedication,
        restockMedication,
        addKidGrowthRecord,
        updateKidGrowthRecord,
        deleteKidGrowthRecord,
        clearAllKidGrowthRecords,
        importBatchRecords,
        pushSeedDataToFirebase,
        syncAllCurrentRecordsToFirebase,
        resetToSampleData,
        refreshFromFirebase,
        confirmActivation,
        checkActivationStatus,
        resendVerificationEmail,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
