---
name: Moysidis Mobile Massage business rules
description: Domain rules for the Moysidis Mobile Massage practice-management app that aren't derivable from code alone — confirmed directly by the business owner.
---

- Appointments are booked by the owner only (from phone calls and Instagram DMs) — there is no requirement for clients to self-book. A `/book` self-service page exists as a bonus feature but is not the primary flow.
- The client-facing "table-style form" requirement refers to the **medical history / intake form** (name, surname, age, phone, email, allergies, medical history, GDPR consent) — not an appointment booking form. Early in this project these two were conflated; the owner's later clarification corrected it.
- Every session is a flat €150 (EUR, not CHF) — income is not variable by service type. Price field should stay fixed/read-only in the UI rather than editable per appointment.
- Client age is captured as a plain integer "Age" field per owner preference, not date of birth.

**Why:** These came from direct clarification after an initial build assumed CHF pricing, variable per-service pricing, and a client self-booking flow — all of which were wrong assumptions from an ambiguous initial request.

**How to apply:** When extending Appointments, Finance, or the intake form, keep these constraints unless the owner explicitly asks to change them.
