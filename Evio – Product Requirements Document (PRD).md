# Evio – Product Requirements Document

**Product:** Evio, a peer-to-peer EV charging marketplace **Version:** 1.0 (Draft) **Platform:** Responsive web app (desktop, tablet, mobile browser) **Design source:** WattVision DESIGN.md (dark, data-first design system)

## 1. Overview

### 1.1 Vision

Evio lets anyone with an EV charger at home or at their business list it and earn money, and lets EV drivers find, book and pay for a charger nearby. The result is a community-powered charging network that fills the gaps public infrastructure leaves, especially on long journeys.

### 1.2 Problem

- Public EV chargers are scarce, unevenly distributed and often occupied or broken, so drivers suffer range anxiety on trips.
- Thousands of private chargers sit idle most of the day.

### 1.3 Solution

A two-sided marketplace:

- **Hosts** list their charger (photos, location, specs, price, schedule) and start earning.
- **Drivers** open a live map of nearby host chargers, filter by connector type, power, price and distance, book a slot and pay in-app.

### 1.4 Core user experience (as requested)

1. User lands on the **Login / Sign-up** page.
2. After login, user lands on the **Dashboard with a live map** of nearby listed chargers.
3. Driver searches and filters chargers. Host lists a charger through a guided form (photos, location, watt output, connector type and more).

## 2. Goals, Non-Goals and Success Metrics

### 2.1 Goals

- G1: A driver can find a compatible, available charger within 3 taps of login.
- G2: A host can publish a listing in under 5 minutes.
- G3: Create trust through verification, reviews and an admin approval step before listings go live.
- G4: Deliver a visual identity that feels technical, reliable and in control (see Section 8).

### 2.2 Non-Goals (v1)

- Native iOS/Android apps (web first, designed mobile-responsive).
- Hardware or OCPP integration for remote charger control and live kWh metering (planned later, see Phase 3).
- Operating our own chargers.

### 2.3 Success Metrics

| Metric | Target (first 6 months, per launch city) |
| --- | --- |
| Approved host listings | 200+ |
| Driver-to-booking conversion (search to booking) | 8%+ |
| Listing completion rate (started to submitted) | 60%+ |
| Booking acceptance rate (manual-approval listings) | 80%+ |
| Repeat drivers (2+ sessions in 30 days) | 35%+ |
| Average rating | 4.3+ |
| Disputes per 100 sessions | under 3 |

## 3. Users and Personas

**Driver (needs charging).** Owns an EV, often on intercity trips or without home charging. Worried about running out of charge, wants reliability, price clarity and compatibility certainty.

**Host (has a charger).** Home or small-business owner with an idle charger. Wants passive income, control over who comes and when, privacy of their address, and transparent earnings.

**Admin (Evio team).** Reviews listings, resolves disputes, monitors fraud, runs promotions.

A single account can switch between Host and Driver modes.

## 4. Scope and Phasing

The supplied feature list is large. It is grouped into phases so the first release stays focused on your core idea.

### Phase 1 – MVP (core marketplace)

- Auth: email/phone login, Google sign-in, role selection, profile setup
- Dashboard with live map, availability pins, radius, search, Near me
- Filters and sort: connector type, power, price, nearest, rating, available now
- Host charger listing with photos, location, specs, pricing, schedule, access notes
- Booking with calendar slots, instant or approval flow, session timer
- Payments: in-app wallet plus UPI/card, receipts
- Reviews (both directions), report a charger
- In-app chat and push/email notifications
- Basic Host dashboard and Driver dashboard
- Admin panel: approve/reject listings, users, bookings, disputes
- Electrical safety certificate upload

### Phase 2 – Growth and trust

- Route-based search and route planner with charging stops
- Waitlist, extend session, cancel/reschedule policies
- Host earnings analytics, payout history, platform commission display
- Promo codes, referral credits, subscription plan
- Verified host badge, charger health score
- Smart notifications, price alerts, favourites, saved locations
- Amenity and 24/7 filters, vacation mode
- SMS fallback, fraud detection, emergency contact, session insurance

### Phase 3 – Differentiators

- "Arrive and Charge" remote unlock (smart plug / OCPP integration)
- Live session progress and kWh metering
- EV range estimator, carbon savings tracker
- Gamification: streaks, badges, host leaderboard, levels
- Community feed
- City-wise heatmaps for admin, advanced fraud tooling

## 5. Key User Flows

### 5.1 Onboarding

1. Open Evio and see the Login page (email/phone or Google).
2. Verify via OTP or Google.
3. Choose role: **Host** or **Driver** (changeable later).
4. Profile setup: name, photo. Drivers also add EV model and connector type. Hosts proceed to listing.
5. Optional ID/vehicle verification (required before first booking or before listing goes live, see FR-AUTH-5).
6. Land on the Dashboard.

### 5.2 Driver: find and charge

1. Dashboard opens the map centred on the driver's GPS location with nearby charger pins.
2. Driver applies filters (connector, power, price, radius) or searches an area/landmark.
3. Taps a pin and sees a preview card (photo, price, power, connector, rating, distance, ETA, status).
4. Opens charger detail, picks a date/time slot and duration, and sees a compatibility check against their vehicle.
5. Books instantly or sends a request. Pays via wallet/UPI/card.
6. Receives the exact address and access instructions after confirmation.
7. Charges, session ends via timer or host, receipt is generated, and both sides are prompted to review.

### 5.3 Host: list a charger

1. From the Host dashboard, tap **List your charger**.
2. Multi-step form (progress shown, draft auto-saved):
   - Step 1: Photos (charger, cable, parking spot)
   - Step 2: Location (drop pin on the map, address)
   - Step 3: Specs (power output in kW, connector type(s), cable length, number of simultaneous slots)
   - Step 4: Pricing (per kWh, per hour or flat fee)
   - Step 5: Availability (days, hours, 24/7, max session duration)
   - Step 6: Access and amenities (gate code, parking notes, WiFi, restroom, covered parking, and so on)
   - Step 7: Booking mode (instant or manual approval) and safety certificate upload
3. Submit. Status becomes **Pending review**. Admin approves or rejects with a reason.
4. Once approved, the listing appears on the map and the host starts earning.

## 6. Functional Requirements

Priority: **P0** = MVP must-have, **P1** = Phase 2, **P2** = Phase 3.

### 6.1 Authentication and Onboarding

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-AUTH-1 | Sign up and log in with email or phone number plus OTP | P0 |
| FR-AUTH-2 | Google sign-in | P0 |
| FR-AUTH-3 | Role selection at signup (Host or Driver) with ability to add the other role later | P0 |
| FR-AUTH-4 | Profile setup: name, photo, EV model, connector type | P0 |
| FR-AUTH-5 | ID and vehicle document verification (admin-reviewed) required before a host listing goes live; strongly prompted for drivers | P0 |
| FR-AUTH-6 | Session management, logout, password/OTP recovery | P0 |

### 6.2 Map and Discovery (Driver)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-MAP-1 | Live map with charger pins colour-coded by status: Available, In Use, Offline | P0 |
| FR-MAP-2 | Pin clustering when zoomed out | P0 |
| FR-MAP-3 | "Near me" one-tap button using browser geolocation, with a graceful fallback if permission is denied | P0 |
| FR-MAP-4 | Distance radius slider, 1 km to 50 km | P0 |
| FR-MAP-5 | Search by area, city or landmark with autocomplete | P0 |
| FR-MAP-6 | Pin preview card with photo, price, power, connector, rating, distance, travel time | P0 |
| FR-MAP-7 | Map and list view toggle, in sync with filters | P0 |
| FR-MAP-8 | Public pins show an approximate location only. The exact address is revealed after booking confirmation | P0 |
| FR-MAP-9 | Route-based search: enter a destination and see chargers along the route | P1 |

### 6.3 Filters and Sorting

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-FLT-1 | Connector type: Type 1, Type 2, CCS, CHAdeMO, GB/T | P0 |
| FR-FLT-2 | Power output: slow (3 to 7 kW), fast (11 to 22 kW), rapid (50 kW and above) | P0 |
| FR-FLT-3 | Price: cheapest first, free chargers only | P0 |
| FR-FLT-4 | Sort by nearest first and by highest rated | P0 |
| FR-FLT-5 | Available right now only | P0 |
| FR-FLT-6 | Amenities nearby: parking, café, restroom, shade/covered | P1 |
| FR-FLT-7 | Open 24/7 toggle | P1 |
| FR-FLT-8 | Instant book vs request-to-book toggle | P1 |
| FR-FLT-9 | Filters default to the driver's saved connector type; active filters are shown as removable chips with a clear-all control | P0 |

### 6.4 Charger Listing (Host)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-LST-1 | Upload multiple photos (charger, cable, parking), with a minimum of 2 required | P0 |
| FR-LST-2 | Exact location via map pin plus address; hidden publicly until booked | P0 |
| FR-LST-3 | Specs: power output (kW), connector type(s), cable length, simultaneous slots | P0 |
| FR-LST-4 | Pricing model: per kWh, per hour, or flat session fee | P0 |
| FR-LST-5 | Weekly availability schedule (days and hours) | P0 |
| FR-LST-6 | Access instructions (gate code, parking notes), shown only to confirmed drivers | P0 |
| FR-LST-7 | Amenities (WiFi, restroom, waiting area, covered parking) | P0 |
| FR-LST-8 | Instant booking vs manual approval | P0 |
| FR-LST-9 | Max session duration limit | P0 |
| FR-LST-10 | Electrical safety certificate upload | P0 |
| FR-LST-11 | Vacation mode (auto-pause listing) and instant on/off toggle | P1 |
| FR-LST-12 | Draft saving and listing status: Draft, Pending review, Live, Paused, Rejected | P0 |

### 6.5 Booking and Scheduling

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-BKG-1 | Real-time slot booking with calendar picker, preventing double booking | P0 |
| FR-BKG-2 | Instant confirmation or host approval flow with an expiry window for host response | P0 |
| FR-BKG-3 | Pre-booking connector compatibility check with a warning on mismatch | P0 |
| FR-BKG-4 | Booking timer: session auto-ends at the selected time | P0 |
| FR-BKG-5 | Cancel with policy rules; reschedule | P1 |
| FR-BKG-6 | Extend session request (if the next slot is free) | P1 |
| FR-BKG-7 | Waitlist for a busy charger | P1 |

### 6.6 Payments and Earnings

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-PAY-1 | In-app wallet with top-up and pay | P0 |
| FR-PAY-2 | UPI, card and net banking (international payments in Phase 2) | P0 |
| FR-PAY-3 | Per-session invoice or receipt | P0 |
| FR-PAY-4 | Host payouts to a bank account (weekly in MVP, instant in Phase 2) | P0 |
| FR-PAY-5 | Platform commission shown transparently to hosts before listing and per session | P0 |
| FR-PAY-6 | Host earnings dashboard: daily, weekly, monthly | P0 |
| FR-PAY-7 | Promo codes and referral credits | P1 |
| FR-PAY-8 | Subscription plan for frequent drivers | P1 |

### 6.7 Reviews and Trust

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-REV-1 | Driver rates host after each session (stars and comment) | P0 |
| FR-REV-2 | Host rates driver | P0 |
| FR-REV-3 | Report a charger (faulty, misrepresented, unsafe) with photo evidence | P0 |
| FR-REV-4 | Verified badge for hosts with 10 or more successful sessions | P1 |
| FR-REV-5 | Response rate and acceptance rate on host profile | P1 |
| FR-REV-6 | Charger health score based on uptime, reviews and reports | P1 |

### 6.8 Communication

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-COM-1 | In-app chat between driver and host without exposing phone numbers | P0 |
| FR-COM-2 | Automated messages: booking confirmed, driver en route, session started/ended | P0 |
| FR-COM-3 | Push/email notifications for key events | P0 |
| FR-COM-4 | SMS fallback | P1 |
| FR-COM-5 | Smart notifications ("Your favourite charger is now free") and price alerts | P1 |

### 6.9 Dashboards

**Host dashboard (P0 unless noted):** live view of who is charging now; total sessions, total kWh and total earnings; upcoming bookings calendar; payout history; instant on/off toggle; charger health log (P1).

**Driver dashboard:** charging history (location, kWh, cost, duration), favourites, saved home/work locations, spending summary by week/month (P1). Active session tracker with live percentage and time to full, plus EV range estimator (P2).

### 6.10 Admin Panel

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-ADM-1 | Approve or reject listings with a reason, and view submitted certificates | P0 |
| FR-ADM-2 | View and manage users, bookings and disputes | P0 |
| FR-ADM-3 | Revenue and commission dashboard | P0 |
| FR-ADM-4 | Fraud flags and ban management | P1 |
| FR-ADM-5 | Promo code creator and push notification broadcaster | P1 |
| FR-ADM-6 | City-wise charger density heatmap | P2 |

### 6.11 Safety and Compliance

- Admin approval before any listing goes live (P0)
- Electrical safety certification upload by host (P0)
- Emergency contact feature during a session (P1)
- Optional session insurance add-on (P1)
- Payment fraud detection (P1)
- Host liability and terms of use acknowledged at listing time (P0)

### 6.12 Smart Features and Gamification (Phase 2 and 3)

Route planner with range-based stops, Arrive and Charge remote unlock, carbon savings tracker, EV community feed, driver streak rewards, host leaderboard, badges (Eco Warrior, Power Host, Road Tripper), referral programme and Bronze/Silver/Gold host levels.

## 7. Data Model (high level)

- **User:** id, name, photo, email, phone, roles, verification status, wallet balance
- **Vehicle:** user, model, connector type, battery capacity
- **Charger:** host, status, location (exact and public/approximate), photos, power kW, connector types, cable length, slots, pricing model and rate, schedule, amenities, access instructions, safety certificate, booking mode, max duration, rating, health score
- **Booking:** driver, charger, slot start/end, status (requested, confirmed, active, completed, cancelled, rejected), price, commission, payment reference
- **Session:** booking, started/ended at, kWh delivered (manual or metered), receipt
- **Review:** booking, author, subject, stars, comment
- **Report/Dispute:** booking, reporter, category, evidence photos, status
- **Transaction:** wallet top-ups, payments, refunds, payouts
- **Message:** thread (per booking), sender, body, timestamp
- **Notification, PromoCode, Referral, Badge** (Phase 2 and later)

## 8. Design Requirements (from your DESIGN.md)

Your supplied DESIGN.md (written for the WattVision electricity-monitoring dashboard) is adopted as Evio's visual foundation. It already matches the tone Evio needs: reliable, technical and in control, in a dark, data-first style.

### 8.1 Visual theme

Dark mode only for v1. A simplified "Power BI-style" dashboard feel for end users. It should not feel like a social app or a game, even when gamification arrives in later phases.

### 8.2 Colour palette

| Token | Value | Use in Evio |
| --- | --- | --- |
| Background | `#121212` | Page background |
| Card surface | `#1E1E1E` | Cards, panels, listing cards |
| Card border / grid lines | `#2C2C2E` | Borders, table rows, chart grid |
| Primary accent | `#00E5FF` | Primary buttons, KPIs, chart lines, selected filters, map route line |
| Success / live | `#32D74B` | "Available" pins, live status, normal values |
| Alert | `#FF453A` | Errors, rejected, safety alerts, spikes |
| Alert background | `#3A1C1C` | Alert boxes |
| Text primary | `#FFFFFF` | Headings, values |
| Text secondary | `#98989D` | Labels, hints |
| Row hover | `#252525` | Table row hover |

**Additions needed for Evio:** map status colours. Proposed: Available `#32D74B`, In Use amber `#FFD60A` (new token), Offline `#98989D`. Red is reserved for alerts and errors so pins are not misread as warnings. Use a dark map style so the map matches the UI.

### 8.3 Component styling

- **Cards:** 16px radius, `#1E1E1E` background, 20px padding, 1px `#2C2C2E` border.
- **Charts (earnings, spending):** area charts, grid in `#2C2C2E`, data in `#00E5FF` with a green gradient fill, no heavy borders.
- **Tables (bookings, payouts, history):** rows with a 1px `#2C2C2E` bottom border, hover `#252525`.
- **Alerts:** background `#3A1C1C`, red text, 4px left border in `#FF453A`. Used for compatibility warnings, rejected listings and safety notices.

### 8.4 Typography

- Headings: Inter Semi Bold, 24px
- KPI numbers (kW, kWh, price, earnings): JetBrains Mono or Fira Code Bold, 32px
- Body: Inter Regular, 14px

### 8.5 Layout

- 12-column grid, spacing in multiples of 8px.
- **Host dashboard:** three KPI cards at the top (for example earnings, sessions, kWh delivered), main earnings chart across 8 columns, alerts and upcoming bookings in a 4-column right panel, as in your DESIGN.md.
- **Driver dashboard (map view):** map is the hero. Filter bar across the top, results list or preview panel in a side column, status chips overlaid on the map.
- Layout must collapse cleanly to a single column on tablet and mobile.

### 8.6 Do's and Don'ts

- Do use area charts for consumption and earnings trends.
- Do show price in local currency next to every kWh figure.
- Do use lightning-bolt, plug and meter iconography. Do not use generic light-bulb icons.
- Don't use pastel colours or white backgrounds.

### 8.7 Adaptation notes (please confirm)

1. **Currency:** your DESIGN.md says to show Bolivianos (`Bs.`), while the feature list uses ₹ and UPI. This PRD assumes the **launch market is India (₹)**, and the currency symbol must be configurable so the DESIGN.md rule ("always show the local currency equivalent next to kWh") holds in any market.
2. **Language:** the DESIGN.md is in Spanish. UI copy is assumed to be English for v1, with localisation planned.
3. **Terminology:** "Vampire load" alerts are specific to WattVision and are not needed in Evio.

## 9. Non-Functional Requirements

- **Performance:** map and results load in under 2 seconds on a 4G connection for a 50 km radius; filter changes update results in under 500 ms.
- **Real-time:** charger status and slot availability update live (WebSocket or equivalent).
- **Security:** encrypted data in transit and at rest; hashed credentials; role-based access; exact host addresses and gate codes only accessible to confirmed bookings; PCI-compliant payments through a gateway (no card data stored).
- **Privacy:** location shown approximately until booking is confirmed; phone numbers never shared between users; user data export and deletion on request.
- **Accessibility:** WCAG AA contrast (the palette passes on dark), keyboard navigation, visible focus states, labels on all form fields.
- **Reliability:** 99.5% uptime target; safe handling of payment failures and double-booking races.
- **Responsiveness:** fully usable from 360px mobile to desktop.

## 10. Suggested Technical Approach

| Layer | Suggestion |
| --- | --- |
| Frontend | React or Next.js with Tailwind CSS, tokens taken from the DESIGN.md palette |
| Maps | Mapbox GL JS (best dark-style support and clustering) or Google Maps Platform (Places search, directions) |
| Backend | Node.js (NestJS/Express) or Django, REST or GraphQL API |
| Database | PostgreSQL with PostGIS for radius and route queries |
| Real-time | WebSockets or a managed service (Supabase Realtime, Pusher) |
| Auth | Firebase Auth or Auth0 (email/phone OTP, Google) |
| File storage | S3 or Cloudinary for photos and documents |
| Payments | Razorpay (UPI, cards, netbanking, payouts to hosts) |
| Notifications | Firebase Cloud Messaging, email provider, SMS provider (MSG91/Twilio) |
| Hosting | Vercel plus managed backend, or AWS/GCP |

## 11. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Cold start: too few chargers to attract drivers (and vice versa) | Launch city by city; seed hosts with referral bonuses; zero commission for early hosts |
| Electrical and fire safety liability | Mandatory safety certificate, admin review, terms of use, optional insurance |
| Host privacy and safety (strangers at the home) | Approximate pins, verified drivers, chat without phone numbers, hosts can approve or reject |
| Off-platform payments to avoid commission | In-app chat filtering, transparent commission, incentives for staying on platform (insurance, reviews, receipts) |
| Inaccurate metering (no hardware at launch) | Start with time-based or flat pricing; host-confirmed kWh; smart-meter integration in Phase 3 |
| Fraud and fake listings | ID verification, photo requirement, admin approval, fraud flags |
| Connector mismatch wasting trips | Compatibility check at booking and clear connector filters |

## 12. Milestones (indicative)

| Milestone | Scope | Duration |
| --- | --- | --- |
| M0 – Discovery | Finalise PRD, wireframes using DESIGN.md, tech setup | 2 weeks |
| M1 – Foundations | Auth, onboarding, profiles, design system components | 3 weeks |
| M2 – Host side | Charger listing flow, photo upload, admin approval | 3 weeks |
| M3 – Driver side | Map, search, filters, charger detail | 4 weeks |
| M4 – Booking and payments | Booking, wallet/UPI, receipts, chat, notifications | 4 weeks |
| M5 – Dashboards and admin | Host and driver dashboards, reviews, admin panel | 3 weeks |
| M6 – Beta | QA, security review, closed beta in one city | 3 weeks |

## 13. Open Questions

1. Which city or region is the launch market (this decides currency, payment methods and legal requirements)?
2. What commission will Evio take (for example 10 to 15 percent), and is there a free period for early hosts?
3. Will hosts be able to meter kWh at launch, or should MVP pricing be time or flat-fee based?
4. Which verification method for ID (manual document review or a third-party KYC service)?
5. Should drivers be allowed to book before completing ID verification?
6. Is a light theme ever needed, or does Evio stay dark-only as in the DESIGN.md?
