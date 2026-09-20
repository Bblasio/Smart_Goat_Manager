# System Architecture Document (SAD)
## Smart Goat Management System (SGMS)

---

## 1. Architectural Overview

The **Smart Goat Management System (SGMS)** is built as an offline-first, single-page progressive web application with real-time cloud data synchronization. It leverages modern client-side React 18, TypeScript, Tailwind CSS, Recharts, and Google Firebase Firestore for cloud persistence.

```
+-------------------------------------------------------------------------------+
|                             CLIENT APPLICATION                                |
|                                                                               |
|  +---------------------+   +---------------------+   +---------------------+  |
|  |   UI / Page Views   |   |   Component Layer   |   |    Data Visuals     |  |
|  |  Dashboard, Records |   | AddModal, Scanner,  |   | Recharts (ADG, Milk,|  |
|  |  Tasks, Breeding,   |   | PedigreeTreeModal,  |   | Herd Weight Trends) |  |
|  |  Reports, Health    |   | GrowthTrajectory    |   |                     |  |
|  +----------+----------+   +----------+----------+   +----------+----------+  |
|             |                         |                         |             |
|             +-------------------------+-------------------------+             |
|                                       |                                       |
|                                       v                                       |
|                        +-----------------------------+                        |
|                        |   FarmContext (Global VM)   |                        |
|                        | State Dispatcher & Sync Hub |                        |
|                        +--------------+--------------+                        |
|                                       |                                       |
|                   +-------------------+-------------------+                   |
|                   |                                       |                   |
|                   v                                       v                   |
|      +-------------------------+             +-------------------------+      |
|      |    Local Cache Engine   |             |   Firebase Service SDK  |      |
|      |  localStorage Fallback  |             |  Firestore (Real-time)  |      |
|      |    Offline Durability   |             |  Firebase Auth (RBAC)   |      |
|      +-------------------------+             +------------+------------+      |
+-----------------------------------------------------------|-------------------+
                                                            | HTTPS / WSS
                                                            v
                                               +-------------------------+
                                               |  Google Cloud Firestore |
                                               | Multi-Tenant Collections|
                                               |  Security Rules Engine  |
                                               +-------------------------+
```

---

## 2. Technical Stack & Component Topology

| Layer | Technology | Rationale & Specifications |
| :--- | :--- | :--- |
| **Runtime & Build** | Node.js, Vite 6, TypeScript 5.7 | Instant HMR, static tree shaking, and zero-latency compilation. |
| **View Architecture** | React 18 (Functional + Hooks) | Strict unidirectional data flow with localized modal dialogs and pure rendering hooks. |
| **Styling Framework** | Tailwind CSS v4 | Modular CSS utility bundle with system light/dark mode and mobile responsive breakpoints. |
| **Charts & Graphs** | Recharts 2.15 | Declarative SVG rendering for weight trends, Average Daily Gain (ADG) trajectories, and milk yields. |
| **Computer Vision** | html5-qrcode 2.3 | Camera stream capture decoding standard 1D (Code-128, EAN-13) and 2D (QR) barcodes on ear tags. |
| **Document Processing** | xlsx 0.18.5 | Client-side spreadsheet parsing and generation for bulk batch imports and CSV/Excel exports. |
| **Cloud Persistence** | Firebase Firestore 12.19 | Low-latency NoSQL document database supporting live subscriptions (`onSnapshot`) and offline caching. |
| **Identity & Access** | Firebase Auth | Password-based and federated session tokens with secure local credential rotation. |

---

## 3. Data Flow & State Management

The core state engine resides in `src/context/FarmContext.tsx`. It acts as a single source of truth for the entire application.

### State Lifecycle Flow
1. **Bootstrap Phase**:
   - `FarmProvider` checks for an active Firebase session.
   - If authenticated, it binds Firestore real-time listeners (`onSnapshot`) scoped to the user's `userId`.
   - Simultaneously, local storage caches (`sgm_farm_goats_cache`, `farm_custom_tasks_v1`, etc.) load instantaneously to guarantee zero-latency screen rendering before network packets resolve.
2. **Mutation Phase**:
   - When a user performs an action (e.g., adds a health record, changes status to *Quarantine*):
     1. The mutation is applied optimistically to React state.
     2. The local storage snapshot is updated immediately.
     3. An asynchronous call is dispatched to Firestore (`addDoc`, `updateDoc`, or `writeBatch`).
     4. Dependent event triggers fire (e.g., *Automated Quarantine Timers* generate 7-day and 14-day tasks).
3. **Synchronization & Offline Fallback**:
   - In offline or intermittent field environments, mutations remain valid in `localStorage`.
   - On network reconnection, the Firestore SDK commits queued transactions.

---

## 4. Database Schema & Entity Relationship

SGMS organizes data into normalized Firestore collections, isolated by the user's unique identifier (`userId`).

### Core Collections

```
users/{userId}
  ├── profile documents (farm_name, owner_name, location, primary_breed, established_year)
  │
  ├── goats/{goatId}
  │     (tag_number, name, breed, gender, dob, weight_kg, status, dam_tag, sire_tag)
  │
  ├── breeding/{breedingId}
  │     (female_id, male_id, mating_date, expected_birth, status, kids_born)
  │
  ├── health/{healthId}
  │     (goat_id, condition, treatment, checkup_date, checkup_type, status, vet_name)
  │
  ├── kid_growth/{kidId}
  │     (kid_tag, kid_name, dob, gender, breed, birth_weight, weaning_weight, adg_grams)
  │
  ├── milk/{milkId}
  │     (goat_id, date, morning_liters, evening_liters, total_liters)
  │
  ├── sales/{saleId}
  │     (goat_id, buyer_name, price, sale_date)
  │
  └── expenses/{expenseId}
        (category, title, amount, date, notes)
```

---

## 5. Subsystem Architecture

### 5.1 Automated Biosecurity Quarantine Engine
- **Trigger**: Status transition to `Quarantine` on any animal record.
- **Workflow**:
  1. Detects `goat.status === 'Quarantine'`.
  2. Generates a **Day 7 Intermediate Check**: Checks respiratory signs, isolation compliance, and rectal temperature.
  3. Generates a **Day 14 Clearance Review**: Final veterinary inspection for re-integration into general herd pens.
  4. Tags tasks with `Health Check` and categorizes as `medical`.

### 5.2 Pedigree Family Lineage Engine
- **Trigger**: Opening the Pedigree Modal for any goat or kid.
- **Algorithmic Graph Traversal**:
  - Traverses from root goat to Dam ($M$) and Sire ($F$).
  - Traverses to Maternal Grand-Sire ($M_{Sire}$), Maternal Grand-Dam ($M_{Dam}$), Paternal Grand-Sire ($F_{Sire}$), and Paternal Grand-Dam ($F_{Dam}$).
  - Performs an ancestor collision check:
    $$\text{Collision} = \{F, F_{Sire}, F_{Dam}\} \cap \{M, M_{Sire}, M_{Dam}\}$$
  - Flags inbreeding warnings when common ancestors or parent-offspring matings are detected.

### 5.3 Kid ADG & Growth Trajectory Calculator
- **Mathematical Formula**:
  $$\text{ADG (g/day)} = \frac{\text{Current/Weaning Weight (kg)} - \text{Birth Weight (kg)}}{\text{Age in Days}} \times 1000$$
- **Benchmark Evaluation**:
  - $\text{ADG} \ge 180\text{ g/day}$: High Gain (Target commercial meat production).
  - $140 \le \text{ADG} < 180\text{ g/day}$: Optimal.
  - $\text{ADG} < 140\text{ g/day}$: Creep Feed Alert (Trigger dietary supplementation task).

---

## 6. Security Architecture & Threat Model

1. **Firestore Rule Hardening**:
   ```javascript
   match /databases/{database}/documents {
     match /{collection}/{document=**} {
       allow read, write: if request.auth != null &&
         (resource == null || resource.data.userId == request.auth.uid);
     }
   }
   ```
2. **Formula Injection Sanitization**: All CSV and Excel report exports sanitize string fields starting with `=`, `+`, `-`, or `@` to prevent remote execution inside Microsoft Excel or Google Sheets.
3. **Camera Device Access**: Streams acquired via `navigator.mediaDevices.getUserMedia` are stopped and destroyed immediately when the `TagScannerModal` unmounts.
4. **No Plaintext Secret Leaks**: All client code accesses only public Firebase configuration parameters; administrative privileges remain server-side.
