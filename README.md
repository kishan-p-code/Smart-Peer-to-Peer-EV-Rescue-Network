================================================
FILE: README.md
================================================
# EVIO – Peer-to-Peer EV Charging Marketplace

**Evio** is a community-powered EV charging network platform that lets homeowners and businesses list their private EV chargers and allows EV drivers to find, book, navigate, and pay for charging sessions seamlessly.

Built strictly according to the **WattVision DESIGN.md** design system and the **Evio Product Requirements Document (PRD)**.

---

## 🎨 Design System Implementation (WattVision DESIGN.md)

| Token / Spec | Value | Implementation |
| :--- | :--- | :--- |
| **Primary Background** | `#121212` | Dark mode page canvas |
| **Card Surface** | `#1E1E1E` | 16px radius (`rounded-card`), 20px padding, `1px solid #2C2C2E` |
| **Data & Action Accent** | `#00E5FF` | Neon Cyan for buttons, route lines, chart paths, KPIs |
| **Live / Available Accent** | `#32D74B` | Lime Green for available pins, normal status, live telemetry |
| **In-Use Token** | `#FFD60A` | Amber for actively occupied chargers on map |
| **Alert / Spike Accent** | `#FF453A` | Red for connector mismatches, safety warnings, and rejections |
| **Alert Box Surface** | `#3A1C1C` | Left border `4px solid #FF453A` |
| **Grid Lines & Borders** | `#2C2C2E` | 1px border on tables, cards, chart grids |
| **Table Row Hover** | `#252525` | Smooth transition on table rows |
| **Typography** | Inter & JetBrains Mono | Headings in Inter (24px), KPIs in JetBrains Mono (32px Bold) |

---

## ⚡ Core Features Implemented

### 1. Driver Discovery & Live Map (PRD Section 5.2, 6.2, 6.3)
- **High-contrast Dark Leaflet Map:** CartoDB Dark Matter tiles matching `#121212`.
- **Status-Coded Pins:** Glowing green for Available, amber for In-Use, gray for Offline.
- **Search & "Near Me":** Geolocation sensor with fallback.
- **Radius Slider:** 1 km to 50 km interactive search radius overlay.
- **Filter Chips:** Type 2, CCS-2, GB/T, CHAdeMO, Type 1; Speed tiers (Slow, Fast, Rapid); Available Now toggle.
- **Map / List View Toggle:** Responsive 12-column split view (4 cols list, 8 cols map) or 3-column card grid.

### 2. Compatibility Check & Booking Flow (PRD Section 5.2, 6.5)
- **Pre-Booking Vehicle Compatibility Alert:** Detects driver vehicle connector against charger specifications. Displays instant green approval or red alert warning (`#3A1C1C` box with `4px solid #FF453A` border).
- **Slot & Duration Picker:** Flexible hours with real-time battery % gain & kWh delivery calculation.
- **Checkout:** In-app wallet, UPI / QR, and card options with platform fee breakdown.
- **Address Privacy:** Exact address and gate passcode remain locked until booking confirmation.

### 3. Active Session Telemetry & Tracker (PRD Section 6.5, 6.9)
- **Live Battery SOC Circular Gauge:** Real-time charging simulation with power flow rate (kW), kWh delivered, and running cost in local currency.
- **Gate Code & Location Display:** Revealed host instructions and bay parking details.
- **Emergency SOS & Direct Host Chat:** In-app messaging without exposing phone numbers.
- **Stop Charging Flow:** Completes session, frees up charger, generates official tax invoice/receipt, and triggers confetti celebration.

### 4. Host Operations Hub (PRD Section 5.3, 6.4, 6.9 & DESIGN.md Section 5)
- **3 Top KPI Cards:** Total Earnings, Total Sessions, Energy Delivered (JetBrains Mono).
- **8-Column Area Chart:** `#00E5FF` curve with gradient fill to `#32D74B`, grid lines in `#2C2C2E`, timeframe selector (Day/Week/Month).
- **4-Column Control Panel:** Live charger status toggle (Live vs Vacation mode), incoming driver booking approval queue, and electrical safety certificate card.
- **Recent Sessions & Payouts Table:** Clean rows with `#252525` hover state.

### 5. 7-Step Guided Host Listing Wizard (PRD Section 5.3 & 6.4)
- Step 1: Photos (Charger, cable, bay)
- Step 2: Location (Pin coords, approximate area, exact address)
- Step 3: Technical Specs (Power kW, Connectors, Cable length, Slots)
- Step 4: Pricing Model (per kWh or per hour with 10% platform take rate preview)
- Step 5: Availability (24/7 or custom days/hours)
- Step 6: Access & Amenities (Gate code, parking notes, WiFi, Restroom)
- Step 7: Safety & Compliance (Electrical certificate upload & terms agreement). Listing enters "Pending Review".

### 6. Admin Panel (PRD Section 6.10, 6.11)
- **Safety Document Inspector:** Review pending charger submissions, inspect electrical NOCs, and Approve or Reject with reason.
- **Dispute Resolution & Platform GMV:** Track active driver/host disputes and network commission revenue.

### 7. In-App Wallet, Chat & Currency Switcher (PRD Section 6.6, 6.8 & Note 8.7)
- **Multi-Currency:** Configurable toggle between **₹ INR** (launch market default), **Bs. BOB** (from DESIGN.md), and **$ USD**.
- **Wallet Top-Up:** Instant balance simulation with transaction ledger.
- **Direct Messaging:** Driver-Host chat drawer with quick canned updates.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Production build
npm run build
```
Access the application at `http://localhost:3000/`.
#
