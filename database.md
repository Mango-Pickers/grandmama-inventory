My Grandmama Kitchen — inventory database and workflow instructions
Status: working specification, incorporating the confirmed workflow. Unresolved details are listed at the end and must not be guessed.
1. Purpose and scope
Build a simple inventory application for My Grandmama Kitchen. One inventory officer records receipts, issues, preparation, counts and condition. Record an action once; update balances, activity, notifications and reports from that same record.

This Markdown file instructs the coding agent. It is not the operational database itself. Implement persistent records behind the interface.

Inventory only. Do not implement sales, payments, food ordering or supermarket processes. Preserve the existing UI where appropriate. Do not choose a paid integration or browser-only storage without confirming the access requirements.
2. One inventory and one reporting destination
Do NOT build separate daily, weekly or monthly inventories, databases, report pages or mandatory item-frequency classifications. The handwritten headings describe the officer's physical reporting practice, not separate application structures.

All items belong to one inventory. All posted activity belongs to one shared ledger. Stock Activity is the single reporting destination. Daily Stock is an operational view of the same records, not another place to enter the same transactions.

Include bowls and other packaging in Inventory. They can be selected together when the officer prepares a monthly report, but there is no separate monthly database.

Navigation: Overview, Daily Stock, Inventory, Receive Stock, Issue Stock, Stock Preparation, Physical Count, Quality Checks, Stock Activity, Notifications, Import/Export. Put configuration within Settings or Inventory as appropriate. No Sales menu.
3. Stock Activity and reporting
Place these prominent actions at the top: Run Daily Report, Export CSV, Export Excel.

Run Daily Report opens the report view for today in Africa/Lagos time. Allow selecting another date. Retain the selected item/category/location filters so a report can cover just the required stock. Show all active filters prominently and provide Clear Filters.

One-click date presets: Today, Yesterday, Last 7 Days, This Month, All Dates and Custom Range. Use an explicit date picker for another individual day. All Dates includes all recorded activity; do not silently cap the exported results.

Filters: item or multiple items; category; processed/unprocessed/not applicable; stock form or unit; storage location; batch; activity type; quality condition; low-stock or other quantity alerts. Allow optional named filter presets such as Packaging without creating duplicate item records.

Provide two views within this same reporting destination:
- Activity: dated transaction detail.
- Stock summary: opening balance, receipts, returns, issues, preparation inputs/outputs, transfers in/out, waste, adjustments, closing balance, latest applicable physical count, count difference and condition information.
Show item, variant, unit and location on every quantity row. Never total incompatible units. Label the timestamp of physical counts and quality checks; a check after the report cutoff must not be presented as the historical condition at that cutoff.

Include items with opening or closing stock even if they had no activity that day. Allow Include zero-stock items. Historical opening balances include transactions before the report period, even when activity-type filters narrow the detail list. Never present a balance calculated from an incomplete subset of transaction types as the actual stock balance.

Export CSV is a real download action/link adjacent to Run Daily Report. Export the selected view and all matching records, not only the visible page. Display the view, date range, timezone, filters, generated time and record count in the UI. Include applicable context columns in CSV. Suggested filename: my-grandmama-kitchen-stock-activity-YYYY-MM-DD.csv. Show an understandable empty-result state.

Excel export may contain Stock Summary and Stock Activity sheets, with filter context and report metadata. Use real numbers and dates. Print/Save as PDF may use the same report view. Do not create separate reporting engines for each format.

Reports are generated for manual sharing with the manager, supervisor and MD. Do not mark them sent, reviewed or approved automatically. No mandatory approval step for routine recording.
4. Items, variants and stock forms
An item is the ingredient or supply name. Applicable food items may have Processed and Unprocessed variants with separate balances and stable IDs. Processed can mean seasoned, cleaned, boiled or otherwise prepared; do not rename it universally to Cooked.

Example: Shrimps / Processed and Shrimps / Unprocessed are distinct selectable stock records grouped under Shrimps. A toggle filters/selects a variant; it must never relabel existing stock. Salt, seasoning cubes, bowls and empty Ziploc bags have processing state Not applicable.

Keep processing state separate from packing form. A processed item can be loose pieces, a filled bag or prepared portion packs. Portions intended for 1L, 2.5L, 3.5L and 5L soup are separate allocation sizes, not ingredient volumes. Do not assume pieces per portion.

One filled Ziploc contains its defined labelled item. An intentional mixture, such as tatashe and pepper, may be a separately named item. Do not combine unrelated ingredients arbitrarily. Empty bags are packaging stock, distinct from the filled ingredient bags.

Bag contents and carton yields are variable unless explicitly configured. Permit fractional bags where actually measured. Do not infer a fixed pieces-per-bag conversion. If bag count and content quantity both describe the same stock, identify one as the balance unit and the other as descriptive information; never add them together as extra stock.

Keep unopened packs and opened packs distinct where required. Opening a pack must reduce unopened-pack stock and create its opened state in one event. Without a measured remaining quantity, do not pretend the contents of an opened pack are precisely known.

Use categories, stock forms and saved filters for organisation. Do not duplicate an item merely because it appears on several paper lists. Different brand, size, processing state or formulation may legitimately need separate variants. Preserve history when renaming; archive rather than deleting used records.
5. Minimal record structure
Use stable IDs and foreign keys. The implementation may combine closely related tables if it preserves these relationships and stays simple.
Record	Required meaning and key fields
Item	ID, name, category, active/archive status, processing enabled
Stock variant	ID, item ID, processing state, stock form, portion-size label if applicable, balance unit; unique defined combination
Location	ID, name; distinguish storage locations and kitchen line if tracked
Batch	ID, variant ID, supplier/reference if known, received date, source batch/preparation links, labelled expiry if known, review date if configured
Activity event	ID, type, effective date/time, recorded date/time, entered by, reference, reason, posted/draft status, reversal link, import-session link
Activity line	ID, event ID, batch/variant ID, location ID, unit, signed quantity; purchase quantity/unit retained separately where useful
Preparation	Event/source links, source quantities, actual output quantities, waste, preparation date, output batch links
Physical count	ID, count time, location, variant/batch/form, unit, recorded balance at count time, observed quantity, difference, notes, linked adjustment if confirmed
Quality inspection	ID, batch ID, inspection time, checked by, condition, notes, optional photo reference
Threshold/rule	Applicable variant/location/unit, optional low/high thresholds, stock-age or inactivity rule, review rule; no invented defaults
Import session	ID, source file identity, import type, source-row references, validation result and committed event IDs
Saved report filter	Optional name and filter configuration; references existing items, never copies stock


Balance at a cutoff is derived from posted signed ledger lines through that cutoff. A cached balance is allowed only if it reconciles to the ledger. Drafts never affect balances. Record effective and entry times separately for backdated entries.
6. Receipts, preparation, issues and transfers
Receive Stock: select an existing variant, enter actual quantity/unit, date, destination, batch and condition. Add a new item only when genuinely needed.

For chicken or turkey, retain cartons purchased and actual pieces counted after cutting. If received directly as counted pieces, post one piece receipt. If whole stock is received first, cutting later consumes that stock and creates the actual piece output. Never add both as independent receipts for the same goods.

Stock Preparation: consume specified source batches/forms and create the actual output batches/forms atomically. Record processing, portioning, repacking and any waste. Output quantity may differ from input quantity/unit; do not impose a fabricated yield. Source deductions already include material consumed by preparation: do not deduct recorded preparation loss a second time.

Issue Stock: select item/variant, batch or eligible batch allocation, location, quantity/unit, destination and purpose. Deduct once. No sales-linked second deduction.

Transfers: moving stock between two tracked locations reduces the source and increases the destination in one linked event. It does not reduce total business inventory. If the kitchen is outside the tracked boundary, an issue is an outbound event. Confirm the kitchen boundary before coding this distinction.

Returns: record actual quantity and condition and link the original issue where possible. Waste records quantity, batch/location and reason. Adjustments require a reason and explicit confirmation. Posted errors are corrected with linked reversals/corrections, not silent deletion.

Prevent normal issues beyond available eligible stock. Save related ledger lines together. Use unique operation IDs so retries/double-clicks cannot repeat a receipt, conversion or deduction.
7. Daily Stock and Physical Count
Daily Stock shows all relevant available items for a selected date, including carried-forward stock. It is not limited to items received that day. Filter by location, category, item and processing state.

Retain the requested visible fields: Item; portions under 1L, 2.5L, 3.5L and 5L; Pieces; Filled Ziploc Bags; Stock In; Stock Out. Include opening/closing balance, waste, physical count, difference, unit and condition through clear columns or an expandable breakdown. Mixed stock forms must have separate labelled quantities, not one misleading numeric balance.

The portion/piece/bag columns in a physical-stock view represent quantities held, while issues appear in Stock Out. If a report offers portions issued, label that mode explicitly rather than reinterpreting an unlabeled column. Do not automatically equate one filled bag with one prepared portion.

Physical Count records what was observed, at what time and location. Blank means not counted; zero means counted and none found. Difference = physical count minus the corresponding recorded balance at count time. Counts do not create receipts or silently overwrite balances. A confirmed reconciliation creates a linked signed adjustment. Refresh the expected balance if activity changed while a count was being entered.
8. Quality, stock age and notifications
Quality and quantity are separate dimensions. Good condition can coexist with low stock.

Receipt forms may preselect Good as requested, but require confirmation on saving. Store the person and timestamp as a receipt condition observation. Imported quantities without a quality observation remain Unknown/Not checked. A default is not an inspection history.

Condition options: Good, Needs review, Bad. Store every later check with its own time. Display the latest applicable observation and its age. Quality checks must not create a second receipt or count adjustment.

Each batch retains its own received date. New receipts never reset older stock's age. Store labelled expiry where present. Distinguish No labelled expiry from Unknown. Review periods, alert lead times and expiry handling must use kitchen-approved rules; do not invent shelf lives or declare food safe based only on appearance.

Notifications gather low stock, configured overstock, approaching expiry, expired stock, quality concerns, checks due, old stock, slow-moving stock and unresolved count differences. Thresholds and inactivity windows must be editable by compatible unit and item/location. Missing rules display Not configured, not a false healthy status.

Preparation, repacking and transfers do not restart the original stock-age history. Keep both source receipt age and preparation date. Slow-moving rules should use actual consumption/outbound usage, not let an internal transfer alone make old goods look newly sold or consumed.

Held or bad stock remains physically accounted for but separate from available stock until resolved or disposed. Do not subtract it merely because condition changed, then subtract again on disposal. Do not allow ordinary issues of blocked stock.

In-app alerts are required. Background email, WhatsApp or push alerts are not assumed or promised without a separately implemented delivery system.
9. Bowls and other packaging
Include bowls in the same Inventory catalogue under Packaging, along with lids and empty Ziploc bags. The officer may select Packaging in the shared report for a monthly review or any other date range. Every packaging receipt and issue still updates stock immediately.

Maintain separate editable bowl variants by physical capacity. Previously described capacities: 1.5L, 3L and 4L. Confirm any additional capacity before seeding it. Keep soup-serving size separate from bowl capacity.

Previously described reference mappings, editable and pending final confirmation:
- 1L soup: one 1.5L bowl.
- 2.5L soup: one 3L bowl.
- 3.5L soup: one 4L bowl.
- 5L soup: one 4L bowl plus one 1.5L bowl.
These are reference settings, not automatic sales logic. Do not invent a 5L bowl from a 5L soup size. If lids are included in bowl sets, avoid counting a separate lid receipt/issue as well. Carton-to-bowl conversions require the actual pack count.
10. Excel and CSV across relevant screens
Provide contextual import/export actions where applicable: Inventory catalogue, receipts, issues, preparation, physical counts, quality checks and Stock Activity. Overview may link to the shared report. Notifications may export filtered alerts but must not offer an arbitrary stock-changing import. Contextual actions reuse one validation/import service.

Required formats: UTF-8 CSV and XLSX. Support legacy XLS only if the chosen parser genuinely handles it; explicitly list supported extensions and explain unsupported formats. No blanket promise to accept every Excel format. Do not execute workbook macros or formulas.

Import flow: upload -> select worksheet/type -> map columns -> validate -> preview -> confirm -> result. Keep source-row references. Distinguish catalogue imports, initial opening stock, count observations and actual transactions.

Validate item identity, processing state, stock form, unit, quantity, dates, location and batch. Do not silently merge names, infer bag yields or treat a stock count as a purchase. Unknown names require explicit mapping or creation. Opening quantities cannot be re-added to established stock as ordinary receipts.

Reject duplicates by operation/import identity where possible and flag suspected duplicates for review. Do not reject legitimate identical-looking transactions solely because their values match. Handle blank versus zero correctly. Commit confirmed imports atomically; show errors and let the user download error rows.

CSV/XLSX exports must match the full selected view/filter set. Retain IDs in detailed reimportable exports. Escape formula-like free text for safe spreadsheet viewing. Keep human-readable summaries distinct from transaction-import templates. Reimporting an unchanged export must not duplicate stock.
11. Catalogue source and unresolved details
Use the user's three stock photographs as catalogue references, not automatic opening-balance imports. Deduplicate repeated names while preserving distinct processed/unprocessed variants. Do not seed uncertain handwritten names or quantities as confirmed facts.

No operational daily/weekly/monthly frequency field is required. The source-paper headings may be retained only as source provenance during transcription, not as application partitions.

Confirm before loading real opening quantities: count date and whether photographed quantities are actual opening stock. Confirm uncertain item names and stockfish/goat-assorted duplicates. Confirm opened-pack measurement, the tracked kitchen boundary, additional bowl capacities, and access/storage requirements. Catalogue refinement must not block the agreed general ledger/report architecture.
12. Acceptance checks
- One receipt appears once in inventory balances, Daily Stock and Stock Activity without re-entry.
- Processed/unprocessed variants have separate balances; a filter never converts stock.
- Preparation consumes source stock and creates actual outputs once, with linked history.
- Internal transfers preserve the business total and change location totals correctly.
- Counts record observations; only a confirmed adjustment reconciles a difference.
- The daily report includes carried-forward stock and zero-activity items with balances.
- Report date presets and item/category filters work in one shared destination.
- Export CSV downloads every matching row and agrees with the displayed report scope.
- Bowls appear with other packaging and can be included in any report date range.
- Old batches keep their age when new stock arrives, is processed or transferred.
- Quality changes do not silently change quantity.
- Duplicate submissions/imports cannot double stock.
- Missing unit conversions remain explicit; incompatible quantities are never summed.
- Persistent saving, error recovery and full backup/restore work; exports alone are not represented as a full backup.
Keep forms short: select an existing item, enter the relevant quantity and details, save once. Reuse that record everywhere.
13. Full product catalogue for application embedding
This catalogue incorporates all entries in the consolidated product list reviewed with the user. Categories organise a single inventory; they are not daily, weekly or monthly partitions. Do not create opening quantities from this list.
Catalogue loading rules
- Store every listed entry, including uncertain entries, in the catalogue configuration. Give uncertain entries confirmation_status: pending and keep them out of normal receipt/issue selectors until confirmed. Do not silently omit them or present tentative names as verified.
- Use stable item IDs and separate stable variant IDs. Upsert by ID when loading again; do not create duplicates.
- A row with explicit variants creates one parent product and the listed separate variants. Other processing states can be enabled later where relevant.
- A row marked “state to confirm” can exist as a draft parent without inventing a Processed or Unprocessed balance. For recognised supplies, processing is Not applicable.
- The previous list's “Torso” and other uncertain readings are provisional labels only. Preserve a source label and confirmation note so the officer can correct them without losing identity.
- Portions, pieces, filled Ziploc bags, packs, kilograms and litres are stock forms/units, not extra parent products. Never seed a bag-to-piece or portion-to-piece conversion without confirmation.
- IDs below identify catalogue entries. Rows needing possible merging remain pending until reviewed; never silently consolidate genuinely different mixtures or sizes.
A. Proteins, meat and seafood
Item ID	Product	Listed variants / confirmation note
MGK-P001	Sea snail	Processed; Unprocessed
MGK-P002	Snail	Processed; Unprocessed
MGK-P003	Shrimps	Processed; Unprocessed
MGK-P004	Crabs	Processed; Unprocessed
MGK-P005	Prawns	Processed; Unprocessed
MGK-P006	Catfish	Processed; Unprocessed
MGK-P007	Crayfish	Processing state to confirm
MGK-P008	Periwinkle	Processing state to confirm
MGK-P009	Goat meat	Processed; Unprocessed
MGK-P010	Goat assorted	Processed; Unprocessed; deduplicate repeated references to the same variant
MGK-P011	Goat head	Processing state to confirm
MGK-P012	Cow assorted	Processing state to confirm
MGK-P013	Cow head	Unprocessed
MGK-P014	Cow leg	Unprocessed
MGK-P015	Beef meat	Processed
MGK-P016	Stockfish	Processed entry identified; plain entry's state is pending. Do not create a second plain balance until clarified
MGK-P017	Dry fish	Processed; Unprocessed
MGK-P018	Fish head	Processing state to confirm
MGK-P019	Turkey	Processed
MGK-P020	Gizzard	Processing state to confirm
MGK-P021	Chicken	Processing state to confirm
MGK-P022	Guinea fowl	Processed; Unprocessed
MGK-P023	Barracuda	Processing state to confirm
MGK-P024	Torso	Pending: confirm intended product name
MGK-P025	Dried protein	Pending: confirm product identity and contents
MGK-P026	Goat head and assorted mixture	Pending: confirm this is a distinct labelled mixture, rather than a duplicate of another goat item


B. Sauces, vegetables and prepared ingredients
Item ID	Product	Listed form / confirmation note
MGK-V001	Tomato paste sauce	Prepared sauce
MGK-V002	Pepper paste sauce	Prepared sauce
MGK-V003	Tomato and shombo mixture	Pending: exact name and preparation state
MGK-V004	Blended dry pepper	Pending: confirm handwritten wording
MGK-V005	Tatashe and shombo mixture	Blended; Unblended; one parent product with two preparation variants
MGK-V006	Banga	Peeled and processed
MGK-V007	Afang leaves	Preparation state to confirm
MGK-V008	Waterleaf	Preparation state to confirm
MGK-V009	Bitter leaf	Preparation state to confirm
MGK-V010	Ugu leaves	Pending: confirm handwriting
MGK-V011	Scent leaf / efirin	Pending: confirm name; listed as blended/pounded
MGK-V012	Mushrooms	Preparation state to confirm
MGK-V013	Boiled brown beans	Prepared
MGK-V014	Green peas	Preparation state to confirm
MGK-V015	Egusi	Uncooked; Cooked. Preserve these preparation labels; do not assume their yield or silently equate them to another variant


C. Seasonings, thickeners, extracts and oils
Item ID	Product	Size / confirmation note
MGK-S001	Uziza	Pending: confirm seed or leaf form
MGK-S002	Achi	Pending: confirm separately stocked product, rather than part of the same handwritten entry as uziza
MGK-S003	Nkwobi ingredient	Pending: exact product name; determine whether separate from MGK-S001/S002 before activating
MGK-S004	Ogiri Okpei	Pending: confirm spelling
MGK-S005	Ogiri — second variety	Pending: exact handwritten variety
MGK-S006	Nutri B	Pending: product name
MGK-S007	Banga extract	Small container; brand and actual container size to confirm
MGK-S008	Coconut water	Pending: confirm handwritten reading
MGK-S009	Extract — 23L container	Pending: exact extract name and container capacity
MGK-S010	Kings oil	5L purchase size; stock balance unit to configure
MGK-S011	Wema oil	Pending: brand and size
MGK-S012	Mr. Chef salt	1kg purchase size; balance unit and pack conversion to configure
MGK-S013	Terra seasoning cubes	Pack quantity to configure


D. Packaging and disposable supplies
Item ID	Product	Variants / confirmation note
MGK-K001	Soup bowl	1.5L; 3L; 4L physical-capacity variants. Do not seed a 5L bowl just because there is a 5L soup portion
MGK-K002	Bowl lid	Matching size variants only if stocked separately; otherwise preserve the bowl-and-lid set as one stock unit
MGK-K003	Ziploc bag — 40 × 60	Pending: confirm measurement unit and specification
MGK-K004	Ziploc bags — “208 total / 5X bags”	Pending: exact product specification and pack quantity
MGK-K005	Storage bags — “52 storage gallon”	Pending: brand, capacity and pack quantity
MGK-K006	Falcon cling film	Width unspecified in first entry; confirm specification and whether distinct from MGK-K007
MGK-K007	Falcon cling film — 30cm	Listed width 30cm; retain separate size if distinct from MGK-K006
MGK-K008	TopStar cling film — 45cm	Pending: confirm brand spelling; listed width 45cm
MGK-K009	Belle serviettes	Pending: confirm brand spelling
MGK-K010	Disposable hairnets	Pending: confirm handwritten product name
MGK-K011	Latex gloves	Size and pack quantity to configure
MGK-K012	Disposable gloves	Confirm type; retain separately from latex gloves if genuinely different
MGK-K013	Dustbin bags	Size and pack quantity to configure
MGK-K014	Fragile tape	Count rolls; confirm purchase-pack specification


E. Cleaning and stationery
Item ID	Product	Confirmation note
MGK-C001	Iron sponge	Pack quantity to configure
MGK-C002	Morning Fresh scouring powder	Pending: confirm brand and product wording
MGK-C003	Whiteboard markers	Count individual markers; configure pack quantity if used
MGK-C004	Unclear item below “Dried protein”	Pending: obtain written name before activation


Catalogue completeness and operational rules
The catalogue contains 72 parent/candidate entries: 26 proteins, 15 sauces/vegetables/prepared ingredients, 13 seasonings/extracts/oils, 14 packaging entries and 4 cleaning/stationery entries. Variants are additional stock identities, not additional parent catalogue rows. Pending possible duplicates are included for review and must not produce duplicated active stock.

Keep pending entries visible in Inventory under a Needs confirmation filter. Let the officer correct names, confirm variants, merge a verified duplicate with preserved references, or archive a mistaken transcription. All active and pending entries belong to this one catalogue; no reporting-frequency partition is required.

Do not activate stock-changing actions for an entry until its identity, selected variant and balance unit are defined. Missing quantities remain blank, not fabricated opening zeroes. A new item starts with no opening transaction until the officer records or imports one.

All catalogue entries and variants should be available to contextual CSV/XLSX catalogue exports with their confirmation status. Stock Activity reports show only real activity and applicable balances; catalogue candidates do not create phantom stock, quality checks or low-stock alerts.