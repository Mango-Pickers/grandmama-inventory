# My Grandma's Kitchen Inventory Management Specification

## 1. Purpose

My Grandma's Kitchen is a portable inventory management application for a small Nigerian food business. It supports daily stock entry and monitoring by inventory staff and gives supervisors and management visibility into balances, discrepancies, freshness, approvals, and activity.

This document defines the intended product behavior and delivery requirements. A requirement described here is not a claim that the current application already implements it. Features are complete only when implemented, tested, and verified against the acceptance criteria in this document.

## 2. Product Goals

- Make routine receiving, issuing, preparation, counting, and quality checks practical on desktop, tablet, and mobile.
- Keep stock balances explainable and auditable by deriving them from a persistent movement ledger.
- Prevent unauthorized changes, duplicate posting, and silent correction or deletion of posted activity.
- Give authorized users filtered, accurate operational views and data exports.
- Keep the application portable for local development in VS Code and deployment to Netlify, with Firebase as the authentication and persistence provider.

## 3. Scope

### In scope

- Authentication and role-based access.
- Inventory master data and categories.
- Stock receipt, issue, transfer, preparation, wastage, count, reversal, and approved adjustment workflows.
- Portion and packaging consumption tracking.
- Freshness and quality checks.
- Overview, notifications, and audit history.
- CSV inventory and transaction import, and operational CSV exports.
- Firebase configuration, rules, indexes, setup documentation, tests, and Netlify deployment configuration.

### Out of scope for the initial version

- Email and SMS notifications.
- Treating frontend Firebase configuration as authorization.
- Firebase Admin credentials or other privileged secrets in browser code.
- Automatic food-safety determinations or invented expiry dates.
- A separate Reports navigation module.
- Invented opening balances, stock quantities, suppliers, reorder levels, carton conversions, or expiry dates.

## 4. Technology and Repository Requirements

- React and TypeScript, built with Vite.
- Tailwind CSS and the project's accessible component system, used consistently.
- Firebase JavaScript SDK, Firebase Authentication, and Cloud Firestore.
- Papa Parse for CSV reading and generation.
- Vitest and React Testing Library for business logic and workflow tests.
- A maintainable separation between UI components, pages/routes, services, domain types, validation, and business logic.
- Keep application code, Firebase rules and indexes, documentation, tests, and configuration in the Git repository.
- Use standard npm commands for install, development, tests, and production build.
- Do not rely on Lovable Cloud, Lovable-managed databases, Supabase, or Lovable-only server infrastructure.

## 5. Visual and Responsive Requirements

Use a warm, practical operations interface. Prioritize fast daily stock entry, readable tables, clear status and approval states, and responsive controls. Avoid decorative charts and marketing-style layouts.

| Token | Color |
| --- | --- |
| Forest green | `#193D32` |
| Dark pine | `#244B3C` |
| Warm ivory | `#F7F5EF` |
| Muted sage | `#E5EDE5` |
| Terracotta | `#B7654A` |
| Main text | `#222B26` |
| Secondary text | `#69736C` |
| Borders | `#E3E6DF` |
| Warning | `#9A681B` |
| Error | `#B83A36` |

The application must remain usable at desktop, tablet, and mobile widths. Tables and forms must adapt without hiding essential data or actions; provide sensible horizontal scrolling, stacking, or alternate compact presentation where appropriate. Controls must be keyboard accessible and expose labels, validation errors, and status changes to assistive technology.

## 6. Navigation and Screens

The application has these sections, subject to the user's permissions:

1. Overview
2. Daily Stock
3. Inventory
4. Receive Stock
5. Issue Stock
6. Stock Preparation
7. Physical Count
8. Quality Checks
9. Stock Activity
10. Notifications
11. CSV Import / Export
12. Settings and User Management

Do not add a separate Reports module. Reporting and exports belong in the relevant operational screens and CSV Import / Export.

Every data-backed screen must implement loading, empty, success, and error states. Actions unavailable to a role must not be presented as usable controls; Firestore rules or trusted server-side logic must still enforce authorization.

## 7. Inventory Master

### 7.1 Required starting catalogue

Provide an editable starting inventory catalogue containing these item names, grouped by category. The catalogue is master data only: do not supply fabricated quantities, opening balances, suppliers, reorder levels, expiry dates, or conversion assumptions.

- **Protein and meat:** barracuda, chicken, turkey, assorted cow meat, ponmo, goat meat.
- **Seafood:** crab, catfish, croaker fish, prawns, periwinkles, shrimps, dry fish, stockfish, snails, crayfish.
- **Vegetables and produce:** tomatoes, onions, waterleaf, bitter leaf, afang leaves, okra, uziza leaves, ugu leaves, pepper, plantain.
- **Cooking ingredients:** vegetable oil, frying oil, palm oil, salt, Terra seasoning cubes, pepper soup spice, iru, thickener, palm fruits, rice, basmati rice.
- **Flour and water:** fufu flour, oat flour, plantain flour, water.
- **Packaging:** 1.5L bowls, 3L bowls, 4L bowls, bowl lids, takeaway plates, thick black nylon bags, baking paper, cling film, large and medium Ziploc bags, serviettes, aluminium foil.
- **Cleaning:** large waste bags, detergent, iron or metal scouring sponges, dishwashing sponges, Vim cleaning powder.
- **Staff supplies:** gloves, nylon gloves, hairnets.
- **Office and other items:** A4 paper, pens, lighters, pans, cotton material.

### 7.2 Item management

Authorized users can add, edit, categorize, and deactivate inventory items. Deactivation must preserve historical references and must not delete ledger records. Capture and confirm each item's stock-counting unit, purchase unit, and reorder level before relying on those fields for stock workflows or alerts. Do not assume purchase-to-counting conversions; record an explicit confirmed conversion where one is needed.

## 8. Stock Ledger and Movement Workflows

### 8.1 Ledger requirements

Stock balances are calculated from posted ledger movements, not maintained by silently overwriting an item quantity. Each posted movement is a persistent Firestore record with a unique ID and, as applicable:

- Item and movement type.
- Quantity and unit.
- Effective date/time and creation date/time.
- Reason and reference.
- Acting user and, when relevant, approver.
- Related record identifiers, including reversal, preparation, count, import job, or source movement.
- Relevant before/after balance information or sufficient ledger data to calculate it consistently.
- Idempotency key or unique external reference for retry-safe posting.

Posted movements cannot be deleted to conceal an error. Corrections use linked reversals or approved adjustment movements, preserving the original record and audit history.

### 8.2 Supported movement types

- Receipt into stock.
- Issue or consumption from stock.
- Transfer between tracked locations, where locations are configured.
- Preparation input and output.
- Wastage.
- Physical-count variance and approved adjustment.
- Reversal of a posted movement, linked to the original.

### 8.3 Consistency and duplicate protection

Operations requiring a consistent balance must use Firestore transactions or appropriately secured trusted server-side logic. Posting must be retry-safe and must not create duplicate movements. Prevent negative stock unless an explicitly authorized exception is approved and recorded. The UI is not a security boundary; rules and trusted operations must enforce the policy.

### 8.4 Core workflows

- **Receive stock:** select an active item, enter quantity and unit, date, reason/reference, and required conversion details; validate and post atomically; show the resulting balance and movement reference.
- **Issue stock:** select item, quantity/unit, date, and reason/reference; validate available stock and authorization; post once and show the resulting balance.
- **Transfer:** record source and destination, item, quantity/unit, date, and reference as a linked, consistent operation. Do not expose this workflow until locations and transfer semantics are configured.
- **Wastage:** record item, quantity/unit, date, reason, and user; post a stock-reducing movement and preserve it in activity and exports.
- **Adjustment:** record the observed or approved correction, reason, requester, approver, and linked count or source record when relevant. An adjustment is a ledger movement, not an edit to a balance.
- **Reversal:** create an auditable offsetting record linked to the original; never remove the original movement.

## 9. Food Portions, Preparation, and Packaging

### 9.1 Portion sizes

Support configurable soup portion sizes of 1L, 2.5L, 3.5L, and 5L. Store yields and portion assumptions as configurable settings rather than hard-coded facts. A preparation record captures actual ingredient inputs and actual output so that expected yield is not mistaken for measured output.

Track portion production and sales without deducting ingredients twice. Establish one authoritative posting path for ingredient consumption and link portions/sales to it. A sale or portion record must not independently post a second ingredient deduction for ingredients already consumed by the preparation movement.

### 9.2 Chicken and turkey conversion

Support purchasing chicken and turkey by carton and counting the actual pieces received after unpacking or cutting. Never assume a fixed number of pieces per carton. Every relevant receipt or batch must record the carton quantity and the actual counted piece quantity, with the conversion confirmed by the user. Keep both source purchase quantity and resulting stock-counting quantity auditable.

### 9.3 Packaging rules

Packaging mappings are configurable. Initial defaults are:

| Soup portion | Bowl consumption |
| --- | --- |
| 1L | One 1.5L bowl |
| 2.5L | One 3L bowl |
| 3.5L | One 4L bowl |
| 5L | One 4L bowl and one 1.5L bowl |

Deduct packaging at one defined workflow point only, and link the deduction to the related preparation or sale record to prevent duplicate consumption. Track lids separately only if lids are separately counted as inventory. Packaging mapping changes are auditable settings changes.

## 10. Physical Counts and Freshness

### 10.1 Physical counts

Allow an inventory officer to record a physical count for an item and compare it with the expected ledger balance at a defined time. Show expected quantity, counted quantity, unit, variance, counter, date/time, and notes. A variance is not silently applied to the balance; it requires the configured approval and an approved adjustment movement where appropriate. Preserve count and approval history.

### 10.2 Quality checks and batches

Record quality checks against an item and, where available, a batch. Fields include check date/time, freshness status, expiry date if supplied, storage location, notes, user, and corrective action. Supported statuses:

- Good.
- Use soon.
- Needs review.
- Spoiled or rejected.

Never invent expiry dates, infer that food is safe, or automatically treat a status as a food-safety decision. Spoiled or rejected stock must be recorded through the wastage or other authorized movement workflow; a quality status alone does not change the stock balance.

## 11. Roles, Permissions, and Audit

### 11.1 Roles

- Inventory Officer.
- Supervisor.
- Manager.
- MD.
- Administrator.

Use Firebase Authentication for identity and Firestore Security Rules plus trusted server-side operations where needed for authorization. A user must not be able to elevate their own role. Role assignments and role changes are administrative actions and must be audited.

### 11.2 Permission requirements

Enforce least privilege. At minimum:

- Inventory Officers can perform authorized routine stock-entry, count, preparation, and quality workflows, but cannot approve their own restricted adjustments or change roles.
- Supervisors, Managers, and the MD can review stock, discrepancies, activity, and pending approvals according to configured policy. Approval authority must be explicit and role-enforced.
- Administrators can manage users, role assignments, categories, item settings, and application settings, but administrative status does not permit rewriting or deleting posted ledger history.
- Restrict adjustments, approvals, administration, and exports to authorized roles. Do not infer an approval matrix beyond these constraints; document and test the final matrix in the implementation.

Unauthorized actions must be denied by the data layer, not merely hidden in the interface. Protect role claims and permission data from writes by the user whose role is being changed.

### 11.3 Audit trail

Maintain append-preserving audit history for stock movements, adjustments, approvals, role changes, and important settings changes. Each audit record should identify the actor, action, target, timestamp, and relevant before/after or linked-record context without exposing secrets.

### 11.4 Sign-in password visibility

The sign-in password field is masked by default and includes a toggle button at its right edge. Activating the button reveals the currently entered password; activating it again masks the value without clearing it. The control must be keyboard accessible, have a state-appropriate accessible name and pressed state, and use an eye/eye-off icon. Password values must not be persisted or logged by the visibility control.

## 12. Overview and Notifications

### 12.1 Overview

Show operational summaries for:

- Active item count.
- Low-stock and out-of-stock items, using user-confirmed reorder levels.
- Freshness reviews due.
- Pending approvals.
- Recent movements.
- Unresolved physical-count discrepancies.

Each summary must be derived from persisted data and applicable filters/permissions. Avoid decorative charts; favor clear counts, prioritized lists, and direct links to the relevant workflow.

### 12.2 In-app notifications

Persist in-app notifications in Firestore for low stock, freshness reviews, pending approvals, unusual adjustments, and failed imports. Notifications must have a clear source record, status/read state, and timestamp. Do not claim external email or SMS delivery.

## 13. CSV Import

Use Papa Parse. Provide separate inventory-master and stock-transaction import workflows.

Each workflow supports file selection, column mapping, preview, required-field checks, quantity and unit validation, duplicate detection, row-level errors, an import summary, explicit confirmation before writing, downloadable templates, and downloadable error files. Handle large files without freezing the interface; establish and document practical size/row limits or safe batching behavior.

### 13.1 Inventory master import

- Validate item identity, category, and fields required by the selected mapping.
- Report duplicate rows and conflicts clearly.
- Never overwrite current stock balances or create opening stock implicitly.
- Opening stock and corrections must use explicit authorized stock workflows.
- Record an import job and row outcomes for review/retry where applicable.

### 13.2 Transaction import

- Require a unique reference or idempotency key for each movement.
- Retrying the same import must not double-post a movement.
- Validate type, item, date, quantity, unit, reason/reference, and authorization before posting each row.
- Clearly report row-level success, failure, and partial completion. Failed rows must be safely retryable without reposting successful rows.
- Persist import job status and row outcomes; restrict retries and exports according to role.

## 14. CSV Export

Provide authorized exports for:

- Inventory master.
- Current stock balances.
- Receipts and issues.
- Preparation records.
- Physical counts and variances.
- Wastage.
- Quality checks.
- Stock activity.
- Low-stock items.
- Daily stock summaries.
- Packaging usage.

Support relevant filters including date range, category, item, and movement type. Export all records matching the selected filters, not only the currently visible page. Correctly escape CSV values, include UTF-8 text, and handle empty results clearly. Enforce export permissions and report success or failure. Where an export is large, use safe pagination/batching or trusted server-side generation so the result is complete.

## 15. Firebase and Configuration

Create a reusable Firebase configuration module that reads:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Provide `.env.example` with these names and placeholder values. Do not commit real secrets. Firebase web configuration values identify the project but do not replace authorization rules. Never put Firebase Admin credentials or privileged keys in frontend code.

Version-control:

- `firestore.rules`
- `firestore.indexes.json`
- `.env.example`
- `README.md`
- `firebase.json` when needed for Firebase CLI deployment.

Do not create unrestricted rules. Deny access by default and permit only authenticated, role-authorized, schema-valid operations. Rules must prevent users from changing their own role, deleting or rewriting posted movements, bypassing approval requirements, and accessing another user's protected data where applicable. Where rules cannot safely enforce an atomic or privileged operation, use trusted server-side logic and document its deployment and trust boundary.

The setup guide must explain how to select/create a Firebase project, enable email/password Authentication, create Firestore, configure local environment variables, deploy rules and indexes, and configure Netlify environment variables.

## 16. Testing Requirements

Create automated tests covering at least:

- Stock balance calculations from ledger movements, including reversals and adjustments.
- Physical-count variance calculations.
- Bowl consumption mappings, including 5L using two bowls.
- Carton-to-piece conversions with actual per-receipt counts and no fixed assumed yield.
- CSV required-field, quantity/unit validation, and duplicate detection/idempotency.
- Role-sensitive actions and approval restrictions, including attempts to self-elevate or approve a restricted action without permission.

Test pure domain calculations independently from UI. Add workflow tests for core interactions and error/empty states. Firebase rules should be validated with the Firebase Emulator Suite when practical; do not consider UI-only tests proof that security rules work.

## 17. Documentation and Deployment

The README must document:

- Supported runtime prerequisites.
- Dependency installation and local development commands.
- Environment variable setup and Firebase project configuration.
- Authentication setup and Firestore setup.
- Rules and index deployment using Firebase CLI.
- Test and production build commands.
- Netlify build command, publish directory, SPA fallback, and required environment variables.
- Any trusted backend/service that must be deployed for privileged operations.

Configure Netlify for client-side route fallback where required. Do not put Firebase Admin credentials in Netlify frontend environment variables. Any server-side secrets must be scoped to trusted server functions only.

## 18. Delivery Phases

1. **Application structure and Firebase foundation:** responsive shell, routes, reusable Firebase configuration, env example, base types/validation, and setup documentation.
2. **Authentication, roles, and rules:** email/password sign-in, protected routes/actions, role model, Firestore rules, and initial security tests.
3. **Inventory and ledger:** editable catalogue, movement records, balance calculations, activity history, duplicate prevention, and initial inventory tests.
4. **Receipts, issues, counts, and adjustments:** daily entry workflows, variance approvals, linked corrections, and consistency controls.
5. **Preparation and packaging:** actual input/output records, configurable portion yields, carton conversions, and configurable packaging deductions.
6. **Freshness, notifications, and audit:** quality checks, persisted in-app alerts, and audit history.
7. **CSV import and export:** validated, retry-safe imports and filtered complete exports.
8. **Verification and deployment:** expand tests, complete documentation, validate rules/indexes, configure Netlify, and verify production build.

Phases may be delivered incrementally, but later-phase functionality must not be presented as complete until implemented and verified.

## 19. Acceptance Criteria

The initial product is acceptable when all of the following are true:

- The application installs, runs locally, passes its documented tests, and produces a production build using the documented npm commands.
- Core workflows are usable at desktop, tablet, and mobile sizes.
- Firebase configuration is environment-based, and missing configuration produces a clear actionable error rather than a false success state.
- Authenticated users can access only actions and records allowed by the enforced role policy; users cannot grant themselves a role.
- Inventory balances are reproducibly derived from persistent movements; posted movements are not deletable or silently editable.
- Receipts, issues, preparation, wastage, physical counts, reversals, and adjustments preserve the required references and audit context.
- Duplicate submissions and import retries do not double-post stock movements.
- Configurable soup portions, explicit chicken/turkey conversions, and packaging rules do not invent values or double-deduct stock.
- Quality checks do not invent expiry or safety decisions; wastage affects stock only through a posted movement.
- Overview, notifications, imports, exports, and errors reflect persisted data and clearly communicate their state.
- Firestore rules and indexes are versioned and deployable; rules deny unauthorized access by default.
- README setup and Netlify instructions are sufficient for a developer to configure their own Firebase project and deploy without Lovable-managed services.

## 20. Owner-Configured Values and Open Decisions

These values must be supplied or confirmed by the business owner; the application must not fabricate them:

- Firebase project and environment configuration.
- Stock-counting and purchase units for each item.
- Reorder levels and any opening stock.
- Suppliers, batches, expiry dates, and storage locations.
- Chicken/turkey carton-to-piece counts for each receipt or batch.
- Portion yields and preparation assumptions.
- Final approval matrix, including who can approve each adjustment and under what limits.
- Whether lids are separately counted, which storage locations are tracked, and the exact packaging deduction point (preparation or sale).
- Threshold and definition for an unusual adjustment or freshness review due.
- Operational import size limits and retention policy for audit/import records.

Record confirmed values as explicit user-managed settings or business data and audit important changes.