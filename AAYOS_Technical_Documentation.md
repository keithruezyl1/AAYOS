AAYOS Technical Documentation

System Name: AAYOS – Automotive AI Yield Operations Service System  
Platform: ServiceNow (Scoped Application)  
Scope ID: `x_1868112_aayos`  
Application ID: `992cea7c971db250ec453b90f053af4b`  
Document Version: 1.0  
Last Updated: December 2025

Table of Contents

1. [Requirements](#requirements)
2. [Flow](#flow)
3. [Custom Tables](#custom-tables)
4. [Scripts](#scripts)
5. [Custom Fields on Custom Tables](#custom-fields-on-custom-tables)
6. [Notifications](#notifications)
7. [Integration](#integration)



Requirements
Business Requirements
1. Vehicle Management   - Register and manage vehicle profiles with comprehensive service history
   - Support vehicles with or without telematics (TCU) capabilities
   - Track vehicle status (active, inactive, decommissioned)
   - Monitor vehicle risk levels based on predictions

2. AI-Powered Predictive Maintenance   - Automatically predict upcoming vehicle maintenance needs using AI (Gemini/OpenAI)
   - Process predictions for all active vehicles on a scheduled basis
   - Calculate confidence scores based on data completeness
   - Store prediction history for audit and analysis

3. Automated Ticket Management   - Auto-create service tickets from high-confidence predictions
   - Automatically assign technicians based on availability and skills
   - Enforce 6-hour technician response window with auto-reassignment
   - Track ticket lifecycle from creation to closure

4. Customer Communication   - Notify customers of predicted maintenance needs via email
   - Track customer acceptance/rejection of service recommendations
   - Record customer decisions and response times


5. Technician Management   - Manage technician profiles with skills and capacity
   - Track technician workload and availability
   - Implement round-robin assignment algorithm
   - Monitor technician response times and acceptance rates


Functional Requirements

1. Vehicle Registration   - Multi-step wizard interface for vehicle registration
   - Capture vehicle specifications (make, model, year, category, fuel type, transmission)
   - Record owner information and contact details
   - Input service history (oil changes, brake service, tire service, battery service)
   - Set usage profiles (usage type, load type, driving conditions)

2. Prediction Engine   - Scheduled job runs weekly to scan all active vehicles
   - Integrate with AI service (Gemini API or internal Scripted REST API)
   - Generate predictions with severity, urgency, and confidence scores
   - Store raw AI responses for audit purposes

3. Ticket Auto-Creation   - Create tickets automatically for high/critical severity predictions
   - Link predictions to tickets
   - Prevent duplicate tickets for same vehicle/issue
   - Set appropriate service windows based on severity/urgency

4. Technician Assignment   - Round-robin assignment respecting capacity limits
   - Match technicians by specialization when possible
   - Fallback to least-loaded technician if all at capacity
   - Update technician workload counters automatically

5. Dashboard & Reporting   - Display KPI metrics (active vehicles, open tickets, high-risk vehicles)
   - View vehicle, ticket, and technician lists
   - Drill-down into vehicle details with predictions and tickets
   - Filter and search capabilities


Technical Requirements

1. ServiceNow Platform   - Scoped application with namespace `x_1868112_aayos`
   - Custom tables with proper indexing
   - Script includes for business logic
   - Scheduled jobs for automation
   - Service Portal pages for admin interface

2. Integration   - REST API integration with Gemini AI service (optional)
   - Scripted REST API for internal AI prediction service
   - Email notifications via ServiceNow email actions

3. Security   - Role-based access control (AAYOS Admin role)
   - ACLs for data protection
   - Scoped application isolation



Flow

 1. Vehicle Registration Flow

Admin → Vehicle Registration Wizard
  ├─ Step 1: Basic Vehicle Information
  │   ├─ Make, Model, Year
  │   ├─ Vehicle Category, Fuel Type, Transmission
  │   └─ VIN, Plate Number
  ├─ Step 2: Owner & Usage Information
  │   ├─ Owner Name, Phone, Email
  │   ├─ Usage Type, Load Type
  │   ├─ Driving Condition Profile
  │   └─ Has TCU (Telematics)
  ├─ Step 3: Service History & Mileage
  │   ├─ Current Mileage, Estimated Monthly Mileage
  │   ├─ Last Service Date/Odometer
  │   ├─ Last Oil Change Date/Odometer
  │   ├─ Last Brake Service Date/Odometer
  │   ├─ Last Tire Service Date/Odometer
  │   └─ Last Battery Service Date/Odometer
  └─ Step 4: Review & Submit
      └─ Create Vehicle Record → Set Status = Active

 2. Prediction Processing Flow

Scheduled Job (Weekly) → PredictionService.runDailyVehicleScan()
  ├─ Query Active Vehicles
  ├─ For Each Vehicle:
  │   ├─ Prepare Vehicle Data Payload
  │   ├─ Call AI Engine (Scripted REST API)
  │   │   └─ Endpoint: /api/x_1868112_aayos/openai_vehicle_prediction/predict
  │   ├─ Parse AI Response
  │   │   ├─ Extract Severity, Urgency, Issues
  │   │   ├─ Calculate Confidence Score
  │   │   └─ Determine Target Service Date
  │   ├─ Create Prediction Record
  │   │   ├─ Link to Vehicle
  │   │   ├─ Store Raw AI Response
  │   │   ├─ Set Severity, Urgency, Confidence
  │   │   └─ Set Source Type = daily_job
  │   └─ Evaluate Ticket Creation Criteria
  │       ├─ If Severity = high/critical OR (Severity = medium AND Confidence >= 70)
  │       │   └─ Create Ticket
  │       └─ Else: Store Prediction Only
  └─ Update Vehicle
      ├─ Set last_prediction_run = Now
      └─ Set last_risk_level = Max Severity

 3. Ticket Creation Flow

Prediction Created → Ticket Auto-Creation Logic
  ├─ Check Ticket Creation Criteria
  │   ├─ Severity = high/critical OR
  │   └─ (Severity = medium AND Confidence >= 70)
  ├─ Check for Existing Open Tickets
  │   ├─ Same Vehicle
  │   ├─ Status NOT IN (closed, cancelled, resolved)
  │   └─ Similar Issue Summary
  ├─ If Existing Ticket Found:
  │   └─ Link Prediction to Existing Ticket
  └─ Else: Create New Ticket
      ├─ Set Vehicle, Prediction, Customer
      ├─ Set Ticket Type = predicted_maintenance
      ├─ Set Source = ai
      ├─ Set Status = new
      ├─ Set Severity, Urgency from Prediction
      ├─ Calculate Service Windows
      │   ├─ Target Service Date (1-5 days based on severity)
      │   ├─ Service Window Start = Now
      │   └─ Service Window End (3-14 days based on severity)
      ├─ Set Technician Response Due = Now + 6 hours
      ├─ Assign Technician (Round-Robin)
      │   ├─ Filter Active Technicians
      │   ├─ Check Capacity (current_open_tickets < max_concurrent_tickets)
      │   ├─ Round-Robin Selection
      │   └─ Update Technician Workload
      ├─ Set Customer Decision = pending
      ├─ Set Customer Notified = true
      └─ Trigger Email Notification

 4. Technician Assignment Flow

Ticket Created → Technician Auto-Assignment
  ├─ Query Active Technicians
  │   ├─ Status = active
  │   └─ current_open_tickets < max_concurrent_tickets
  ├─ Round-Robin Selection
  │   ├─ Get Last Assigned Technician (from System Property)
  │   ├─ Start from Next Technician in List
  │   └─ Find First Available Technician
  ├─ If All Technicians at Capacity:
  │   └─ Select Technician with Lowest Open Count
  ├─ Assign Technician to Ticket
  │   ├─ Set assigned_technician
  │   ├─ Set technician_response = pending
  │   ├─ Set technician_response_due = Now + 6 hours
  │   └─ Set last_assignment_time = Now
  └─ Update Technician Record
      ├─ Increment current_open_tickets
      └─ Update last_assigned_time

 5. Ticket Lifecycle Flow

Ticket Created (Status = new)
  ├─ Email Sent to Customer
  ├─ Technician Assigned
  │   └─ 6-Hour Response Window Starts
  ├─ Customer Decision
  │   ├─ Accepted → Status = in_progress
  │   └─ Declined → Status = cancelled
  ├─ Technician Response
  │   ├─ Accepted → Continue Processing
  │   ├─ Declined → Reassign to Another Technician
  │   └─ No Response (6 hours) → Auto-Reassign
  ├─ Service Performed
  │   └─ Status = on_hold (if waiting) OR in_progress
  └─ Ticket Closure
      ├─ Status = resolved → closed
      ├─ Set Resolution Summary
      ├─ Set Closed Date
      └─ Update Technician Workload

 6. Technician Reassignment Flow

Technician Response Deadline Expired
  ├─ Query Tickets
  │   ├─ technician_response = pending
  │   ├─ technician_response_due < Now
  │   └─ Status NOT IN (resolved, closed, cancelled)
  ├─ For Each Ticket:
  │   ├─ Find Next Available Technician
  │   │   └─ Same Round-Robin Logic
  │   ├─ Reassign Ticket
  │   │   ├─ Update assigned_technician
  │   │   ├─ Reset technician_response_due = Now + 6 hours
  │   │   └─ Increment reassignment_count
  │   └─ Update Technician Counts
  │       ├─ Decrement Old Technician's Count
  │       └─ Increment New Technician's Count
  └─ Log Reassignment Event



Custom Tables

 1. Vehicle Table (`x_1868112_aayos_vehicle`)

Purpose: Stores vehicle profiles, specifications, service history, and prediction metadata.

Key Fields:- `number` (String, Auto-number) - Vehicle ID
- `make` (String, Mandatory) - Vehicle make
- `model` (String, Mandatory) - Vehicle model
- `model_year` (String, Mandatory) - Model year
- `plate` (String, Mandatory) - License plate number
- `vin` (String) - Vehicle Identification Number
- `customer` (Reference → x_1868112_aayos_customer, Mandatory) - Owner reference
- `vehicle_status` (Choice, Mandatory, Default: active) - Status: active, inactive, decommissioned
- `fuel_type` (Choice, Mandatory, Default: gasoline) - gasoline, diesel, hybrid, electric_vehicle_ev, other
- `transmission` (Choice, Mandatory, Default: automatic) - automatic, manual, cvt, other
- `usage_type` (Choice, Mandatory, Default: personal) - personal, commercial, fleet, other
- `load_type` (Choice, Default: light) - light, medium, heavy, passenger, other
- `driving_condition_profile` (Choice, Mandatory, Default: urban) - urban, highway, mixed, off_road
- `current_mileage` (Integer, Mandatory) - Current odometer reading
- `estimated_monthly_mileage` (Integer, Mandatory) - Estimated monthly mileage
- `has_tcu` (Boolean) - Has Telematics Control Unit
- `last_service_date` (Date) - Last general service date
- `last_service_odometer` (Integer) - Odometer at last service
- `last_oil_change_date` (Date) - Last oil change date
- `last_oil_change_odometer` (Integer) - Odometer at last oil change
- `last_brake_service_date` (Date) - Last brake service date
- `last_brake_service_odometer` (Integer) - Odometer at last brake service
- `last_tire_service_date` (Date) - Last tire service date
- `last_tire_service_odometer` (Integer) - Odometer at last tire service
- `last_battery_service_date` (Date) - Last battery service date
- `last_battery_service_odometer` (Integer) - Odometer at last battery service
- `last_prediction_run` (DateTime) - Last time prediction was run
- `last_risk_level` (Choice, Mandatory, Default: low) - low, medium, high, critical

Indexes:- Index on `customer` field

Relationships:- One-to-Many with `x_1868112_aayos_prediction` (via `vehicle` field)
- One-to-Many with `x_1868112_aayos_ticket` (via `vehicle` field)
- Many-to-One with `x_1868112_aayos_customer` (via `customer` field)

 2. Prediction Table (`x_1868112_aayos_prediction`)

Purpose: Stores AI-generated predictions for vehicle maintenance needs.

Key Fields:- `number` (String, Auto-number) - Prediction ID
- `vehicle` (Reference → x_1868112_aayos_vehicle, Mandatory) - Vehicle reference
- `customer` (Reference → x_1868112_aayos_customer) - Customer reference
- `predicted_issue` (String, Mandatory) - Description of predicted issue
- `predicted_date` (Date) - Expected date for maintenance
- `severity` (Choice, Mandatory, Default: low) - low, medium, high, critical
- `urgency` (Choice, Mandatory, Default: low) - low, medium, high
- `system_confidence_score` (Decimal, Mandatory) - System-calculated confidence (0-100)
- `confidence` (Decimal) - AI-provided confidence score
- `source_type` (Choice, Mandatory, Default: daily_job) - daily_job, manual_run, imported
- `ai_explanation` (String) - AI explanation for the prediction
- `data_inputs_used` (String) - JSON of vehicle data used for prediction
- `raw_ai_response` (String) - Raw JSON response from AI service
- `linked_ticket` (Reference → x_1868112_aayos_ticket, Mandatory) - Associated ticket

Indexes:- Index on `customer` field
- Index on `linked_ticket` field
- Index on `vehicle` field

Relationships:- Many-to-One with `x_1868112_aayos_vehicle` (via `vehicle` field)
- Many-to-One with `x_1868112_aayos_customer` (via `customer` field)
- Many-to-One with `x_1868112_aayos_ticket` (via `linked_ticket` field)

 3. Ticket Table (`x_1868112_aayos_ticket`)

Purpose: Manages service tickets created from predictions or manually.

Key Fields:- `number` (String, Auto-number) - Ticket ID
- `vehicle` (Reference → x_1868112_aayos_vehicle, Mandatory) - Vehicle reference
- `customer` (Reference → x_1868112_aayos_customer) - Customer reference
- `prediction` (Reference → x_1868112_aayos_prediction) - Source prediction
- `ticket_type` (Choice, Mandatory, Default: predicted_maintenance) - predicted_maintenance, customer_requested, technician_flagged
- `source` (Choice, Mandatory, Default: ai) - ai, manual_admin, imported
- `status` (Choice, Mandatory, Default: new) - new, in_progress, on_hold, closed, cancelled
- `severity` (Choice, Mandatory, Default: low) - low, medium, high, critical
- `urgency` (Choice, Mandatory, Default: low) - low, medium, high
- `assigned_technician` (Reference → x_1868112_aayos_technician) - Assigned technician
- `technician_response` (Choice, Default: pending) - pending, accepted, declined
- `technician_response_due` (DateTime, Mandatory) - Deadline for technician response
- `customer_decision` (Choice, Mandatory) - pending, accepted, declined
- `customer_decision_date` (DateTime) - When customer responded
- `customer_notified` (Boolean) - Whether customer was notified
- `target_service_date` (Date) - Target date for service
- `service_window_start` (DateTime) - Service window start time
- `service_window_end` (DateTime) - Service window end time
- `actual_service_date` (Date) - Actual service completion date
- `prediction_validity` (Choice, Default: correct) - correct, partially_correct, incorrect, not_applicable
- `reassignment_count` (Integer) - Number of times ticket was reassigned
- `resolution_summary` (String) - Summary of resolution
- `closed_date` (DateTime) - Date ticket was closed

Indexes:- Index on `assigned_technician` field
- Index on `customer` field
- Index on `prediction` field
- Index on `vehicle` field

Relationships:- Many-to-One with `x_1868112_aayos_vehicle` (via `vehicle` field)
- Many-to-One with `x_1868112_aayos_customer` (via `customer` field)
- Many-to-One with `x_1868112_aayos_prediction` (via `prediction` field)
- Many-to-One with `x_1868112_aayos_technician` (via `assigned_technician` field)

 4. Technician Table (`x_1868112_aayos_technician`)

Purpose: Manages technician profiles and workload tracking.

Key Fields:- `number` (String, Auto-number) - Technician ID
- `name` (String, Mandatory, Display Field) - Technician full name
- `email` (String, Mandatory) - Email address
- `phone` (String, Mandatory) - Phone number
- `status` (Choice, Mandatory, Default: active) - active, on_leave, inactive
- `user` (Reference → sys_user) - Linked ServiceNow user
- `primary_skill_category` (String) - Primary skill specialization
- `max_concurrent_tickets` (Integer, Mandatory, Default: 5) - Maximum concurrent tickets
- `current_open_tickets` (Integer) - Current open ticket count

Indexes:- Index on `user` field

Relationships:- One-to-Many with `x_1868112_aayos_ticket` (via `assigned_technician` field)
- Many-to-One with `sys_user` (via `user` field)

 5. Customer Table (`x_1868112_aayos_customer`)

Purpose: Stores customer/owner information separate from vehicles.

Key Fields:- `number` (String, Auto-number, Mandatory) - Customer ID
- `name` (String, Mandatory, Display Field) - Customer name
- `email` (String, Mandatory) - Email address
- `phone` (String, Mandatory) - Phone number
- `address_line_1` (String) - Street address line 1
- `addres_line_2` (String) - Street address line 2
- `city` (String) - City
- `state_province` (String) - State/Province
- `postal_code` (String) - Postal/ZIP code
- `country` (String) - Country
- `user` (Reference → sys_user) - Linked ServiceNow user

Indexes:- Index on `user` field

Relationships:- One-to-Many with `x_1868112_aayos_vehicle` (via `customer` field)
- One-to-Many with `x_1868112_aayos_prediction` (via `customer` field)
- One-to-Many with `x_1868112_aayos_ticket` (via `customer` field)
- Many-to-One with `sys_user` (via `user` field)

Scripts

1. Script Includes

AAYOSPredictionEngine
(`sys_script_include_aayos_prediction_engine`)

Purpose: Core prediction engine for processing vehicles and generating predictions via AI.

Key Methods:- `processVehicle(vehicleSysId)` - Process a single vehicle for predictions
- `_buildVehiclePayload(vehicle)` - Build JSON payload for AI service
- `_callAI(vehicleData)` - Call Gemini AI API or use mock data
- `_parseAIResponse(responseBody, vehicleData)` - Parse AI response into structured format
- `_createPrediction(vehicleSysId, aiPrediction, vehicleData)` - Create prediction record
- `_calculateConfidence(vehicleData, aiPrediction)` - Calculate confidence score
- `_shouldCreateTicket(prediction)` - Determine if ticket should be created
- `_createTicketFromPrediction(predictionSysId, vehicleSysId)` - Create ticket from prediction
- `_assignTechnician(ticketSysId, issueCategory)` - Auto-assign technician to ticket

Configuration:- API Key: `x_1868112_aayos.gemini.api_key`
- API URL: `x_1868112_aayos.gemini.api_url`
- Confidence Threshold: `x_1868112_aayos.prediction.confidence_threshold` (default: 0.7)

PredictionService
(`sys_script_include_23e38871972df6d0ec453b90f053af23`)

Purpose: Service class for scheduled prediction job execution.

Key Methods:- `runDailyVehicleScan()` - Main entry point for scheduled job
- `_prepareVehicleDataForAI(vehGR)` - Prepare vehicle data for AI
- `_callAIEngine(vehicleData, vehicleSysId)` - Call Scripted REST API for predictions
- `_parseAIResponse(aiResponse)` - Parse and evaluate AI response
- `_createPrediction(vehGR, evalResult)` - Create prediction record
- `_createTicketFromPrediction(vehGR, evalResult, predSysId)` - Create ticket from prediction
- `_linkPredictionToTicket(predSysId, ticketSysId)` - Link prediction to ticket
- `_pickNextTechnician()` - Round-robin technician selection
- `_updateTechnicianOpenTickets(techSysId)` - Update technician workload count
- `_computeTargetServiceDate(severity, urgency, baseGdt)` - Calculate target service date
- `_computeServiceWindowEnd(startGdt, severity, urgency)` - Calculate service window end

API Name: `x_1868112_aayos.PredictionService`

AAYOSService
(`sys_script_include_aayos_service`)

Purpose: Client-callable service for UI pages to fetch data.

Key Methods:- `getVehicles()` - Get all vehicles (JSON)
- `getVehicleCount()` - Get count of active vehicles
- `getTickets()` - Get all tickets (JSON)
- `getTicket()` - Get single ticket by sys_id
- `getOpenTicketCount()` - Get count of open tickets
- `getActiveTechnicianCount()` - Get count of active technicians
- `getPendingPredictionCount()` - Get count of pending predictions

Access: Client-callable, Sandbox-callable


AAYOSVehicleRegistration
(`sys_script_include_aayos_vehicle_registration`)

Purpose: Handle vehicle registration from UI wizard.

Key Methods:- `createVehicle(formData)` - Create vehicle record from form data

Access: Client-callable

TicketLifecycleService
(`sys_script_include_8449436d9725f6d0ec453b90f053af71`)

Purpose: Service class for managing ticket lifecycle operations including status transitions, technician reassignment, and customer decision handling.

Key Methods:- `startWork(ticketSysId, techSysId)` - Start work on ticket, set status to in_progress and actual_service_date
- `complete(ticketSysId, summary)` - Complete ticket, set status to closed and closed_date
- `reassign(ticketSysId)` - Reassign ticket to another technician using round-robin algorithm
- `closeAsDeclined(ticketSysId)` - Close ticket as cancelled when customer declines
- `closeAsExpired(ticketSysId)` - Close ticket as expired when no customer response
- `handleTechnicianTimeout(ticketSysId)` - Handle technician response timeout (6 hours) and reassign
- `handleTicketDeletion(ticketSysId)` - Handle ticket deletion and update technician counts
- `handleDeclinedTicket(ticketSysId)` - Called by Business Rule when customer decision changes to declined
- `_selectTechnicianWithAvailableCapacity()` - Helper method for round-robin technician selection
- `_updateTechnicianOpenTickets(techSysId)` - Helper method to recalculate technician open ticket count
- `_linkPredictionToTicket(predSysId, ticketSysId)` - Helper method to link prediction to ticket

API Name: `x_1868112_aayos.TicketLifecycleService`

DeleteCustomerScript
(`sys_script_include_378da6c797a9b214ec453b90f053afc6`)

Purpose: Client-callable script for deleting customer records from UI.

Key Methods:- `deleteCustomer()` - Delete customer record by sys_id

Access: Client-callable

API Name: `x_1868112_aayos.DeleteCustomerScript`

UpdateCustomerScript
(`sys_script_include_d83d6a8797a9b214ec453b90f053afb9`)

Purpose: Client-callable script for updating customer records from UI.

Key Methods:- `updateCustomer()` - Update customer record fields (name, email, phone, address fields)

Access: Client-callable

API Name: `x_1868112_aayos.UpdateCustomerScript`


2. Scheduled Jobs

AAYOS Weekly Prediction Scan
(`sysauto_script_3780eb2d97e5f6d0ec453b90f053afb1`)

Purpose: Scheduled job to run prediction scan for all active vehicles.

Schedule:- Type: Weekly
- Run Day: Monday
- Run Time: 01:00:00

Script:javascript
(function () {
    var svc = new x_1868112_aayos.PredictionService();
    svc.runDailyVehicleScan(); 
})();

Run As: System Administrator


3. Business Rules

Mark AAYOS Ticket Customer Notified
(`sys_script_8016fb3197697ad0ec453b90f053afb9`)

Purpose: Automatically mark ticket as customer notified when email is sent.

Trigger: On `sys_email` table insert/update
Condition: `target_table=AAYOS Ticket AND type=sent`
Action: Update ticket `customer_notified` field to `true`

Handle Customer Declined
(`sys_script_1cb1bda39729b210ec453b90f053af69`)

Purpose: Handle ticket cancellation when customer declines service recommendation.

Trigger: On `x_1868112_aayos_ticket` table update
When: After
Order: 150
Condition: `customer_decision` changes to `declined` AND `status` is not `cancelled`
Action: Calls `TicketLifecycleService.handleDeclinedTicket()` to set status to cancelled, stamp customer_decision_date, and update technician open ticket counts

Set service and closed dates from status
(`sys_script_06f9b56b9729b210ec453b90f053af8b`)

Purpose: Automatically set service and closed dates based on ticket status changes.

Trigger: On `x_1868112_aayos_ticket` table update
When: Before
Order: 100
Condition: Status field changes
Action: 
- When status changes to `in_progress`: Set `actual_service_date` to current date/time (if not already set)
- When status changes to `closed`: Set `closed_date` to current date/time

Update technician open count
(`sys_script_5c35d8aa97a97ed0ec453b90f053af5e`)

Purpose: Automatically recalculate and update technician open ticket counts when tickets are created, updated, or deleted.

Trigger: On `x_1868112_aayos_ticket` table insert/update/delete
When: After
Order: 100
Condition: Status or assigned_technician changes, or on insert/delete
Action: Recalculates `current_open_tickets` count for affected technicians based on tickets with status in (`new`, `in_progress`, `on_hold`). Updates both current and previous technician records if technician was reassigned.



Custom Fields on Custom Tables

Vehicle Table Custom Fields

All fields listed in the Vehicle Table section above are custom fields. Key custom fields include:

- Identification Fields:  - `number` - Auto-numbered Vehicle ID
  - `plate` - License plate number
  - `vin` - Vehicle Identification Number

- Specification Fields:  - `make`, `model`, `model_year` - Vehicle specifications
  - `fuel_type`, `transmission` - Vehicle configuration
  - `usage_type`, `load_type`, `driving_condition_profile` - Usage characteristics

- Service History Fields:  - `last_service_date`, `last_service_odometer`
  - `last_oil_change_date`, `last_oil_change_odometer`
  - `last_brake_service_date`, `last_brake_service_odometer`
  - `last_tire_service_date`, `last_tire_service_odometer`
  - `last_battery_service_date`, `last_battery_service_odometer`

- Prediction Metadata Fields:  - `last_prediction_run` - DateTime of last prediction execution
  - `last_risk_level` - Highest severity from recent predictions
  - `vehicle_status` - Current vehicle status

Prediction Table Custom Fields

All fields listed in the Prediction Table section above are custom fields. Key custom fields include:

- Core Prediction Fields:  - `predicted_issue` - Description of predicted maintenance need
  - `predicted_date` - Expected maintenance date
  - `severity`, `urgency` - Priority indicators
  - `system_confidence_score` - System-calculated confidence

- AI Integration Fields:  - `raw_ai_response` - Raw JSON from AI service
  - `ai_explanation` - AI reasoning for prediction
  - `data_inputs_used` - JSON of input data
  - `source_type` - Source of prediction (daily_job, manual_run, imported)

- Relationship Fields:  - `vehicle` - Reference to vehicle
  - `customer` - Reference to customer
  - `linked_ticket` - Reference to associated ticket


Ticket Table Custom Fields

All fields listed in the Ticket Table section above are custom fields. Key custom fields include:

- Core Ticket Fields:  - `number` - Auto-numbered Ticket ID
  - `ticket_type` - Type of ticket (predicted_maintenance, customer_requested, technician_flagged)
  - `source` - Source of ticket (ai, manual_admin, imported)
  - `status` - Current ticket status

- Priority Fields:  - `severity`, `urgency` - Priority indicators
  - `prediction_validity` - Validation of prediction accuracy

- Assignment Fields:  - `assigned_technician` - Assigned technician reference
  - `technician_response` - Technician acceptance status
  - `technician_response_due` - Response deadline
  - `reassignment_count` - Number of reassignments

- Customer Fields:  - `customer_decision` - Customer acceptance/rejection
  - `customer_decision_date` - Decision timestamp
  - `customer_notified` - Notification status

- Scheduling Fields:  - `target_service_date` - Target service date
  - `service_window_start`, `service_window_end` - Service window
  - `actual_service_date` - Actual completion date

- Resolution Fields:  - `resolution_summary` - Resolution details
  - `closed_date` - Closure timestamp

Technician Table Custom Fields

All fields listed in the Technician Table section above are custom fields. Key custom fields include:

- Identification Fields:  - `number` - Auto-numbered Technician ID
  - `name` - Technician full name
  - `email`, `phone` - Contact information

- Workload Management Fields:  - `max_concurrent_tickets` - Maximum concurrent tickets (default: 5)
  - `current_open_tickets` - Current open ticket count
  - `status` - Technician status (active, on_leave, inactive)

- Skills Fields:  - `primary_skill_category` - Primary specialization

- Integration Fields:  - `user` - Reference to sys_user


Customer Table Custom Fields

All fields listed in the Customer Table section above are custom fields. Key custom fields include:

- Identification Fields:  - `number` - Auto-numbered Customer ID
  - `name` - Customer name
  - `email`, `phone` - Contact information

- Address Fields:  - `address_line_1`, `addres_line_2` - Street address
  - `city`, `state_province`, `postal_code`, `country` - Location fields

- Integration Fields:  - `user` - Reference to sys_user



Notifications

Email Notification: New Predicted Maintenance
(`sysevent_email_action_15737b6197a9f6d0ec453b90f053afab`)

Purpose: Notify customers when a new predicted maintenance ticket is created.

Trigger Conditions:- Table: `x_1868112_aayos_ticket`
- Conditions:
  - `source = ai`
  - `ticket_type = predicted_maintenance`
  - `status = new`
  - `customer_notified = false`

Email Configuration:- Type: Email
- Recipient: `customer.email` (from ticket's customer reference)
- Subject: "New Predicted Maintenance for Your Vehicle"
- Content Type: HTML

Email Template:html
<p>Hello ${customer_name},</p>
<p>AAYOS says it is time to visit the shop. We have detected predicted maintenance for your vehicle ${vehicle_name}.</p>
<p>Ticket ID: ${number} <br>
Issues: ${predicted_issue} <br>
Target Service Date: ${predicted_date} <br>
Severity: ${severity}</p>
<p>Please click the link below to accept or decline the ticket:</p>
<p><a href="https://dev192977.service-now.com/accept?ticket_id=${sys_id}&decision=accepted">[Accept]</a> 
<a href="https://dev192977.service-now.com/decline?ticket_id=${sys_id}&decision=declined">[Decline]</a></p>
<p>Thank you,<br>The AAYOS Team</p>

Event: `activate.life.cycle.migration`
Order: 100
Active: Yes

Note: The email action automatically sets `customer_notified = true` when the email is sent (via Business Rule).



Integration

1. Scripted REST API: OpenAI Vehicle Prediction

Service Definition: `sys_ws_definition_6227ccd79765f214ec453b90f053afee`

Purpose: Internal REST API endpoint for AI-powered vehicle prediction processing.

Configuration:- Name: OpenAI Vehicle Prediction
- Base URI: `/api/x_1868112_aayos/openai_vehicle_prediction`
- Namespace: `x_1868112_aayos`
- Service ID: `openai_vehicle_prediction`
- Consumes: `application/json`, `application/xml`, `text/xml`
- Produces: `application/json`, `application/xml`, `text/xml`
- ACL Enforcement: Yes (enforced via ACLs)

Endpoint: `/predict`

Request:- Method: POST
- Content-Type: `application/json`
- Body:json
{
  "data": {
    "current_mileage": "50000",
    "estimated_monthly_mileage": "1000",
    "driving_condition_profile": "urban",
    "usage_type": "personal",
    "load_type": "light",
    "last_oil_change_date": "2025-10-01",
    "last_oil_change_odometer": "48000",
    "last_brake_service_date": "2025-08-15",
    "last_brake_service_odometer": "45000",
    "last_tire_service_date": "2025-06-01",
    "last_tire_service_odometer": "42000",
    "last_battery_service_date": "2025-01-01",
    "last_battery_service_odometer": "40000",
    "make": "Toyota",
    "model": "Camry",
    "model_year": "2020",
    "has_tcu": "false"
  }
}

Response:json
{
  "result": {
    "severity": "medium",
    "predictedDate": "2025-12-15",
    "issues": "Engine oil change recommended",
    "confidenceScore": 75,
    "aiExplanation": "Oil change interval approaching based on mileage and time since last service"
  }
}

Integration Flow:1. Scheduled job calls `PredictionService.runDailyVehicleScan()`
2. For each vehicle, `_prepareVehicleDataForAI()` prepares payload
3. `_callAIEngine()` makes POST request to Scripted REST API
4. Scripted REST API processes request (may call external AI service)
5. Response is parsed and evaluated
6. Prediction and ticket records are created

2. External AI Integration (OpenAI API)

Purpose: Direct integration with OpenAI service for predictions.

Configuration:- API Key Property: `x_1868112_aayos.gemini.api_key`
- API URL Property: `x_1868112_aayos.gemini.api_url` (default: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`)

Implementation: Handled in `AAYOSPredictionEngine._callAI()` method

Request Format:json
{
  "contents": [{
    "parts": [{
      "text": "Analyze this vehicle data and predict upcoming maintenance needs..."
    }]
  }]
}

Response Format:json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "[{\"issue\": \"...\", \"severity\": \"...\", ...}]"
      }]
    }
  }]
}

Fallback: If API key not configured, system uses mock predictions based on deterministic rules.



3. Email Integration

Purpose: Send notifications to customers via ServiceNow email system.

Configuration:- Uses ServiceNow standard email infrastructure
- Email actions configured via `sysevent_email_action` table
- Templates support HTML formatting and variable substitution

Integration Points:- Ticket creation triggers email notification
- Email sent to customer email address from customer record
- Email action automatically marks ticket as `customer_notified = true`

4. System Property Configuration

Required System Properties:- `x_1868112_aayos.gemini.api_key` - Gemini API key (optional)
- `x_1868112_aayos.gemini.api_url` - Gemini API endpoint URL (optional)
- `x_1868112_aayos.prediction.confidence_threshold` - Confidence threshold for ticket creation (default: 0.7)
- `x_1868112.aayos.last_tech` - Last assigned technician for round-robin (system-managed)

Optional System Properties:- `glide.servlet.uri` - Base URL for Scripted REST API calls (used by PredictionService)


Additional Notes

Data Model Relationships Summary

Customer (1) ──< (Many) Vehicle
Vehicle (1) ──< (Many) Prediction
Vehicle (1) ──< (Many) Ticket
Prediction (1) ──< (1) Ticket
Technician (1) ──< (Many) Ticket
Customer (1) ──< (Many) Prediction
Customer (1) ──< (Many) Ticket


Key Business Logic

1. Confidence Score Calculation:   - Base score: 0.8
   - Penalties: Missing service date (-0.1), Missing mileage (-0.2), Missing monthly mileage (-0.1)
   - Bonuses: High/critical severity (+0.1)
   - Final score clamped between 0.0 and 1.0

2. Ticket Creation Criteria:   - Severity = high/critical OR
   - (Severity = medium AND Confidence >= 70)

3. Service Window Calculation:   - Target Service Date: 1-5 days based on severity/urgency
   - Service Window End: 3-14 days based on severity/urgency

4. Technician Assignment:   - Round-robin algorithm respecting capacity limits
   - Falls back to least-loaded technician if all at capacity
   - Updates workload counters automatically


Security Considerations

- All tables are scoped to `x_1868112_aayos` application
- ACLs enforce access control
- Scripted REST API has ACL enforcement enabled
- Email notifications respect customer privacy

Performance Considerations

- Indexes on foreign key fields for efficient queries
- Scheduled job processes vehicles in batches
- Technician workload counters cached and updated via Business Rules
- Raw AI responses stored for audit and debugging



Features to Implement (Out of Scope)

The following features are planned for future implementation but are currently out of scope for the current release:

- Customer dashboard
- Customer request tickets
- Request leave for technicians
- Technician flagged tickets
- Skill based technician assignment
- KB for rules for prediction (RAG)
- Manual functions in the case of no parts
- Improved scheduling for technicians + My Calendar feature



Document Maintenance

This document should be updated whenever:
- New tables or fields are added
- New scripts or integrations are implemented
- Business logic changes
- New notifications are configured
- Integration endpoints change

Last Reviewed: December 2025  
Next Review: As needed


