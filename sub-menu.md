My Grandmama Kitchen — working menus, features and linked flows
1. Implementation mandate
Implement every menu destination and applicable control shown in the supplied sidebar screenshots. Build working inventory operations, not placeholder screens or simulated success messages. This file is an implementation specification; it does not itself implement the app.

Read database.md for the data model, all 72 catalogue entries/candidates, stock rules and reporting requirements. Read responsiveness.md for all-device behaviour. Preserve those requirements. This file connects the navigation, editable tables, actions and end-to-end workflows.

Inspect the existing codebase and reuse its router, components, database and design system. Do not introduce a second catalogue, parallel balance store or duplicate navigation shell. Retain the existing stack unless a demonstrated gap requires a minimal change. No sales or supermarket features.
2. Activate the entire sidebar
Use these existing destinations, preserving existing route paths if they differ from the suggested paths below:
Menu	Suggested path	Required working destination
Overview	/overview	Shared inventory summary and actionable exceptions
Daily Stock	/daily-stock	Selected-date stock balances and quick actions
Inventory	/inventory	Full editable product and stock-variant catalogue
Receive Stock	/receive-stock	Post receipts and view receipt history
Issue Stock	/issue-stock	Post issues, returns and waste
Stock Preparation	/stock-preparation	Process, cut, portion and repack stock
Physical Count	/physical-count	Count sessions and explicit reconciliation
Quality Checks	/quality-checks	Batch inspections and condition history
Stock Activity	/stock-activity	Shared ledger, daily report and filtered exports
Notifications	/notifications	Real stock/quality/count exceptions
CSV Import / Export	/import-export	Validated CSV/XLSX transfer workflows
Settings	/settings	Working configuration and data/backup controls


- Use exactly one active navigation item, matching the current route. The screenshot shows Quality Checks and Settings both highlighted; fix that ambiguity. A hover/focus state must not look like a second selected page.
- Clicking any menu opens its actual screen. Direct URL loading, refresh and browser Back/Forward must work.
- Keep every menu reachable in the sidebar scroll area and mobile drawer. The location footer must not hide Settings or Import/Export.
- Avoid nested navigation links inside buttons. Give each link an accessible name and current-page semantics.
- Preserve relevant filters when returning from item details. Clear stale context when it no longer applies.
- Handle unknown routes with a useful not-found screen and return link.
3. Shared inventory is the source
All selectors, tables and reports read the same item/variant, batch, location and ledger records. On successful posting, update every affected query/view. Do not require manual duplicate entry or a page reload to see a new receipt or issue.

Load the catalogue from database.md idempotently. Preserve user edits on subsequent launches; never overwrite real records with demo seed data. Include all candidate entries in Inventory, with pending identities visibly separated from active stock selectors.

A product can have several processing/size/form variants. Show distinct variant balances. A UI toggle selects a variant; it never converts the underlying goods. Categories and filters group existing records without copying them.

Keep descriptive item edits separate from quantity operations. Users may edit names, notes and valid catalogue configuration. They may not type over a calculated stock balance. To change stock, use a receipt, issue, preparation, transfer, waste event or confirmed adjustment.
4. Shared table contract
Apply a reusable table/list system to Inventory, Daily Stock, receipts, issues, preparation history, count sessions, quality checks, Stock Activity, Notifications and import results wherever rows are appropriate. Each screen uses relevant columns, not one oversized identical table.

Every applicable table must support:
- Search over useful displayed identities, including product names and references.
- Relevant filters with visible applied state and Clear Filters.
- Correct numeric, date and text sorting.
- Pagination or accessible virtualisation with accurate filtered record count.
- Stable row IDs, predictable row actions and preserved state when opening details.
- Loading, empty, no-match, error and retry states.
- CSV/XLSX export of the full filtered dataset, not only the visible page.
- Responsive table/card presentations following responsiveness.md.
- Readable units, processing state and date/time; blank, zero and not applicable are different.
Use an Actions column/menu for View, Edit Draft, Archive, Reverse or other meaningful operations. Do not add nonfunctional Edit/Delete buttons to calculated balances or immutable posted transactions.

Bulk actions must state their scope and preview changes. Do not provide destructive bulk deletion of posted ledger records. Preserve keyboard and touch usability.
5. Inventory: fully active and editable
Provide Add Item, View Item, Edit Item, Add/Edit Variant, Archive/Restore, Import Catalogue and Export Catalogue.

Item fields: stable ID, name, category, notes, active/archive status and processing applicability. Variant fields include processing/preparation state where relevant, stock form, portion-size label, unit, brand/pack/size where applicable and identity confirmation status.

Allow configuration of actual purchase-pack conversions, reorder thresholds and applicable review rules without inventing values. Do not silently change historical units or quantities when editing configuration.

Item details link to batches, location balances, receipts, issues, preparation, counts, quality history and filtered Stock Activity. Provide prefilled Receive, Issue, Prepare and Count actions from eligible items.

Pending candidate names remain editable and confirmable. Confirming identity does not create opening stock. Review a suspected duplicate before merging; retain all existing references and history. Archive referenced items rather than deleting them.

Empty Ziploc bags, bowls, lids and other supplies are editable catalogue items alongside ingredients. Portion packs and filled ingredient bags remain tied to the correct ingredient variant. Processing options must not appear for salt or unused packaging.
6. Overview and Daily Stock
Overview derives real counts and exceptions from shared data. Each summary card opens the matching filtered page. Recent activity opens event details. Never add incompatible units into a grand stock quantity.

Daily Stock shows the chosen day's carried-forward and resulting stock, including relevant items with no new activity. Include the fields and quantity distinctions in database.md. Search and filter by item, variant, location, category and condition.

Quick Receive/Issue/Prepare/Count actions open real forms with the selected context. A physical count entered here uses the same count workflow, not a second editable balance system.

After posting, refresh the affected quantity breakdown and expose the new activity reference. Keep source-to-output preparation and internal transfers distinct from purchases and consumption.
7. Receive Stock
Support a receipt with one or more item lines: item/variant, quantity/unit, destination, actual received date/time, supplier/reference if known, batch and condition. Expiry/review data are optional according to the item rules.

Validate and preview before posting. Saving a draft has no stock effect. Posting creates the event and all batch/ledger lines atomically. Disable repeated submission while pending and use a unique operation ID to prevent duplicate receipts on retry.

Show purchase cartons and actual counted pieces separately where applicable. Never assume fixed carton yields or treat both quantities as separate stock additions.

Receipt history supports View and Reverse/Correct with a reason. Link each receipt to resulting batches, quality observations and Stock Activity.
8. Issue Stock, returns and waste
Select eligible available stock by variant, location and batch. Show quantity available in the requested unit before confirmation. Record quantity, destination, effective time and purpose; include recipient/reference where useful.

Provide distinct Issue, Return and Waste actions. Condition changes do not themselves deduct stock. Waste and normal issues must remain separate in reports.

Use the confirmed inventory boundary: transfers between tracked storage and kitchen locations are paired movements; issues outside the boundary reduce total tracked stock. Until the kitchen boundary is configured, require an explicit supported movement type rather than silently guessing.

Post once; update balances, Daily Stock, Stock Activity and alerts. No food-sales deduction. Link returns to original issues where possible and inspect returned stock condition.
9. Stock Preparation
Support processing, cutting, portioning and repacking with source and output lines. Record source batches/quantities, actual outputs, preparation time, output location and any waste.

Four portion labels are 1L, 2.5L, 3.5L and 5L soup allocations. They do not specify the volume of ingredient or a fixed piece count. Filled bags are not automatically equivalent to portions.

Show before/after balances and consume/create all lines atomically. Preserve source provenance and original stock age. Output batches receive preparation dates without falsely resetting expiry. Count the source deduction and waste once.

History opens the full linked conversion record. Prevent changing a variant label as a substitute for preparation.
10. Physical Count
Create a count session with date/time, location, items/variants/forms and observed quantities. Show system balances at the relevant cutoff, not an unrelated current total.

Save Draft, Resume, Review Differences and Confirm Reconciliation must work. Blank means uncounted. A submitted observation alone does not alter stock. A confirmed adjustment records quantity, reason and linked count.

If activity changed during counting, refresh/reconcile the expected balance before confirmation. Keep original observations and adjustment history. Do not require an invented manager approval step.
11. Quality Checks
Select a real batch and show its item, received date, location, remaining quantity and previous inspections. Record Good, Needs review or Bad with checked-by, time and notes; optional photos only if attachment storage is implemented.

The receipt may preselect Good but requires confirmation; unknown imported condition remains Not checked. Store dated observations and keep history.

Saving a check updates batch condition displays and relevant notifications without changing physical quantity. Block normal issues of held/bad stock under the agreed rules. Disposal creates a separate waste event.

Do not add arbitrary shelf lives or equate appearance with food safety. Missing review rules remain explicitly unconfigured.
12. Stock Activity: one report destination
Implement Activity and Stock Summary views using the shared ledger. Keep Run Daily Report, Export CSV and Export Excel clearly visible and operational.

Use the date presets and filters specified in database.md. A daily report defaults to today in Africa/Lagos and supports another selected day. Include current filter context, all matching records and carried-forward stock where relevant.

Row details trace the related receipt, issue, preparation, count adjustment, transfer or reversal. Never recompute actual balances using only a filtered subset of movement types.

Exports must use the same report query as the displayed view, without pagination truncation. CSV is a real download, not a placeholder link. Optional printing uses the same report data. No separate daily/weekly/monthly report engines.
13. Notifications
Compute low stock, configured overstock, ageing/inactivity, expiry/review issues, quality concerns and unresolved count differences from real records and configured thresholds.

Every notification opens the relevant item, batch, count or filtered activity. Offer Mark Seen/Acknowledge separately from resolving the underlying issue. Acknowledging low stock does not replenish it; reading a quality warning does not mark food Good.

Group/filter notifications by type and current state. Do not delete their originating data or manufacture notifications for unconfigured catalogue candidates. Do not promise background messaging unless implemented separately.
14. CSV Import / Export
Implement catalogue, opening-stock, receipt/issue, preparation, count and quality-check imports only with explicit schemas and validation. Contextual screen buttons open this same service preselected to the relevant type.

Support CSV and XLSX. Advertise additional formats only if actually supported. Provide genuine downloadable templates and error-row files. Steps: Upload, Worksheet/Type, Mapping, Validation, Preview, Confirm, Results.

Counts are observations, not receipts. Catalogue imports do not create stock balances. Linked preparation/transfer imports must preserve atomic event groups. Duplicate file/operation checks prevent repeat posting without rejecting legitimate independent identical-looking events.

Validate unknown identities, units, dates, quantities, state, location and batch. Allow deliberate mapping or item creation. Never silently merge names or invent conversions. Confirmed import failure leaves no partially applied stock event.

Exports include context, IDs in detailed datasets and all filtered rows. Handle spreadsheet formula-like free text safely. A report is not a complete backup.
15. Settings and kitchen location
Make the footer's Kitchen location / Not configured indicator actionable. Open location settings; allow named storage locations and the configured kitchen tracking boundary. Do not silently assume a location when one is required.

Settings supports item categories, locations, units, actual pack conversions, portion rules, thresholds, quality-review rules, editable bowl reference mappings, timezone and import mappings.

Changes must save persistently and update applicable selectors. Do not retroactively reinterpret historical transactions. Show invalid settings clearly and preserve entered values when saving fails.

Expose the actual persistence mode and backup/restore actions. Never label browser-local records as shared cloud records. Full backup covers required records, configuration and supported attachments. Restore previews changes and avoids accidental duplicate loading.
16. Operational safeguards
- Use a shared mutation layer, atomic operations and duplicate-operation protection.
- Only show Saved after durable storage succeeds. Failed requests preserve input and provide a safe retry.
- Do not treat empty/loading/error responses as a real zero stock balance.
- Maintain effective and recorded times, stable IDs, source links and correction reasons.
- Prevent negative available balances through all entry points, including imports and concurrent submissions where the architecture supports concurrent use.
- Keep demo data separate and never reset real data on refresh or deployment.
- Hide or clearly explain genuinely unavailable optional capabilities; do not leave clickable dead controls or simulate completion.
- Preserve the responsive, keyboard and touch behaviour defined in responsiveness.md.
17. Implementation sequence
1. Inspect existing routes/components/persistence and identify dead controls.
2. Wire the shared catalogue, variants, locations and ledger services; load catalogue candidates without duplication.
3. Activate Inventory editing, receipts, issues/returns/waste and preparation.
4. Connect count and quality workflows to shared records.
5. Connect Overview, Daily Stock, Stock Activity and Notifications to real queries.
6. Implement contextual imports, templates, filtered exports and Settings/location controls.
7. Apply consistent table behaviour and responsive states across every destination.
8. Verify complete flows and report exactly what works and any unresolved business configuration.
18. End-to-end acceptance
Use isolated test records; do not change real kitchen quantities for testing.
Scenario	Expected result
Edit a catalogue name	Every relevant selector/view shows the same updated identity; history remains linked
Receive 60 test pieces, issue 39	Recorded balance is 21 everywhere for that test variant/location
Count 19 against expected 21	Difference is -2; stock stays 21 until confirmed adjustment, then becomes 19
Process test raw stock	Raw decreases and actual processed output increases once with source history
Transfer between tracked locations	Source decreases, destination increases, total remains unchanged
Mark a batch Bad	Available stock reflects the hold; physical quantity changes only on a quantity event
Add a bowl receipt	Packaging balance and filtered report update without a separate monthly database
Retry a save or reimport unchanged transactions	No duplicated stock event
Run a filtered daily report	Correct date scope and balances; CSV/XLSX include all matching rows
Navigate directly, refresh and use Back	Correct route loads with one active menu item and saved records intact
Use phone and desktop	All required actions remain accessible and use the same data


Inspect all visible top-level buttons, submenus, row menus, form submits, filters, tabs, template links and export links. Each must perform its intended action, give a meaningful state, or clearly explain a real prerequisite. Deliver actual connected implementation and verification results; do not claim implementation from this instruction file alone.