# Architecture Essentials & Developer Guide
## Smart Goat Management System (SGMS)

> **Quick-reference handbook for engineers, maintainers, and onboarding developers.**

---

## 1. Directory Structure Map

```
/
├── .env.example                     # Declared environment variables template
├── metadata.json                    # Application metadata, permissions & capabilities
├── package.json                     # Dependencies & npm scripts
├── index.html                       # Single-page HTML entry point
│
└── src/
    ├── main.tsx                     # React application bootstrap
    ├── App.tsx                      # Top-level shell, navigation routing & global layout
    ├── index.css                    # Tailwind CSS v4 entry point (@import "tailwindcss";)
    ├── types.ts                     # Central domain models & TypeScript contracts
    │
    ├── context/
    │   └── FarmContext.tsx          # Single Source of Truth: state, sync & offline cache
    │
    ├── pages/
    │   ├── DashboardView.tsx        # KPI metrics, farm alerts, profile checklist
    │   ├── RecordsView.tsx          # Herd registry, bulk edit, spreadsheets, reports
    │   ├── TasksView.tsx            # Event-driven task manager, tag badges, smart suggester
    │   ├── BreedingEstimatorView.tsx# Gestation calculator, breeding schedule & kidding dates
    │   ├── HealthCareView.tsx       # Veterinary clinical logs, illness & withdrawal tracker
    │   ├── FeedSupplyView.tsx       # Feed stock inventory, rationing, low-supply alerts
    │   ├── ReportsView.tsx          # Printable PDF-style audit reports & census
    │   └── ProfileView.tsx          # Farm branding, location, manager credentials
    │
    ├── components/
    │   ├── TagScannerModal.tsx      # In-browser camera barcode/QR ear tag scanner
    │   ├── PedigreeTreeModal.tsx    # Multi-generational lineage & inbreeding safety tree
    │   ├── KidGrowthTracker.tsx     # Birth-to-weaning weight logs & ADG calculations
    │   ├── KidGrowthTrajectoryModal.tsx # Recharts growth curve & ADG benchmark graphs
    │   ├── WeightTrendsChart.tsx    # Herd seasonal weight progression chart
    │   ├── FarmReportModal.tsx      # Configurable duration export generator
    │   ├── ExcelImportModal.tsx     # XLSX/CSV parsing and batch Firestore ingestion
    │   └── AddRecordModal.tsx       # Dynamic modal for inserting farm records
    │
    └── utils/
        ├── taskHelper.ts            # Smart Tag suggestion & biosecurity task generator
        └── dateUtils.ts             # Caprine gestation math & elapsed day calculators
```

---

## 2. Core Architectural Rules

### 2.1 The Single Source of Truth (`FarmContext.tsx`)
- All application state (goats, breeding, health, kid growth, sales, milk, tasks) **must** be accessed and mutated via `useFarm()`.
- Never create ad-hoc global state or bypass `FarmContext`.
- When adding a new record type:
  1. Define its interface in `src/types.ts`.
  2. Add collection hooks and optimistic local caching in `src/context/FarmContext.tsx`.
  3. Wire the appropriate mutation functions (`addX`, `updateX`, `deleteX`).

### 2.2 Event-Driven Tasks vs. Artificial Generation
- **Never** generate spammy, ungrounded synthetic tasks.
- Tasks are strictly event-driven:
  - **Gestation**: Pre-kidding CD/T vaccine triggered at $T - 30$ days from expected delivery.
  - **Quarantine**: 7-day intermediate checkup and 14-day clearance task triggered on status change.
  - **Health Intervention**: Clinical follow-up triggered when owner logs a sick/treated animal.
  - **Creep Feeding**: Nutritional alert triggered when kid ADG drops below 140 g/day.

### 2.3 Biosecurity Quarantine Rule
- When an animal status changes to `Quarantine` (via individual edit or `bulkUpdateGoats`):
  - Always call `scheduleQuarantineTasksForGoats()` from `src/utils/taskHelper.ts`.
  - Schedule Day 7 and Day 14 tasks with the `Health Check` tag.

### 2.4 Styling & UI Standards
- Use pure **Tailwind CSS** classes.
- Ensure strict contrast ratios (WCAG AA) with complete dark mode support (`dark:` modifiers).
- All icons **must** be imported from `lucide-react`. Never embed raw custom SVGs.
- Animations must utilize `motion` from `motion/react`.

---

## 3. Key TypeScript Interfaces

```typescript
// Core Goat Record
export interface GoatRecord {
  id: string;
  tag_number: string;
  name: string;
  breed: string;
  gender: 'Male' | 'Female';
  dob: string;
  weight_kg: number;
  status: 'Active' | 'Pregnant' | 'Quarantine' | 'Sold' | 'Dead';
  dam_tag?: string;
  sire_tag?: string;
  notes?: string;
}

// Kid Growth & Weaning Record
export interface KidGrowthRecord {
  id: string;
  kid_tag: string;
  kid_name?: string;
  gender: 'Male' | 'Female';
  breed: string;
  dob: string;
  birth_weight: number;
  weaning_weight?: number;
  weaning_date?: string;
  adg_grams?: number;
  status: 'Nursing' | 'Weaned' | 'Sold' | 'Retained';
  dam_tag?: string;
  sire_tag?: string;
}
```

---

## 4. Development Commands

```bash
# Start development server (bound to port 3000)
npm run dev

# Run TypeScript type verification
npm run lint

# Production compilation
npm run build
```

---

## 5. Security & Deployment Safeguards

1. **Port Isolation**: Dev and production servers must bind exclusively to `0.0.0.0:3000`.
2. **Camera Resource Deallocation**: In any component using `Html5Qrcode`, invoke `html5QrCode.stop().then(() => html5QrCode.clear())` in cleanup callbacks to avoid device lockups.
3. **CSV Export Escaping**: Always wrap fields in quotes and prefix formula trigger characters (`=`, `+`, `-`, `@`) with a single quote or space.
