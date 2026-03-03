# Project Task Board (Trello-style)

This document tracks current issues, feature requests, and improvements for the CookieClick_yourWaytoAIMoney project. Update this file as tasks are completed or new issues arise.

---

## Sprint: Brain Types & Body Types (2026-03-03)

**Goal:** Implement the new Brain Types (weather-aware, unlockable, input vector logic) and Body Types (resource multipliers, unlocks, visuals, UI, multiplier logic) as per the approved architectural plan. Ensure all supporting UI/UX, engine, and documentation updates are included.

### Sprint Tasks
- [ ] Create `src/data/brainTypes.js` and `src/data/bodyTypes.js` with type definitions, icons, and unlock logic.
- [ ] Update `worldStore.jsx` to support brain/body types, unlocks, and correct creation logic.
- [ ] Integrate weather state into terrarium UI and brain input vector logic.
- [ ] Implement resource multiplier logic for body types in the engine.
- [ ] Update BrainsRoster and BodiesRoster to display types, unlocks, icons, and compact multiplier bar.
- [ ] Add compatibility/insight display for brain/body combos in the inspector.
- [ ] Add/Update documentation: codebase_structure.md, onboarding.md, and inline code comments.
- [ ] Review and update task board as work progresses.

### Architectural Notes
- See architectural approval and plan (2026-03-02) for data structures, UI/UX, and engine integration details.
- Ensure all new types and unlocks are data-driven and extensible.
- Maintain backwards compatibility for existing brains/bodies.

### Documentation & Readiness Checklist
- [ ] All new/changed files and modules documented in codebase_structure.md
- [ ] Onboarding.md updated with new gameplay and system concepts
- [ ] Inline code comments for all new/complex logic
- [ ] Task board updated as tasks are completed

---

## Priority Assessment (2026-03-01 17:50 UTC)

### Fix first — these block other work or cause visible regressions:
- ~~#1 — Gibbet Selection Visual Bug: Regression from the transparent hit area overlay system. Likely caused by DraggableItem wrapper or hit area div showing a default background. Fix: set background: "transparent" on all overlay elements and check for browser default styling. Should take under an hour and should be fixed before more terrarium work.~~ _(Completed: replaced with animated circling orbs, masking for 3D effect, bug eliminated.)_
- ~~#8 — Performance/Memory Leak: Investigate before adding features. Suspected causes: requestAnimationFrame tick loop in Terrarium not cleaning up when gibbetEntries changes, and updateSimState triggering worldStore re-renders at 60fps. Audit these before animation system changes.~~ _(Completed: Animation loop refactored to use refs, effect dependencies minimized, updateSimState dirty-checked. No stutter observed after fix. Ongoing monitoring for memory leaks recommended.)_

### Do next — high value, relatively self-contained:
- ~~#9 — Trainer Brain Sync: Wire up store. Clicking a brain in BrainsRoster or a gibbet in GibbetRoster should call setActiveTrainerId(brain.id). One line per click handler. High gameplay value, minimal risk.~~ _(Completed: Both rosters now set active trainer brain on click as required.)_
- ~~#11 — Brain/Body/Gibbet Constraints**: Design and partial implementation exist. Finish greying out body icons in BodiesRoster and remove any remaining brain reuse guards from combine.~~ _(Completed: BodiesRoster now greys out used bodies, disables drag for used bodies, but allows selection/info. Draggable icon is only enabled for unused bodies. Brain reuse guard removed from combineGibbet.)_
- **#3 — Weather Terrarium & Drag-Select**: Drag-select is a one-liner in DraggableItem (call select(type, id) from startDrag). Weather terrarium needs further investigation.
- **#10 — Icon Wiggle Feedback**: Add CSS animation to DraggableItem. Default: slow 3s gentle oscillation. Hover: faster, larger amplitude. Pure CSS.
- **#14 — Decrease width of combine panel**: Make the combine panel narrower for a more compact UI.
- **#15 — Control panel height fits content**: Don't have control panel take up full vertical length of screen; it should only extend up and down on y to the extent required for its components plus a little padding.

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

8. ~~Performance/Memory Leak Investigation~~ _(2026-03-01 05:47 UTC, completed 2026-03-01 19:30 UTC)_
   - ~~Investigate possible memory leaks or performance issues, as occasional animation stutters have been observed. May be due to heavy on-screen activity or lack of optimization.~~
   - _Fixed: Animation loop refactored to use refs, effect dependencies minimized, updateSimState dirty-checked. No stutter observed after fix. Ongoing monitoring for memory leaks recommended._

9. ~~Trainer Brain Sync~~ _(2026-03-01 05:47 UTC, completed 2026-03-01 19:40 UTC)_
   - ~~Selecting a brain or gibbet should update the trainer to have that brain (or the brain attached to a gibbet) as the active brain in training.~~
   - _Fixed: Both BrainsRoster and GibbetRoster now set active trainer brain on click as required._

10. ~~Icon Wiggle Feedback~~ _(2026-03-01 05:47 UTC, completed 2026-03-03 00:18 UTC)_
   - ~~Brain, body, and gibbet icons should wiggle slightly by default, and wiggle more when hovered, to encourage drag-and-drop interaction.~~
   - _Completed: Implemented separate CSS wiggle classes for brain/body (higher amplitude) and gibbet (lower amplitude). Each icon now animates appropriately._

11. ~~Brain/Body/Gibbet Constraints~~ _(2026-03-01 05:47 UTC, completed 2026-03-01 19:50 UTC)_
   - ~~A brain can be used to make any number of gibbets, but a body can only be used once. Grey out the icon if a body is in use.~~
   - _Fixed: BodiesRoster now greys out used bodies, disables drag for used bodies, but allows selection/info. Draggable icon is only enabled for unused bodies. Brain reuse guard removed from combineGibbet._

12. **Left Panel Info Section** _(2026-03-01 05:47 UTC)_
   - Improve the left panel info section.

13. **Unify Roster Icon Display** _(2026-03-01 19:50 UTC)_
   - Roster icons have a slight separation: brain & body vs gibbet. The gibbet panel looks more like a button and can be clicked anywhere to drag. Update brain and body roster items to use the same button-like, draggable panel style for consistency.

14. **Decrease width of combine panel** _(2026-03-01 19:55 UTC)_
   - Make the combine panel narrower for a more compact UI.

15. **Control panel height fits content** _(2026-03-01 19:55 UTC)_
   - Don't have control panel take up full vertical length of screen; it should only extend up and down on y to the extent required for its components plus a little padding.

---

*Add new issues below as needed. Mark completed items with ~~strikethrough~~ and move them to a "Done" section if desired.*


new unpolished issues:


   user clickable resources to give them something to click, cus they gunna wanna click. (but its v slow to mine via this method, is really just to pacify the user like jangling keys in front of a baby. The real resource collection should be conducted by gibbits.)

   --

   in gibbit life bio - put lifetime total resource collection by that gibbit.

   And also construct some sort of simple bio.

   age - game time alive

   --


   If you are in the trainer tab and pick up a gibbit from the gibbit roster, the button to navigate to the terrarium should light up/glow to indicate to the user that that's where you go to deal with picking up gibbits. (potentially also, while in the trainer tab, if the user drags the gibbit to the terrarium button the button should press on hover. So that it's like the user has been invited to press on the button (via the glow ) while holding a gibbit, in which case they might try to drag the gibbit to the terrarium. so just take them straght to the terraium when that happens.)


   -- Swap the ordering of the upgrades and grow gibbets navigation buttons in the right panel, and make grow gibbits the default path. Clearer user journey to start on the trainer page - with a mind selected and visible on the mind roster in the grow gibbits panel. (and potentially all the other aspects of the grow gibbits panel greyed out and them unlocked once the mind is first trained)

