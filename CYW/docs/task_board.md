# Project Task Board (Trello-style)

This document tracks current issues, feature requests, and improvements for the CookieClick_yourWaytoAIMoney project. Update this file as tasks are completed or new issues arise.

---

## Priority Assessment (2026-03-01 17:50 UTC)

### Fix first — these block other work or cause visible regressions:
- ~~#1 — Gibbet Selection Visual Bug: Regression from the transparent hit area overlay system. Likely caused by DraggableItem wrapper or hit area div showing a default background. Fix: set background: "transparent" on all overlay elements and check for browser default styling. Should take under an hour and should be fixed before more terrarium work.~~ _(Completed: replaced with animated circling orbs, masking for 3D effect, bug eliminated.)_
- **#8 — Performance/Memory Leak**: Investigate before adding features. Suspected causes: requestAnimationFrame tick loop in Terrarium not cleaning up when gibbetEntries changes, and updateSimState triggering worldStore re-renders at 60fps. Audit these before animation system changes.

### Do next — high value, relatively self-contained:
- **#9 — Trainer Brain Sync**: Wire up store. Clicking a brain in BrainsRoster or a gibbet in GibbetRoster should call setActiveTrainerId(brain.id). One line per click handler. High gameplay value, minimal risk.
- **#11 — Brain/Body/Gibbet Constraints**: Design and partial implementation exist. Finish greying out body icons in BodiesRoster and remove any remaining brain reuse guards from combine.
- **#3 — Weather Terrarium & Drag-Select**: Drag-select is a one-liner in DraggableItem (call select(type, id) from startDrag). Weather terrarium needs further investigation.
- **#10 — Icon Wiggle Feedback**: Add CSS animation to DraggableItem. Default: slow 3s gentle oscillation. Hover: faster, larger amplitude. Pure CSS.

### Design work required before implementing:
- **#2 — Body Types with Resource Multipliers**: Data design needed. Decide where multipliers live (GIBBET_BREEDS, body object, or gibbet engine). Multiplier must flow into tickGibbet's mining calculation.
- **#6 — Combine Panel UI**: Sizing decision needed. Options: compact floating card (240px wide, auto height, near drag origin) or side panel reduced to 220px. Floating card is more interesting but needs drag origin coordinates.
- **#4 — Gibbet Naming**: UI decision needed: inline rename in roster (double-click) or name field in left panel inspector. Inspector approach is cleaner.
- **#5 — Random Gibbet Name Generation**: Mostly written. Remaining: hook generateGibbetName() into combineGibbet as default, add "regenerate name" button in naming UI from #4. Depends on #4.
- **#12 — Left Panel Info Section**: Design is ready. Implementation can begin — SelectedEntityPanel, tabbed detail, and SelectionProvider are all specced.

---

## Issues & Feature Requests

1. ~~Gibbet Selection Visual Bug~~ _(2026-03-01 05:47 UTC, completed 2026-03-01 18:10 UTC)_
   - ~~On selecting a gibbet currently assigned to a terrarium, that gibbet is replaced/covered by a grey circle.~~
   - _Fixed: Selection now uses animated circling orbs with SVG masking for 3D effect. No visual artifacts remain._

2. **Body Types with Resource Multipliers** _(2026-03-01 05:47 UTC)_
   - Implement different body types that players can buy, each with unique multipliers for collecting different colored resources.

3. **Weather Terrarium & Drag-Select** _(2026-03-01 05:47 UTC)_
   - Address the weather terrarium. Dragging an object from a roster or terrarium should also select that object.

4. **Gibbet Naming** _(2026-03-01 05:47 UTC)_
   - Allow users to name their gibbets.

5. **Random Gibbet Name Generation** _(2026-03-01 05:47 UTC)_
   - Complete the random gibbet name generation system.

6. **Combine Panel UI** _(2026-03-01 05:47 UTC)_
   - Make the combine panel take up less of the screen.

7. *(Intentionally left blank for future use)* _(2026-03-01 05:47 UTC)_

8. **Performance/Memory Leak Investigation** _(2026-03-01 05:47 UTC)_
   - Investigate possible memory leaks or performance issues, as occasional animation stutters have been observed. May be due to heavy on-screen activity or lack of optimization.

9. **Trainer Brain Sync** _(2026-03-01 05:47 UTC)_
   - Selecting a brain or gibbet should update the trainer to have that brain (or the brain attached to a gibbet) as the active brain in training.

10. **Icon Wiggle Feedback** _(2026-03-01 05:47 UTC)_
   - Brain, body, and gibbet icons should wiggle slightly by default, and wiggle more when hovered, to encourage drag-and-drop interaction.

11. **Brain/Body/Gibbet Constraints** _(2026-03-01 05:47 UTC)_
   - A brain can be used to make any number of gibbets, but a body can only be used once. Grey out the icon if a body is in use.

12. **Left Panel Info Section** _(2026-03-01 05:47 UTC)_
   - Improve the left panel info section.

---

*Add new issues below as needed. Mark completed items with ~~strikethrough~~ and move them to a "Done" section if desired.*
