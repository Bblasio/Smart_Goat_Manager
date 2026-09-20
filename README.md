# 🐐 Smart Goat Management System (SGMS)
> **Precision Livestock & Farm Intelligence Platform for Commercial and Smallholder Goat Enterprises**

[![Version](https://img.shields.io/badge/version-1.2.0-emerald.svg)](package.json)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0.9-38B2AC.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28.svg)](https://firebase.google.com/)

---

## 📖 Table of Contents
1. [Overview](#-overview)
2. [Key Capabilities & Modules](#-key-capabilities--modules)
3. [Architecture Highlights](#-architecture-highlights)
4. [Installation & Getting Started](#-installation--getting-started)
5. [User Personas & Operational Roles](#-user-personas--operational-roles)
6. [Security & Biosecurity Protocols](#-security--biosecurity-protocols)
7. [Contributing & Code Standards](#-contributing--code-standards)
8. [License](#-license)

---

## 🌟 Overview

The **Smart Goat Management System (SGMS)** is an enterprise-ready, offline-first digital farm operating system tailored specifically to caprine agriculture. Designed to overcome the inefficiencies of paper logs and disconnected spreadsheets, SGMS equips goat breeders, dairy operators, and meat producers with real-time livestock tracking, automated breeding estimators, biosecurity quarantine timers, pedigree family trees, kid weight trajectory analytics, and financial ledgers.

---

## 🚀 Key Capabilities & Modules

### 1. 🐐 Herd Registry & Batch Management
- **Universal Ear Tag Scanning**: In-app camera scanner supports standard 1D/2D barcodes and QR codes printed on plastic and RFID ear tags.
- **Bulk Edit Mode**: Filter by status, breed, or health condition, and execute single-click bulk updates for multiple animals (e.g., mark as `Quarantine`, `Sold`, `Active`, `Pregnant`, or `Culled`).
- **Complete Life-Cycle Profiles**: Trace breed, sex, horn status, birth weight, dam, sire, reproductive state, and pasture pen.

### 2. ⏳ Automated Biosecurity & Quarantine Timers
- **Auto-Scheduled Timers**: Moving animals into `Quarantine` automatically instantiates:
  - **Day 7 Intermediate Check**: Symptom audit (respiratory, appetite, fecal consistency).
  - **Day 14 Clearance Review**: Final clinical verification before safe re-integration into the general herd.
- **Pre-Emptive Disease Prevention**: Prevents contagious caprine pleuropneumonia (CCPP), orf (sore mouth), and caseous lymphadenitis (CL) outbreaks.

### 3. 🧬 Pedigree Lineage & Inbreeding Prevention Tree
- **Multi-Generational Visualization**: Visualizes Sire, Dam, Grand-Sires, and Grand-Dams in an interactive pedigree family tree.
- **Inbreeding Coefficient Safeguards**: Automatically checks for identical ear tags or shared lineage across paternal and maternal lines to prevent genetic depression and defects.

### 4. 📈 Kid Growth Tracker & ADG Analytics
- **Average Daily Gain (ADG) Computation**: Calculates exact daily gram gain ($g/\text{day} = \frac{W_2 - W_1}{\Delta t \times 1000}$) from birth to weaning.
- **Interactive Trajectory Charts**: Compares individual kid weight curves against industry benchmarks (Boer, Dairy, Dual-Purpose).
- **Early Warning Indicators**: Highlights kids underperforming (< 140 g/day) for targeted creep feeding and health intervention.

### 5. 🤰 Breeding, Maternity & Gestation Intelligence
- **Caprine Gestation Calculator**: Calculates exact expected delivery dates based on standard 150-day caprine gestation cycles.
- **Pre-Kidding Protocols**: Triggers CD/T clostridial booster vaccinations 30 days prior to kidding to ensure maternal antibody transfer through colostrum.
- **Ultrasound & Pregnancy Checkups**: Integrates ultrasound verification logs with estimated fetal age and multiple kidding history.

### 6. 🩺 Clinical Health & Veterinary Ledger
- **Symptom & Treatment Logs**: Records condition, veterinary personnel, administered drug, dosage, and mandatory meat/milk withdrawal periods.
- **Smart Task Suggester**: Entering or scanning a goat ID in task management auto-detects active health treatments or pregnancies, proposing relevant tasks and protocols in one click.

### 7. 🥛 Production, Sales & Feed Inventory
- **Milk Yield Logs**: Daily morning and evening milk yield recording per lactating doe with trend charts.
- **Sales & Expense Ledger**: Tracks livestock sales, buyer contact information, meat prices, medication costs, and feed invoices.
- **Feed Supply Alerts**: Monitors roughage, concentrates, and mineral blocks with low-stock warnings.

---

## 🏗️ Architecture Highlights

- **Frontend Core**: React 18 with TypeScript running on Vite for sub-second build times.
- **Component Styling**: Clean Tailwind CSS utility architecture with dark/light themes and responsive mobile/tablet layouts.
- **Data Visualization**: Recharts for dynamic herd weight trends, milk yield curves, and kid ADG performance.
- **Persistence & Cloud Sync**: Dual-layer architecture combining local state cache (`localStorage`) with Firebase Firestore real-time synchronization.
- **Media Engine**: Native HTML5 camera stream processing for instant optical ear tag decoding without server roundtrips.

---

## 💻 Installation & Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or bun

### Local Setup
```bash
# 1. Clone the repository
git clone https://github.com/ochiengblasio/smart-goat-manager.git
cd smart-goat-manager

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional for local mock mode)
cp .env.example .env

# 4. Start local development server (binds to port 3000)
npm run dev
```

### Production Build
```bash
# Compile and build production assets
npm run build

# Preview production build locally
npm run preview
```

---

## 👥 User Personas & Operational Roles

| Role | Primary Activities | Key Dashboard Tools |
| :--- | :--- | :--- |
| **Farm Owner / General Manager** | Financial performance, breeding targets, herd asset valuation, sales contracts | Financial Tracking, Duration Reports, Herd Census |
| **Herd Manager / Herdsman** | Daily health checks, pen allocations, kidding monitoring, feed dispensing | Daily Tasks, Ear Tag Scanner, Bulk Status Edit |
| **Attending Veterinarian** | Disease diagnosis, medication administration, withdrawal clearance, post-mortems | Health Records, Quarantine Timers, Ultrasound Logs |

---

## 🛡️ Security & Biosecurity Protocols

1. **Role & Tenant Isolation**: Every document in Firestore contains a scoped `userId` preventing cross-farm data leakage.
2. **Sanitized Exports**: CSV generation escapes special spreadsheet characters (`=`, `+`, `-`, `@`) to protect farm managers from CSV injection attacks.
3. **Camera Sandboxing**: Camera streams are deactivated and hardware locks are released the millisecond a scanning modal closes.
4. **Biosecurity Quarantine**: Built-in 14-day quarantine timers prevent premature integration of new or sick stock.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
