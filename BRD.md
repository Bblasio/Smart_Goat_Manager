# Business Requirements Document (BRD)
## Project: Smart Goat Management System (SGMS)
**Document Version:** 1.2.0  
**Author:** Farm Systems Engineering Group  
**Target Enterprise:** Commercial & Smallholder Caprine Production Units  

---

## 1. Executive Summary & Strategic Objectives

The caprine livestock industry (dairy, meat, fiber, and breeding stock) faces substantial economic losses due to undocumented breeding, unrecognized inbreeding depression, untracked kid morbidity, and unmonitored antibiotic withdrawal windows.

The **Smart Goat Management System (SGMS)** is commissioned to establish an integrated digital operating system for modern goat farms. SGMS centralizes livestock inventory, breeding schedules, medical interventions, milk yields, and kid growth trajectories, replacing disparate handwritten books and desktop spreadsheets with a real-time, cloud-synchronized platform.

### Primary Objectives
1. **Reduce Kid Mortality**: Elevate pre-weaning survival rates by tracking kid birth weight, 30-day weights, and Average Daily Gain (ADG) with automated nutritional intervention alerts.
2. **Prevent Contagious Herd Outbreaks**: Enforce biosecurity protocols using automated 7-day and 14-day quarantine timers for all newly acquired or symptomatic stock.
3. **Eliminate Unplanned Inbreeding**: Provide interactive multi-generational pedigree family trees with ancestor collision detection.
4. **Automate Farm Compliance**: Ensure accurate veterinary drug withdrawal tracking and generate official farm census, pedigree certificates, and sales receipts.

---

## 2. Problem Statement

Commercial goat enterprises currently encounter four critical operational bottlenecks:

```
+---------------------------+-------------------------------------------------------------+
| Operational Problem       | Business & Financial Impact                                 |
+---------------------------+-------------------------------------------------------------+
| 1. Paper / Memory Logs    | Lost genealogical data, untracked vaccination boosters,     |
|                           | failure to observe antibiotic milk/meat withdrawal dates.   |
+---------------------------+-------------------------------------------------------------+
| 2. Poor Quarantine Rigor  | Asymptomatic new animals introduced prematurely, triggering |
|                           | herd-wide respiratory or contagious caprine disease.        |
+---------------------------+-------------------------------------------------------------+
| 3. Uncontrolled Lineage   | Accidental breeding between related bucks and does, leading |
|                           | to genetic defects, poor feed conversion, and stillbirths.  |
+---------------------------+-------------------------------------------------------------+
| 4. Suboptimal Kid Growth  | Slow growth unspotted until weaning, permanently stunting   |
|                           | mature animal carcass weight and dairy output.              |
+---------------------------+-------------------------------------------------------------+
```

---

## 3. Stakeholder Matrix & User Personas

| Persona | Role | Key Business Responsibilities | System Value Proposition |
| :--- | :--- | :--- | :--- |
| **John (Farm Owner / Investor)** | Executive Management | Capital allocation, financial ROI, stock valuation, pedigree sales. | High-level KPI dashboard, consolidated financial reports, audit-ready herd valuations. |
| **Elijah (Head Herdsman)** | Field Operations | Daily pen checks, feed dispensation, ear tag application, kidding assistance. | Quick camera tag scanner, bulk status transitions, visual daily task calendar. |
| **Dr. Wekesa (Attending Vet)** | Animal Health | Disease diagnosis, vaccine scheduling, pregnancy ultrasound verification. | Health log history, quarantine clearance workflows, drug withdrawal enforcement. |

---

## 4. Functional Requirements (FR)

### FR-1: Livestock Identification & Ear Tag Scanning
- **FR-1.1**: The system shall register goats with unique ear tag identifiers, name, breed, sex, birth date, horn status, dam tag, sire tag, and initial weight.
- **FR-1.2**: The system shall provide an in-app camera scanner that reads standard 1D barcodes and 2D QR codes printed on ear tags, instantly populating goat profiles without manual typing.

### FR-2: Herd Bulk Status Updates
- **FR-2.1**: The system shall provide a multi-select "Bulk Edit" mode within the herd records registry.
- **FR-2.2**: The manager shall be able to filter goats by breed, sex, or current state and apply batch status updates (`Active`, `Quarantine`, `Pregnant`, `Sold`, `Dead/Culled`) in a single click.

### FR-3: Biosecurity & Automated Quarantine Timers
- **FR-3.1**: Whenever one or more goats are marked as `Quarantine`, the system shall automatically generate two linked biosecurity tasks:
  - An intermediate health check scheduled 7 days post-quarantine.
  - A comprehensive clearance review scheduled 14 days post-quarantine.
- **FR-3.2**: Quarantine tasks shall automatically receive the `Health Check` smart tag and appear in high-priority task alerts.

### FR-4: Breeding & Gestation Calendar
- **FR-4.1**: The system shall calculate the expected delivery date based on a 150-day caprine gestation standard from the recorded mating date.
- **FR-4.2**: The system shall schedule pre-kidding clostridial booster vaccinations (CD/T) 30 days prior to the estimated delivery date.
- **FR-4.3**: The system shall record ultrasound pregnancy scans with fetal count and estimated age.

### FR-5: Pedigree Lineage & Inbreeding Prevention Tree
- **FR-5.1**: The system shall render an interactive visual family tree displaying the target animal, Sire, Dam, Grand-Sires, and Grand-Dams.
- **FR-5.2**: The system shall analyze parental tags across the maternal and paternal lineage and trigger an alert if a common ancestor or direct inbreeding is detected.

### FR-6: Kid Growth Tracking & ADG Trajectory Analytics
- **FR-6.1**: The system shall log birth weight, 30-day weight, and weaning weight for every kid.
- **FR-6.2**: The system shall automatically compute the Average Daily Gain (ADG) in grams per day:
  $$\text{ADG} = \frac{\text{Weaning Weight (kg)} - \text{Birth Weight (kg)}}{\text{Days Elapsed}} \times 1000$$
- **FR-6.3**: The system shall classify ADG into actionable tiers: `High Gain` ($\ge 180$ g/day), `Optimal` ($140-179$ g/day), and `Needs Creep Feed` ($< 140$ g/day).
- **FR-6.4**: The system shall plot weight progression curves against breed growth benchmarks.

### FR-7: Health, Treatment & Drug Withdrawal Monitoring
- **FR-7.1**: The system shall record clinical diagnoses, treatments, dosages, and attending personnel.
- **FR-7.2**: Entering an ear tag in task creation shall trigger the Smart Suggester to recommend follow-up clinical tasks based on active health records.

### FR-8: Production & Financial Management
- **FR-8.1**: The system shall record individual and herd morning/evening milk production yields.
- **FR-8.2**: The system shall maintain a sales and expense ledger tracking stock buyers, purchase prices, feed costs, and medical expenditures.

### FR-9: Farm Profile & Export Capabilities
- **FR-9.1**: The system shall monitor profile completeness (farm name, owner, location, phone, breed, farm size) and display an actionable setup banner until fully configured.
- **FR-9.2**: The system shall support one-click exports to CSV and generate duration-specific PDF reports for farm audits.

---

## 5. Non-Functional Requirements (NFR)

1. **Performance**: Initial screen load under 1.5 seconds on 3G cellular connections. Ear tag optical recognition latency under 400 milliseconds.
2. **Offline Resilience**: Field workers shall be able to record births, weights, and health treatments without active internet connectivity; mutations cache in `localStorage` and sync when online.
3. **Data Integrity**: Database transactions must be scoped strictly per farm enterprise (`userId`) to prevent multi-tenant contamination.
4. **Responsiveness**: Complete fluid usability across mobile smartphones (herdsman field use), tablets (veterinary clinical rounds), and desktop monitors (manager office accounting).

---

## 6. Success Metrics & Business KPIs

| Metric | Target Baseline | SGMS Target (6 Months) |
| :--- | :--- | :--- |
| **Pre-Weaning Mortality** | 18% - 24% | $< 8\%$ |
| **Average Daily Gain (Meat Breeds)** | 110 g/day | $\ge 165\text{ g/day}$ |
| **Quarantine Protocol Compliance** | 20% (Sporadic) | $100\%$ (Automated timers) |
| **Record Retrieval Time** | 15 - 30 minutes | $< 5\text{ seconds}$ |
