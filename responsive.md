My Grandmama Kitchen — responsive interface instructions
Purpose and precedence
Make every existing inventory screen usable on phones, tablets, laptops and large monitors. Implement responsiveness in the working app, not just screenshots. Read database.md alongside this file: it owns stock rules, records, catalogue and reporting. This file owns responsive presentation and interaction. Do not change inventory calculations, add sales, duplicate workflows or lose features to make a layout fit.

Preserve the warm cream, deep green and restrained terracotta design. Use reusable responsive components rather than separate mobile and desktop applications. Both presentations must read and update the same records.
1. Layout foundations
- Use mobile-first CSS, semantic HTML, flexible grids and content-driven wrapping.
- Include the viewport meta tag: width=device-width, initial-scale=1. Never disable zoom.
- Apply box-sizing: border-box globally. Give shrinking flex/grid children min-width: 0. Use minmax(0, 1fr) for flexible grid tracks.
- Avoid fixed page widths, fixed content heights and device-specific positioning. Images and previews must fit their container.
- No page-wide horizontal scrolling at 320 CSS pixels. Wide tabular data may scroll inside a clearly bounded, labelled region.
- Do not hide overflow globally to mask broken layouts. Fix the element causing overflow.
- Use logical spacing properties so alignment is consistent. Keep essential actions in normal flow unless a sticky placement has been verified.
- Use dynamic viewport units for full-height surfaces with a suitable fallback. Respect device safe-area insets, especially around bottom actions.
Layout ranges
These are implementation defaults, not assumptions about device models. Choose layout by available width and actual content; do not infer touch capability from width alone.
Available width	Default presentation
Below 640px	Single-column phone layout, navigation drawer, item cards, full-width forms
640–1023px	Compact/tablet layout, drawer or compact navigation, one/two-column forms where fields fit
1024–1439px	Desktop layout, persistent collapsible sidebar, multi-column workspaces
1440px and above	Spacious desktop layout, bounded reading/form widths, wide stock tables


Use container queries where a component's available space differs from the viewport, such as a form beside an item panel. Do not require JavaScript viewport detection for ordinary layout.
2. Application shell and navigation
- Desktop: persistent sidebar and a flexible main region. Tables may use the full available width; keep long text and forms at readable widths.
- Smaller screens: replace the sidebar with a labelled Menu button opening a drawer containing every navigation destination. Never remove a destination because the screen is small.
- The drawer must support keyboard access, Escape, close button, focus containment and focus return to its trigger. Mark the current page. Close the drawer after navigation and prevent background scrolling while open.
- Keep page title and primary action visible without an oversized header. Wrap secondary actions into a labelled Actions menu when necessary.
- Do not add an eight-item bottom navigation bar. Preserve space for stock work.
- Use roughly 16px outer padding on phones, 24px on tablets and 24–32px on desktops, adjusting for content.
3. Overview
- Summary tiles reflow from one column to two and then additional columns only when readable.
- Keep counts, labels and alert explanations visible. Never truncate the important distinction between quantity and condition.
- Stack attention-list entries and their actions on narrow screens.
- Quick actions wrap into a simple grid or vertical list. All actions remain available.
- Do not add charts or incompatible-unit stock totals to fill empty space.
4. Inventory and Daily Stock
Desktop and wider tablet
- Use the stock table with the column order defined in database.md, including the four portion-size columns, pieces, filled bags and stock in/out.
- Use grouped headers for portion sizes and explicitly label units and processing state.
- Keep the item column and column headers sticky only within a verified scrolling container. Sticky layers must not cover controls, text or keyboard focus.
- Provide optional column visibility controls without changing the underlying records or exported data unexpectedly.
- Keep wide tables inside their own horizontal scrolling region. Indicate that more columns are available. Use semantic table headers and an accessible region label.
Phones and narrow containers
- Default to one card per item/variant, with optional Table view for users needing direct comparison.
- A card shows item, processed/unprocessed state where applicable, location, available quantity with unit, condition and latest-update information.
- Use a labelled 2 × 2 portion grid for 1L, 2.5L, 3.5L and 5L when applicable. Do not show irrelevant empty portion controls for salt or bowls.
- Display loose pieces and filled bags as separate labelled measures. Never compress them into one unlabelled number.
- Show stock in/out and opening/closing balances in an expandable breakdown. Provide access to physical count, difference, remarks, batches and history without navigating through multiple unrelated screens.
- Distinguish zero, not counted, not applicable and missing configuration.
- Keep quick actions easy to tap. Never use a whole-card click target that makes its nested buttons inaccessible.
- Card and table views share the same filters, selected date, selection state and data. Resizing must not submit forms or reset work.
5. Search, filters and selection
- Desktop: search and common filters share a wrapping toolbar.
- Phone: show search, selected date, a Filters button and active-filter count. Open additional filters in a drawer or full-height sheet.
- Provide Apply and Clear All. Closing unapplied filters must preserve the current applied results.
- Show active filters as wrapping chips or an expandable list with readable labels. Each removable chip has an accessible removal control.
- Date presets include Today, Yesterday, Last 7 Days, This Month, All Dates and Custom Range. Wrap or place them in the date control; never make the entire page scroll sideways.
- Make date-range entry usable on touch and keyboard. Clearly label start and end dates and Africa/Lagos reporting context.
- Preserve filters when opening and closing item details or returning from another screen where appropriate.
- For bulk actions, show the selected count and clearly distinguish selected visible rows from all filtered records. A mobile selection toolbar must not cover the last item.
6. Receive, issue and preparation forms
- Phone: one column with full-width fields and labels above inputs.
- Tablet/desktop: use two columns for logically related short fields only when each remains usable. Long notes, line items, previews and validation summaries span the form width.
- Keep input text at least 16px on mobile. Use suitable input modes for quantities and dates without restricting valid decimal quantities.
- Display unit and variant beside the quantity, not only in placeholder text.
- Long item names wrap. Searchable selectors must fit the viewport, remain keyboard accessible and support scrolling options without losing their search field.
- Convert multi-item entry rows into stacked line-item cards on narrow screens. Every line retains item, batch, location, quantity, unit, remove action and validation messages.
- Preparation source/output panels stack vertically on phones. Label Input stock and Prepared output explicitly; do not rely on side-by-side positioning or arrows alone.
- Before/after previews must show all affected stock quantities and units on every device.
- Labels, help text and field errors stay attached to their controls. On failed validation, focus an error summary or the first invalid field without clearing entered values.
- Save Draft and Review/Post actions wrap or stack. Primary action remains identifiable. Show saving, saved and failed states without shifting the entire layout.
- Opening a menu, rotating a phone or resizing a window must preserve unsaved values.
7. Physical Count and Quality Checks
- Provide a focused one-item/batch-at-a-time count option on phones with Next/Previous and progress. Also support list entry without changing the counting rules.
- Keep recorded balance, actual count, unit and difference distinct. Quantity inputs must remain visible above the on-screen keyboard.
- A count discrepancy explanation must not be hidden in a tooltip.
- Quality checkbox, condition selector, checked-by information and inspection time stack clearly. Show long quality notes and batch references with wrapping.
- Photo capture/upload offers normal file selection as a fallback. Do not assume every device has a camera. Previews fit the screen and can be removed before saving.
- Do not require hover to reveal expiry, batch age, warning reasons or actions.
- Warning banners and confirmation dialogs remain readable in landscape and portrait.
8. Stock Activity, reports and exports
- Keep one reporting destination as required by database.md.
- Keep Run Daily Report, Export CSV and Export Excel accessible on all screen sizes. On phones, Run Daily Report can be primary with clearly labelled export actions immediately below or in an Export menu.
- Never hide CSV export behind a desktop-only toolbar.
- Activity rows become labelled cards on phones; preserve type, date/time, item, variant, quantity/unit, location and reference. Open the full event detail with related lines and history.
- Stock Summary can use responsive cards with optional table view. Never drop negative balances, differences or quality exceptions merely to simplify the view.
- Filtered exports use all matching records regardless of viewport, card/table mode or pagination. Responsive column hiding does not silently remove export fields.
- Show export progress and failures. Downloads must be triggered by clear user actions and work in supported mobile browsers as well as desktop browsers.
- Report metadata, date scope and active filters must remain discoverable before export.
9. Import/Export workflow
- Support tap-to-select files and a standard file input; drag-and-drop is optional, never the only route.
- Phone: short vertical step indicator. Desktop: horizontal step indicator only if labels fit.
- Column mapping uses stacked source/destination controls on phones. Show sample values beside each mapping, wrapping long text.
- Import previews may use a bounded horizontal table region, with a row-detail view for narrow screens. Never shrink the whole worksheet into unreadable text.
- Show row errors, source-row numbers, valid/invalid counts and Download Error Rows on every layout.
- Keep the confirmation summary and its stock effect readable before importing. The confirm action must not be obscured by a keyboard or bottom sheet.
- Preserve the chosen file and mappings while moving between steps where the browser allows it. Explain when the file must be reselected; do not pretend it remains loaded.
10. Drawers, dialogs and detail panels
- Desktop item details may open in a side panel; on phones, use a full-width page or sheet with its own clear heading and back/close control.
- Dialogs fit within the visual viewport, including when the keyboard is open. Let content scroll and keep critical actions reachable.
- Avoid stacked dialogs and competing nested scroll areas. Long editing tasks should use a page rather than a tiny modal.
- Preserve focus, accessible names, Escape behaviour and unsaved-change handling. Do not rely on swipe gestures as the only way to close a panel.
- Toasts must not cover Save, Next, export controls or important data. Persistent errors belong near the failed action, not only in disappearing notifications.
11. Touch, keyboard and accessibility
- Aim for 44 × 44 CSS pixel interactive targets, including icon buttons, checkboxes and close controls, with adequate separation.
- Use visible labels and keyboard focus indicators. Support Tab, Shift+Tab, Enter and Escape according to control semantics.
- Use native buttons, links, inputs and tables where appropriate. Use ARIA only to supply missing semantics.
- Meet WCAG AA contrast targets: 4.5:1 for normal text and 3:1 for large text and meaningful UI boundaries. Do not communicate alerts using colour alone.
- Keep DOM and focus order aligned with visual order. Responsive visual rearrangement must not create confusing keyboard navigation.
- Announce saving/import/export results accessibly without repeatedly interrupting the user.
- Support text enlargement, 200% zoom and reflow at a 320 CSS pixel viewport, including the equivalent narrow layout at higher desktop zoom. Two-dimensional tables can use their own scroll region.
- Respect reduced-motion preferences. Do not require animation, hover, precise dragging or orientation lock.
- Long product names, IDs, supplier names and filenames wrap without breaking the layout. Where short visual truncation is necessary, provide a tap/keyboard-accessible full value.
12. Keyboard, viewport and sticky actions
- When the on-screen keyboard opens, keep the active input, its error and the next useful action reachable through scrolling.
- Do not vertically centre a long form inside a fixed-height screen.
- Sticky headers/footers must account for each other, safe areas and keyboard behaviour. Add sufficient content padding and focus scroll margins.
- Prefer a normal-flow action area over a fragile fixed footer. If a sticky action bar is used, test that it never hides the last field or table row.
- Support split-screen tablet windows and resized desktop windows as normal layouts, not exceptional cases.
13. Performance and state preservation
- Do not render all 72 catalogue candidates and their full batch histories as expanded panels at once. Use search, pagination or measured virtualisation where needed.
- Preserve accessible table/list semantics and keyboard operation if virtualisation is used.
- Lazy-load heavy history, image previews and spreadsheet parsing where appropriate. Keep input typing responsive during imports and exports; show progress for lengthy work.
- Do not load separate duplicate datasets for mobile and desktop views.
- Avoid layout jumps as data loads. Show useful empty, loading and failure states at every size.
- Do not claim offline support or cross-device synchronisation merely because the layout works on a phone. Storage/connectivity behaviour follows the implemented architecture and must be labelled truthfully.
14. Printing
- Provide print CSS for the shared report: hide navigation, filter editors, action buttons and decorative chrome.
- Print the business name, date range, applied filters, generated timestamp, units and report view.
- Use landscape orientation for wide stock tables where appropriate; provide column selection or a readable detailed alternative rather than tiny text.
- Repeat table headers across pages where supported. Avoid clipping scrolling regions in print and do not print only the visible/paginated screen rows when the report promises all filtered results.
- Preserve legibility in monochrome. Avoid colour-only quality or shortage indicators.
15. Required verification
Inspect every screen, not only Overview. Test in a real browser with touch and keyboard where available. At minimum cover widths of 320, 360, 390, 430, 768, 820, 1024, 1280, 1440 and 1920 CSS pixels, plus a short landscape viewport and desktop zoom. These are test points, not hardcoded device layouts.

Verify on available Chrome/Edge, Firefox and Safari environments. If a browser or device cannot be tested, state that limitation rather than claiming coverage. Emulation does not establish real-device keyboard, camera or download behaviour.

For each responsive state verify:
1. Navigation reaches every destination and closes/focuses correctly.
2. No page-wide horizontal overflow; only intentional table regions scroll horizontally.
3. Long names, large quantities, decimals, empty data, errors and warnings remain readable.
4. Receipt, multi-item issue, portion preparation, physical count and quality check can be completed without hidden fields/actions.
5. The on-screen keyboard does not block required controls.
6. The four portion columns, pieces and bags remain distinguishable on cards and tables.
7. Filters, dates, entered values and selections survive resize, rotation and panel navigation.
8. Run Daily Report, CSV export and Excel export remain usable and use identical record scope across layouts.
9. File selection, worksheet selection, mapping, validation and import confirmation are usable on phones.
10. Dialogs, focus indicators, sticky areas and notifications do not cover essential content.
11. Printing includes the intended report scope and readable units.
12. Existing stock calculations and duplicate-entry protections still behave as specified in database.md.
Completion criteria
All inventory screens and their loading, empty, error, editing and confirmation states adapt coherently. No essential capability is lost on mobile. No stock logic or persistence is changed just for layout. Record actual verification performed and any remaining browser/device limits. Deliver the responsive implementation, not a promise or a set of desktop-only mockups.