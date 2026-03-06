# Project Task Board (Trello-style)

This document tracks current issues, feature requests, and improvements for the CookieClick_yourWaytoAIMoney project. Update this file as tasks are completed or new issues arise.

---

## ✅ Completed

### Unlock upgrades not propagating to buy menus
Upgrade panel sets unlock on engine state (gs), rosters read from world store. Fix: mirror unlock flags into worldStore when upgrade is purchased. (Resolved, working as intended.)

### #2 — Body types with resource multipliers (2026-03-05)
- Refactored engine and UI to use full body/brain objects in gibbet state and gibbetEntries.
- Body multipliers are now applied directly in resource collection logic (tickGibbet), using body.typeId and multipliers from BODY_TYPES.
- Removed legacy meta/typeId indirection; all lookups are explicit and robust.
- Defensive checks prevent crashes on gibbet/brain/body deletion.
- All architectural and codebase structure docs updated accordingly.

### #3 — Drag-Select
One-liner in DraggableItem: call select(type, id) from startDrag. Do this sprint, it's genuinely one line. - Flip this dude. and also flip this dude. - Done it's the inverting call with the note in draggableobject

### #NEW — Terrarium nav button glows and drag-to-navigate (2026-03-06)
- Terrarium nav button now glows when dragging a gibbet.
- Dragging a gibbet over the Terrarium button auto-navigates to the terrarium view.
- Uses shared drag context, robust to context/provider issues.
- Feature complete and visually confirmed.

- [x] Refactor and debug body/brain type handling for gibbets in the terrarium engine, ensure body multipliers affect resource collection as intended (5 Mar 2026)
- [x] Remove legacy indirection (meta/typeId fields), use explicit body/brain objects (5 Mar 2026)
- [x] Clean up legacy state in Terrarium.jsx (6 Mar 2026)
- [x] Terrarium nav button glows when holding a gibbet (dragging), and auto-navigates to Terrarium when hovered during drag (6 Mar 2026)
- [x] Swap right panel tab order so "Grow Gibbets" is first and default (6 Mar 2026)

---

## 🔴 Active / In Progress

### #NEW — Grow Gibbets progressive unlock
On first load, only the Brains section is active. Bodies and Gibbets sections are greyed/locked until the first brain has been trained at least once. Simple trainCount > 0 check.

### #4 + #5 — Gibbet naming + random name generation
Double-click to rename in the gibbet roster card (inline <input> that commits on blur/enter). generateGibbetName() already written — hook into combineGibbet as default. Add a 🎲 button next to the name field to regenerate.

---

## 🟡 Sprint 1 — Core UX (self-contained, high value)





### #NEW — Swap right panel tab order + default to Grow Gibbets
Move Grow Gibbets tab before Upgrades. Make it the default. This is the correct new user journey: land on trainer → see brain roster immediately → train → grow → terrarium.

### #NEW — Grow Gibbets progressive unlock
On first load, only the Brains section is active. Bodies and Gibbets sections are greyed/locked until the first brain has been trained at least once. Simple trainCount > 0 check.

### #4 + #5 — Gibbet naming + random name generation
Double-click to rename in the gibbet roster card (inline <input> that commits on blur/enter). generateGibbetName() already written — hook into combineGibbet as default. Add a 🎲 button next to the name field to regenerate.

---

## 🟡 Sprint 2 — Entity Depth

### #12 — Left panel info section
SelectedEntityPanel with tabbed detail is fully specced. Implement SelectionProvider, SelectedEntityPanel, wire roster click handlers. Replace GibbetBioPanel.

### #NEW — Gibbet bio: lifetime collection + age
In the gibbet's store object, track createdAt (already exists) and lifetimeCollections: { red: 0, green: 0, blue: 0 }. Increment in tickGibbet on each successful collection. Display in the LIVE tab of the gibbet inspector: age in game-time, total resources by colour.

### #NEW — User-clickable resources
Resources in the terrarium can be clicked directly by the player for a small manual yield. Very slow rate — roughly 10% of gibbet mining speed. Visual: brief click ripple on the resource. Mechanically: directly reduce resource.health by a fixed amount on click. "Jangling keys" mechanic, explicitly slow.

---

## 🟡 Sprint 3 — Polish

### #2 — Body types with resource multipliers
Architecture approved. Data structures exist. Remaining: wire multiplier into tickGibbet collection calculation, update body roster to show multiplier bars, add compatibility insights to inspector.

### #13 — Unify roster icon display
Brain and body roster items should look like the gibbet roster items — full-width draggable panel, consistent click target. Currently they have a separate icon + RosterItem pattern.

### #6 / #14 — Combine panel sizing
Currently implemented as compact floating card (width: 160, auto height). Review whether this matches the intended design or needs further reduction.

### #15 — Control panel height fits content
Already partially addressed in CombinePanel (auto height). Audit other slide panels for the same.

### #3 (weather terrarium part)
Separate from drag-select. Needs investigation of current T2 state before estimating effort.

---

## 🟡 Sprint 4 — Buy Menu Refactor & Reactivity

### #NEW — Refactor brains/bodies buy menus to match upgrades sidebar pattern
- [x] Remove temporary purchase handler wrapping and force-update hacks.
- [x] Refactor BrainsRoster and BodiesRoster to use an injected panel/useEffect pattern, as in the upgrades sidebar (Terrarium.jsx).
- [x] Ensure buy menus re-render on resource and unlock state changes, using canonical engine state for all logic.
- [x] Resource deduction and unlock propagation must be immediate and reliable, with UI updating instantly after purchases/unlocks. _(Resource deduction: done. Unlock propagation: in progress)_
- [x] Visually and functionally match the upgrades sidebar: correct enable/disable logic, unlocks appear as soon as available, no stale state.
- [x] Test: resource counters and buy menus update instantly after purchases; unlocks propagate immediately. _(Resource counters: done. Unlocks: in progress)_

---

## 🔵 Backlog — Needs design before implementing

### #NEW — Upgrade costs actually displayed and enforced
Costs show in upgrade panel but don't gate purchase (separate from brain/body purchase bug). Audit upgrade affordability check against live gs.collections values.

### #NEW — Weather terrarium state visible to user
Weather value should be visible somewhere in the T2 terrarium UI — a subtle indicator bar or atmospheric visual effect showing current weather intensity and the inversion threshold.

### #NEW — Brain/body costs displayed correctly
Costs are shown in the type selection panels but the display may not be pulling from the correct data source. Audit after purchase deduction bug is fixed.

---

## ✅ Done
#1 Gibbet selection visual bug · #8 Performance/memory leak · #9 Trainer brain sync · #10 Icon wiggle feedback · #11 Brain/body/gibbet constraints · SlidePanel clipping (top + bottom) · #ACTIVE — Resource purchase deduction not firing

- [x] Resource rate and count sparklines now use global normalization for direct comparison between colors.
- [x] Count/second trace is a true time series (rolling history), not a flat line.
- [x] Crits and all resource flow are included in rate calculations.
- [x] Defensive filtering for legacy data in collectionHistory.
- [x] Count/second trace normalization is now global, so heights are directly comparable between colors.
- [x] See codebase_structure.md for note on allHistories/allBuckets recomputation (refactor candidate).
- Resource rate calculation in getResourceRate now uses a fixed 10s window (not elastic), so the displayed rate always reflects recent throughput and responds immediately to upgrades. (2026-03-04)
- Resource rate display now uses an exponential moving average (EMA) for smooth, responsive feedback. (2026-03-04)

---

## Architectural Notes
- See architectural approval and plan (2026-03-02) for data structures, UI/UX, and engine integration details.
- Ensure all new types and unlocks are data-driven and extensible.
- Maintain backwards compatibility for existing brains/bodies.

## Documentation & Readiness Checklist
- [x] All new/changed files and modules documented in codebase_structure.md
- [x] Onboarding.md updated with new gameplay and system concepts
- [x] Inline code comments for all new/complex logic
- [x] Task board updated as tasks are completed

---

*Add new issues below as needed. Mark completed items with ~~strikethrough~~ and move them to a "Done" section if desired.*

---

# Task Board

## Completed
- Resource deduction and unlock propagation bugs in brains/bodies buy menus and upgrades system are fixed.
- Purchasing brains/bodies now deducts from the correct resource pile and unlocks propagate to the UI, making new types available immediately.
- Left and right panels refactored for canonical structure and robust reactivity; buy menu logic matches upgrades sidebar pattern.
- Documentation (task_board.md, codebase_structure.md) updated to reflect changes.
- Visual update: resource icons (SVGs) are used for costs in buy menus.
- Code-by-code audit of unlock propagation for brain/body types and their buy menus is complete and robust.
- Unlock state management in worldStore.jsx and its propagation to BrainsRoster.jsx and BodiesRoster.jsx is confirmed and fixed.
- Buy menus immediately reflect unlocks after upgrades.
- Final polish and verification of UI/UX for buy menus and unlocks completed.

## Pending
- Further polish, refactoring, or new features as needed.

---

(Last updated: 2026-03-03)




#### G in terrarium engine. We are dealing with body type multipliers.

## the g.meta, looks to have been half implemented, but not finished.

### Properly implemnenting g.meta, will enable body type multipliers to work, and will also set us up for future body type synergies and interactions that go beyond simple multipliers.

