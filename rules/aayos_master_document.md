# AAYOS – Master Document

**Name:** AAYOS – Automotive AI Yield Operations Service System
**Platform:** ServiceNow (Scoped app, Fluent SDK, Service Portal / UI Pages)
**Target users:** Workshop admins and technicians (no customer-facing portal)
**Primary goal:** Predict upcoming vehicle maintenance needs and automatically create and manage service tickets, so high-ticket automotive workshops reduce downtime and keep customer vehicles in good condition.

---

## 1. High-Level Concept

AAYOS is an AI-assisted maintenance planner and service ticketing system built entirely on ServiceNow:

* Stores **vehicle profiles** and **service history**.
* Periodically runs an **AI prediction engine** that looks at each vehicle’s data (and telematics, if available) and predicts upcoming maintenance needs.
* Automatically **creates service tickets** for high-confidence, near-term issues.
* Automatically **assigns technicians** to tickets based on skills and workload.
* Enforces a **6-hour technician response window**; if they don’t accept, the system auto-reassigns.
* Allows admins to manage everything through a **Service Portal / admin dashboard**.

No mobile app. Customers are contacted by the workshop outside the system (phone/email), and their responses are recorded via the admin portal.

Telematics is **optional**. AAYOS must still work properly using only manually entered vehicle data and service history.

---

## 2. Roles & Access Model

### Roles

* **AAYOS Admin (`x_aayos_admin` role or similar)**

  * Full control of the admin portal and data.
  * Can register vehicles, manage tickets, manage technicians, override AI decisions.

* **Technician (handled via Technician table + ACLs later)**

  * For now we treat technicians as data records only (no technician portal).
  * Admin sees whether a technician is assigned or not.

There is no end-user/customer portal.

---

## 3. Main Use Cases

1. **Register a Vehicle**

   * Admin uses a multi-step wizard to input vehicle details and basic service history.
   * Vehicle can be registered **with or without TCU/telematics**.

2. **Periodic AI Prediction**

   * A scheduled job runs (e.g., daily) and:

     * Fetches all “Active” vehicles.
     * Sends features to an AI service (Gemini or similar) or applies deterministic rules.
     * For each predicted issue:

       * Writes a record into the **Prediction** table.
       * Optionally auto-creates a **Service Ticket** if conditions satisfied.
       * Sets confidence, severity, urgency, etc.

3. **Ticket Lifecycle**

   * AI or admin creates a service ticket (status = `New`).
   * System auto-assigns a technician based on availability and skills.
   * Technician has **6 hours** to accept or decline.

     * If no response by deadline → auto-reassign to another suitable tech.
   * Admin contacts the customer externally and records whether the customer **accepts** or **rejects** the recommendation.
   * If accepted → ticket moves to `In Progress` / `Awaiting Workshop`.
   * After work completion → `Resolved` → `Closed` with closure code + notes.
   * If customer rejects or the recommendation is deemed wrong → ticket goes `Cancelled`.

4. **Admin Dashboard / Portal**

   * View KPIs (e.g., number of vehicles, open tickets, predicted high-risk issues).
   * View list of vehicles, technicians, and tickets.
   * Drill down into a vehicle to see its predictions & tickets.
   * Register new vehicle (wizard page).
   * See which technicians are currently free / overloaded.

---

## 4. ServiceNow Architecture Overview

* **Scoped app:** `AAYOS` (scope id like `x_1868112_aayos`)
* **Data model:** 4 core custom tables

  * Vehicle
  * Prediction
  * Service Ticket
  * Technician
* **Presentation:** Service Portal / UI Pages

  * `aayos_dashboard` – admin home
  * `aayos_vehicles` – vehicle list
  * `aayos_vehicle_register` – multi-step registration wizard
  * `aayos_vehicle_details` – single vehicle view
  * `aayos_tickets` – ticket list + detail
  * `aayos_technicians` – technician list + detail
* **Automation:** Scheduled job(s), Flow Designer / Scripted logic for:

  * Prediction run
  * Ticket creation from prediction
  * Technician auto-assignment
  * Technician auto-reassignment after 6 hours
* **AI integration:**

  * Outbound REST to Gemini (or ServiceNow Predictive Intelligence if used later).
  * AI returns predicted issues; system computes confidence scores and saves.

---

## 5. Data Model (Tables & Fields)

### 5.1 Vehicle Table

Table: `x_aayos_vehicle` (name may differ but conceptually this is “Vehicle”)
**Primary key/display:** `number` + `vin` + `owner_name` on forms.

Custom fields (in addition to standard `sys_created_on`, etc.):

* `number` (String)

  * Autonumber using script default value, e.g.
    `javascript:global.getNextObjNumberPadded('VHC', 7)`
  * Display value in lists.

* `vehicle_id` (String)

  * Optional internal ID; can mirror `number` or be free-text.

* `plate_number` (String)

* `vin` (String)

* `make` (String)

* `model` (String)

* `model_year` (Integer)

* `vehicle_category` (Choice)

  * Values: `sedan`, `suv`, `pickup`, `van`, `truck`, `bus`, `heavy_equipment`, `other`

* `fuel_type` (Choice)

  * Values: `gasoline`, `diesel`, `hybrid`, `ev`, `lpg`, `other`

* `transmission` (Choice)

  * Values: `automatic`, `manual`, `cvt`, `other`

* `owner_name` (String)

* `owner_phone` (String)

* `owner_email` (String)  // using String type; validation can be added later

* `current_mileage` (Integer)

  * Mileage at last update (km or miles; choose one standard).

* `estimated_monthly_mileage` (Integer)

  * For prediction horizon (e.g., 1000 km/month).

* `usage_type` (Choice)

  * Values:

    * `personal`
    * `commercial`
    * `fleet`
    * `ride_hailing`
    * `delivery`
    * `agricultural`
    * `emergency_service`
    * `other`

* `load_type` (Choice)

  * Values:

    * `light`
    * `medium`
    * `heavy`
    * `people`
    * `mixed`
    * `other`

* `driving_condition_profile` (Choice)

  * Values:

    * `mostly_highway`
    * `mostly_city`
    * `off_road`
    * `mixed`
    * `extreme_heat`
    * `extreme_cold`
    * `mountainous`
    * `coastal`
    * `other`

* `has_tcu` (True/False)

  * Indicates whether telematics data is available.
  * If true, future integrations can push telematics into another table and link here.

#### Service history fields:

* `last_service_date` (Date)

* `last_service_odometer` (Integer)

* `last_oil_change_date` (Date)

* `last_oil_change_odometer` (Integer)

* `last_brake_service_date` (Date)

* `last_brake_service_odometer` (Integer)

* `last_tire_service_date` (Date)

* `last_tire_service_odometer` (Integer)

* `last_battery_service_date` (Date)

* `last_battery_service_odometer` (Integer)

#### Prediction meta fields:

* `vehicle_status` (Choice)

  * Values: `active`, `inactive`, `sold`, `scrapped`, `testing_only`

* `last_prediction_run` (Date/Time)

  * Last time the prediction engine processed this vehicle.

* `last_risk_level` (Choice)

  * Values: `low`, `medium`, `high`, `critical`
  * Derived from the latest high-severity prediction; used for dashboard flags.

---

### 5.2 Prediction Table

Table: `x_aayos_prediction`

One record = one AI prediction for a specific vehicle and specific issue.

Fields:

* `number` (optional autonumber if desired)

* `vehicle` (Reference → Vehicle table)

  * Required; links the prediction to a vehicle.

* `predicted_date` (Date)

  * When the issue is expected to become relevant (e.g., due date of service).

* `predicted_issue` (String, long enough)

  * Free-text description: “Front brake pad replacement”, “Engine oil change due”, etc.

* `severity_level` (Choice)

  * `low`, `medium`, `high`, `critical`
  * How bad the issue is if ignored.

* `urgency_level` (Choice)

  * `routine`, `soon`, `urgent`
  * Rough timeframe: routine = can be done at next visit, urgent = within days.

* `confidence_score` (Decimal)

  * Numeric 0.0–1.0 (or 0–100%) representing system-calculated trust in the prediction.
  * System, not the LLM, should derive this (e.g., based on rules / data completeness).

* `source_type` (Choice)

  * `vehicle_profile` – based mainly on static fields & usage.
  * `service_history` – based on past services & intervals.
  * `telematics` – based on live vehicle data.
  * `mixed` – combination of the above.

* `recommended_action` (String)

  * Suggested work: “Replace front pads and resurface rotors”, etc.

* `ai_explanation` (String, multi-line)

  * Short explanation for admins:

    * e.g., “Brake pads last changed 18 months / 25,000 km ago; driving profile is mostly city; typical interval is 20,000–30,000 km.”

* `data_inputs_used` (String)

  * Semi-structured list of fields used, e.g.:

    * `["current_mileage", "last_brake_service_odometer", "estimated_monthly_mileage"]`

* `linked_ticket` (Reference → Service Ticket table)

  * If an actual ticket was generated from this prediction.

* `linked_ticket_status` (String or Choice)

  * Snapshot of ticket status when last synced (optional convenience).

Standard `sys_created_on`, etc., also present.

---

### 5.3 Service Ticket Table

Table: `x_aayos_service_ticket`

Represents a maintenance job suggestion created by AI or manually by admin.

Core fields:

* `number` (String, autonumber)

  * Default script like:
    `javascript:global.getNextObjNumberPadded('STK', 7)`

* `vehicle` (Reference → Vehicle table)

  * The vehicle to be serviced (required).

* `prediction` (Reference → Prediction table)

  * Optional; if ticket originates from a prediction.

* `creation_type` (Choice)

  * `ai_predicted`, `manual_admin`

#### Customer (denormalized for readability)

These duplicate vehicle owner data at the time the ticket is created:

* `customer_name` (String)
* `customer_phone` (String)
* `customer_email` (String)

#### Status & workflow fields

* `ticket_status` (Choice) – main lifecycle

  * `new`
  * `awaiting_customer`
  * `awaiting_workshop`
  * `in_progress`
  * `on_hold`
  * `resolved`
  * `closed`
  * `cancelled`

* `customer_response` (Choice)

  * `pending`, `accepted`, `rejected`, `rescheduled`

* `customer_response_time` (Date/Time)

* `technician` (Reference → Technician table)

  * The currently assigned technician.

* `technician_ack_status` (Choice)

  * `unassigned`
  * `pending_response`
  * `accepted`
  * `declined`
  * `reassigned`

* `technician_ack_time` (Date/Time)

* `auto_reassign_deadline` (Date/Time)

  * Set when a technician is assigned: created time + 6 hours.
  * A scheduled job checks expired deadlines and reassigns.

#### Scheduling & work info

* `requested_window_start` (Date/Time)

* `requested_window_end` (Date/Time)

* `estimated_duration_hours` (Decimal)

* `parts_confirmed` (True/False)

  * Whether the workshop confirmed that required parts & supplies are available.
  * This is a simple flag; no full inventory system.

* `workshop_notes` (String) – notes from admin/service advisor.

* `technician_notes` (String) – notes from technician during/after work.

#### Closing fields

* `resolution_summary` (String)

* `closure_code` (Choice)

  * `completed_as_planned`
  * `different_issue_found`
  * `customer_no_show`
  * `cancelled_by_customer`
  * `cancelled_by_workshop`

* `closed_at` (Date/Time)

---

### 5.4 Technician Table

Table: `x_aayos_technician`

Represents workshop technicians. Used to drive ticket auto-assignment.

Fields:

* `number` (String, autonumber)

  * e.g., `TECH0001`.

* `technician_id` (String)

  * Human-readable ID or badge number.

* `full_name` (String)

* `phone` (String)

* `email` (String)

* `skill_level` (Choice)

  * `junior`, `mid`, `senior`, `master`

* `specialization` (Choice or multi-choice)

  * `engine`, `brakes`, `electrical`, `hvac`, `tires`, `suspension`, `diagnostics`, `ev_hybrid`, `general`, `other`

* `skill_tags` (String)

  * Free-form tags list for more granular matching.

* `max_concurrent_jobs` (Integer)

  * Upper limit of simultaneously open tickets assigned.

* `current_open_jobs` (Integer)

  * Derived or periodically updated count.

* `is_active` (True/False)

* `shift_start` (Time)

* `shift_end` (Time)

* `last_assigned_time` (Date/Time)

  * For load balancing (round-robin style assignment).

---

## 6. Prediction & Ticket Logic

### 6.1 Prediction Job

* Implemented as a **scheduled script or Flow** in ServiceNow.
* Runs daily (or configurable interval). Steps:

1. Query `Vehicle` table:

   * Only `vehicle_status = active`.
2. For each vehicle:

   * Compute derived features:

     * Mileage since last service, estimated future mileage, time since each last service.
   * Build a payload JSON with:

     * Vehicle static data (make, model, year, usage, etc.).
     * Service history fields.
     * (Later) telematics snapshot if `has_tcu = true`.
3. Call AI service (Gemini) OR rule engine:

   * AI returns 0..N predicted issues for that vehicle, each with:

     * Issue description
     * Recommended due date/interval
     * Severity and urgency (or raw signal to derive them)
4. For each returned issue:

   * Compute a **confidence_score** in system logic (e.g., based on data completeness + AI suggestion).
   * Insert a record into `Prediction` table.
   * Update `vehicle.last_prediction_run` and `vehicle.last_risk_level` (max of severity).

### 6.2 Ticket Auto-Creation Rules

For each prediction:

* If `severity_level ∈ {high, critical}` AND `urgency_level ∈ {soon, urgent}` AND `confidence_score ≥ threshold` (e.g., 0.7)

  * Check whether an **open ticket** already exists for the same vehicle and similar issue:

    * same `vehicle` and `ticket_status` not in (`closed`, `cancelled`) and similar `predicted_issue`.
    * If yes → link prediction to existing ticket instead of creating a new one.
  * Otherwise:

    * Create a new **Service Ticket** with:

      * `vehicle`, `prediction`, `creation_type = ai_predicted`
      * Snapshot owner info into `customer_name`, `customer_phone`, `customer_email`.
      * Default `ticket_status = awaiting_customer` (or `new`, depending on flow design).
    * Set up technician auto-assignment (see 6.3).

**Bundling logic (optional/for later):**

* If multiple issues from the same prediction run have due dates within a small window (e.g. 7 days) for the same vehicle (e.g. oil + brakes), we can:

  * Either create a single ticket with description listing all recommended tasks.
  * Or leave separate predictions but link them to one ticket.

For now, simplest path: one ticket per prediction, but we *can* allow multiple predictions to link to a single ticket.

---

### 6.3 Technician Auto-Assignment

When a ticket is created (AI or manual):

1. Filter technicians:

   * `is_active = true`
   * `current_open_jobs < max_concurrent_jobs`
   * Optional: specialization matching the issue type (e.g., “brakes”).
2. Sort candidate technicians by:

   * `current_open_jobs` ascending
   * `last_assigned_time` ascending
3. Pick the top candidate:

   * Set `ticket.technician = candidate`.
   * Update:

     * `ticket.technician_ack_status = pending_response`
     * `ticket.auto_reassign_deadline = now() + 6 hours`
     * `candidate.current_open_jobs++`
     * `candidate.last_assigned_time = now()`

A background job runs every 15 minutes (or similar) to:

* Find tickets where:

  * `technician_ack_status = pending_response` AND `auto_reassign_deadline < now()` AND `ticket_status` not in (`resolved`, `closed`, `cancelled`)
* Recompute assignment (same logic as above), set `technician_ack_status = reassigned` on the old assignment, and notify the new one.

Technician acceptance/decline is currently simulated/admin-driven:

* Admin updates `technician_ack_status` to `accepted` when technician confirms.
* If technician declines → admin sets `technician_ack_status = declined` and triggers manual reassignment or uses same algorithm.

---

### 6.4 Customer Response Handling

Admin contacts the customer externally (call/email), then:

* If the customer agrees to service:

  * Set:

    * `customer_response = accepted`
    * `ticket_status = awaiting_workshop` (or `in_progress` if vehicle already in)
    * Optionally set `requested_window_start`/`end`.

* If the customer declines:

  * Set:

    * `customer_response = rejected`
    * `ticket_status = cancelled`
    * `closure_code = cancelled_by_customer`
  * This negative feedback can later be used to retrain or adjust the AI / thresholds.

---

## 7. State Model (Summary)

Ticket `ticket_status` transitions roughly:

* `new`
  → `awaiting_customer` (after AI creation)
  → `awaiting_workshop` (customer accepted, workshop scheduling)
  → `in_progress` (technician working)
  → `on_hold` (waiting on parts / customer / other)
  → `resolved` (work completed; pending payment / admin check)
  → `closed` (customer picked up vehicle, payment done)

Alternate / cancel routes:

* `new` or `awaiting_customer` or `awaiting_workshop` → `cancelled` (customer rejects, or admin cancels).
* `in_progress` → `cancelled` (if discovered that work is not needed and job is cancelled).

---

## 8. Service Portal / UI Concept

Admin portal only. Built as Fluent UI pages (already partially created, but this is the target behavior).

### 8.1 `aayos_dashboard`

* Shows:

  * Count of Active Vehicles.
  * Count of Open Tickets by status.
  * Count of High/Critical risk vehicles.
* Quick actions:

  * “Register New Vehicle” button → `aayos_vehicle_register`.
  * “View Vehicles” → `aayos_vehicles`.
  * “View Tickets” → `aayos_tickets`.
  * “View Technicians” → `aayos_technicians`.

### 8.2 `aayos_vehicles` (Vehicle List)

* Table view of `Vehicle` records:

  * Columns: `number`, `owner_name`, `vin`, `plate_number`, `vehicle_status`, `last_risk_level`, `last_prediction_run`, `has_tcu`.
* Row click → open `aayos_vehicle_details`.

### 8.3 `aayos_vehicle_register` (Vehicle Registration Wizard)

Multi-step form (all data written to Vehicle table):

1. **Step 1: Basic Vehicle Info**

   * make, model, model_year, vehicle_category, fuel_type, transmission, vin, plate_number.

2. **Step 2: Owner & Usage**

   * owner_name, owner_phone, owner_email, usage_type, load_type, driving_condition_profile, has_tcu.

3. **Step 3: Service History**

   * current_mileage, estimated_monthly_mileage
   * last_service_date, last_service_odometer
   * last_oil_change_date, last_oil_change_odometer
   * last_brake_service_date, last_brake_service_odometer
   * last_tire_service_date, last_tire_service_odometer
   * last_battery_service_date, last_battery_service_odometer

4. **Step 4: Review & Save**

   * Show summary; when submitted:

     * Insert into Vehicle table.
     * Optionally trigger an immediate prediction run for that vehicle.

### 8.4 `aayos_vehicle_details`

* Shows:

  * All vehicle fields (read-only).
  * Recent Predictions (list from Prediction table).
  * Related Tickets.
  * Button: “Run prediction now” (for debugging; calls prediction logic for this vehicle only).

### 8.5 `aayos_tickets`

* List of Service Tickets:

  * Filters by status.
  * Columns: `number`, `vehicle`, `ticket_status`, `customer_response`, `technician`, `auto_reassign_deadline`.

* Detail pane:

  * Show prediction data (if linked).
  * Customer and technician info.
  * Controls to change `ticket_status`, `customer_response`, etc.

### 8.6 `aayos_technicians`

* List of technicians:

  * `number`, `full_name`, `specialization`, `current_open_jobs`, `is_active`.
* Detail view shows:

  * All technician fields.
  * List of open tickets assigned.

---

## 9. Implementation Notes for Cursor

1. **Fluent SDK**

   * Tables are defined in `/src/fluent/tables/*.now.ts` (vehicle, prediction, service_ticket, technician).
   * UI pages are in `/src/fluent/ui-pages/*.now.ts`.
   * Keep schemas in sync with this document.

2. **Autonumber defaults**

   * For `number` fields, use `defaultValue` script:
     `javascript:global.getNextObjNumberPadded('PREFIX', 7)` (in the table config within ServiceNow, not necessarily the Fluent code; treat this as config info).

3. **Scheduled logic**

   * Prefer a dedicated server script/module (e.g. `src/server/predictionJob.ts`) invoked from a Scheduled Script in platform.
   * That script should:

     * Query vehicles,
     * Call AI client (REST),
     * Insert predictions & tickets.

4. **AI client abstraction**

   * Implement a small client wrapper for calling Gemini (or whichever model).
   * The wrapper should accept a normalized payload and return a structured list `{ issue, dueDate, severity, urgency, rawScore }`.
   * DO NOT put ServiceNow record logic in the AI client; keep it separate.

5. **Confidence Score Calculation**

   * Implement as a pure function in code (not delegated to AI).
   * Example heuristics:

     * Start from AI’s suggested score (if any) or base constant.
     * Apply penalties if key inputs are missing: current_mileage, service history, etc.
   * Keep function reusable for future adjustment.

6. **Technician assignment**

   * Implement as pure function: given a list of technicians and ticket attributes, return `bestTechnicianId`.
   * Then call it from ticket creation and reassign flows.

---

This document should give Cursor enough context to:

* Understand the purpose of the AAYOS app.
* Work safely inside the `AAYOS` scope without inventing new tables or random fields.
* Implement UI pages, server scripts, and integration logic consistent with the decisions we have already made.
