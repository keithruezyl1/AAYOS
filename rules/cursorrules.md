1. General Boundaries

Cursor must NOT invent new tables, fields, UI pages, scripts, or structures.

Cursor must base all changes ONLY on what exists inside this repository AND the AAYOS Master Specification (included below).

Cursor must assume ServiceNow controls runtime execution.

Cursor must treat these XML files as declarative config, not full code.

2. Editing XML

NEVER rewrite an entire XML file unless explicitly instructed.

ONLY modify the minimum set of attributes/tags needed to perform the requested changes.

Maintain existing sys_id, sys_scope, sys_created_by, etc.

Do not introduce new sys_update_name files unless the user explicitly creates a new artifact (e.g., new UI Page).

3. Adding New Files

Cursor must ONLY add new files when:

The user explicitly says “create a new [table/UI page/script/module]”.

The file type matches ServiceNow-scoped app export format (XML).

4. Fluent SDK / Platform Considerations

This repository does not contain JavaScript code files, only XML definitions.

Cursor must not create .js, .ts, .jsx, .tsx files unless we later integrate the UI Builder / Fluent SDK layer in a separate repo.

All business logic (Prediction Job, Auto-assignment, AI Integration) should NOT be created inside Cursor unless the user explicitly provides a structure to write server scripts.

ServiceNow code cannot run in this repo; it must be created via update XML records.

5. AAYOS Data Model (Strict)

Cursor must strictly follow these four tables and only modify them when asked:

Vehicle Table (x_aayos_vehicle)

Fields:

number (autonumber)

plate_number

vin

make

model

model_year

vehicle_category

fuel_type

transmission

owner_name

owner_phone

owner_email

current_mileage

estimated_monthly_mileage

usage_type

load_type

driving_condition_profile

has_tcu

last_service_date

last_service_odometer

last_oil_change_date

last_oil_change_odometer

last_brake_service_date

last_brake_service_odometer

last_tire_service_date

last_tire_service_odometer

last_battery_service_date

last_battery_service_odometer

vehicle_status

last_prediction_run

last_risk_level

Prediction Table (x_aayos_prediction)

Fields:

vehicle (reference)

predicted_date

predicted_issue

severity_level

urgency_level

confidence_score

source_type

recommended_action

ai_explanation

data_inputs_used

linked_ticket

linked_ticket_status

Service Ticket Table (x_aayos_service_ticket)

Fields:

number

vehicle

prediction

creation_type

customer_name

customer_phone

customer_email

ticket_status

customer_response

customer_response_time

technician

technician_ack_status

technician_ack_time

auto_reassign_deadline

requested_window_start

requested_window_end

estimated_duration_hours

parts_confirmed

workshop_notes

technician_notes

resolution_summary

closure_code

closed_at

Technician Table (x_aayos_technician)

Fields:

number

technician_id

full_name

phone

email

skill_level

specialization

skill_tags

max_concurrent_jobs

current_open_jobs

is_active

shift_start

shift_end

last_assigned_time

6. AAYOS UI Pages (Strict)

Cursor must assume the following pages exist or are planned:

aayos_dashboard

aayos_vehicles

aayos_vehicle_register

aayos_vehicle_details

aayos_tickets

aayos_ticket_details

aayos_technicians

Cursor must NEVER rename these pages or create new ones without explicit instruction.

7. Logic Rules (NOT to be auto-coded by Cursor)

Cursor must NOT build or assume:

Prediction engine logic

Technician auto-assignment logic

REST integrations

Scheduled jobs
Unless the user explicitly provides a structure and asks Cursor to write them.

Cursor may only reference these systems conceptually.

8. Naming Rules

No snake_case for new items unless consistent with existing files.

Use ServiceNow conventions:

Tables: lowercase with underscores

Fields: lowercase with underscores

UI Pages/XML: automatically follow update_set naming

9. No hallucinations

Cursor must:

Never guess field types.

Never invent fields not listed in the master spec.

Never assume relationships that were not explicitly defined.

Never generate JavaScript API calls unless based on existing patterns.

10. Master Document Enforcement

Cursor must use the contents of this file as the authoritative guide for:

Table structure

UI behavior

Naming conventions

Allowed changes

App purpose

Business logic boundaries