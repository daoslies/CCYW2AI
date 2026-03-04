# Codebase Structure and Key Functions

_Last updated: 2026-03-03 03:30 UTC_

This document provides a concise mapping of the main files and their key functions/components, to help understand the codebase structure and imports during refactoring. All filepaths are relative to `/src/`.

---

## Brain Types & Body Types (Sprint 2026-03-03)

- /src/data/brainTypes.js: BRAIN_TYPES array, type definitions, icons, unlock logic for brains (weather-aware, etc).
- /src/data/bodyTypes.js: BODY_TYPES array, type definitions, icons, unlock logic for bodies (resource multipliers, etc).
- /src/store/worldStore.jsx: Supports brain/body types, unlocks, and correct creation logic.
- /src/components/roster/BrainsRoster.jsx: Displays brain types, unlocks, icons, badges, and type selection panel (uses shared SlidePanel). Now supports an injectPanel prop. On resource or unlock state change, injects its panel into App.jsx, which passes it to RightPanel for rendering. No longer rendered directly in App.jsx or RightPanel.jsx.
- /src/components/roster/BodiesRoster.jsx: Displays body types, unlocks, icons, compact multiplier bar, and type selection panel (uses shared SlidePanel). Now supports an injectPanel prop. On resource or unlock state change, injects its panel into App.jsx, which passes it to RightPanel for rendering. No longer rendered directly in App.jsx or RightPanel.jsx.
- /src/components/panels/RightPanel.jsx: Integrates new type displays and combine logic. Receives brainsBuyMenuPanel and bodiesBuyMenuPanel as props from App.jsx and renders them in the "gibbets" tab, along with GibbetRoster. No longer instantiates BrainsRoster or BodiesRoster directly. All right sidebar content is now injected from App.jsx.
- /src/components/shared/SlidePanel.jsx: Shared sliding panel shell for right-side panels (combine, brain type, body type). Handles zoom-compensated height, margin auto centering, and correct scroll.
- /src/components/roster/BrainTypeCard.jsx: Visual card for brain type selection panel, uses MiniNetworkDiagram, CornerTick.
- /src/components/roster/BodyTypeCard.jsx: Visual card for body type selection panel, uses MultiplierDisplay, CornerTick.
- /src/components/roster/MiniNetworkDiagram.jsx: Miniature neural network diagram for brain type cards.
- /src/components/roster/MultiplierDisplay.jsx: Renders large multiplier bars for body type cards.

---

## panels/
- /src/components/panels/App.jsx: Main app logic. Now injects brainsBuyMenuPanel and bodiesBuyMenuPanel (from BrainsRoster/BodiesRoster) and passes them as props to RightPanel. No longer renders BrainsRoster or BodiesRoster directly; all right sidebar content is managed by RightPanel. Handles resource deduction and unlock state via canonical engine state and injected panel pattern.
- /src/components/panels/LeftPanel.jsx: LeftPanel (main export), imports NetworkViz, useWorld, and renders resource counters and network visualization at full width.
- /src/components/panels/CenterPanel.jsx: CenterPanel (main export), imports useWorld.
- /src/components/panels/RightPanel.jsx: RightPanel (main export), receives brainsBuyMenuPanel and bodiesBuyMenuPanel as props from App.jsx and renders them in the "gibbets" tab, along with GibbetRoster. No longer instantiates BrainsRoster or BodiesRoster directly. All right sidebar content is now injected from App.jsx.

## shared/
- /src/components/shared/NetworkViz.jsx: NetworkViz (main export), visualizes neural network, imports COLORS, NETWORK_LAYERS, useWorld.
- /src/components/shared/TrainingButtons.jsx: TrainingButtons (main export), renders color buttons, imports COLORS, useWorld.
- /src/components/shared/SlidePanel.jsx: SlidePanel (main export), shared sliding panel shell for right-side panels. Now handles zoom-compensated height and margin auto centering for correct scroll and visual polish (2026-03-03).
- /src/components/shared/CornerTick.jsx: CornerTick (main export), used for visual accent on cards.

## roster/
- /src/components/roster/AccuracyRing.jsx: AccuracyRing (main export), SVG ring for accuracy, imports Gibbet, useWorld, R, COLORS.
- /src/components/roster/BodiesRoster.jsx: BodiesRoster (main export), imports useWorld, RosterSection, RosterItem, StatusPip, ActionButton, R, Gibbet, DraggableItem, COLORS. Uses shared SlidePanel for buy/type selection panel. Now supports an injectPanel prop. On resource or unlock state change, injects its panel into App.jsx, which passes it to RightPanel for rendering. No longer rendered directly in App.jsx or RightPanel.jsx.
- /src/components/roster/BodyTypeCard.jsx: BodyTypeCard (main export), visual card for body type selection panel, uses MultiplierDisplay, CornerTick.
- /src/components/roster/BrainsRoster.jsx: BrainsRoster (main export), imports useWorld, RosterSection, RosterItem, StatusPip, ActionButton, R, NETWORK_CONFIG_T1, COLORS, AccuracyRing, DraggableItem, Gibbet. Uses shared SlidePanel for buy/type selection panel. Now supports an injectPanel prop. On resource or unlock state change, injects its panel into App.jsx, which passes it to RightPanel for rendering. No longer rendered directly in App.jsx or RightPanel.jsx.
- /src/components/roster/BrainTypeCard.jsx: BrainTypeCard (main export), visual card for brain type selection panel, uses MiniNetworkDiagram, CornerTick.
- /src/components/roster/GibbetRoster.jsx: GibbetRoster (main export), imports useWorld, RosterSection, RosterItem, ActionButton, R, Gibbet, DraggableItem, COLORS.
- /src/components/roster/MiniNetworkDiagram.jsx: MiniNetworkDiagram (main export), renders a miniature neural network diagram for brain type cards.
- /src/components/roster/MultiplierDisplay.jsx: MultiplierDisplay (main export), renders large multiplier bars for body type cards.
- /src/components/roster/RosterSection.jsx: RosterSection (main export), layout for roster sections, imports R, COLORS.

## dragdrop/
- /src/components/dragdrop/DraggableItem.jsx: DraggableItem (main export), imports useDrag.
- /src/components/dragdrop/DragLayer.jsx: DragLayer (main export), imports useDrag, Gibbet, createPortal.
- /src/components/dragdrop/DropZone.jsx: DropZone (main export), imports useDrag.

## gibbet/
- /src/components/gibbet/Gibbet.jsx: Gibbet (main export), SVG visual for gibbet creature, imports COLORS.
- /src/components/gibbet/GibbetVisual.jsx: GibbetVisual (main export), abstraction for gibbet icon, future-proof for asset swap.

## terrarium/
- /src/components/terrarium/Resource.jsx: Resource (main export), SVG for resource, imports COLORS, useWorld.
- /src/components/terrarium/Sparkle.jsx: Sparkle (main export), SVG for sparkle, imports useWorld.
- /src/components/terrarium/Terrarium.jsx: Terrarium (main export), main game logic, imports COLORS, makeNetwork, nnTrainStep, NetworkViz, UPGRADES, engine/terrariumEngine, NETWORK_CONFIG_T1, TerrariumScene, Resource, TrainingButtons, useWorld, Gibbet, DropZone.
- /src/components/terrarium/Terrarium2.jsx: Terrarium2 (main export), 3D terrarium, imports useWorld, @react-three/fiber, @react-three/cannon, @react-three/drei, leva, Ground, Player, Trees, Rocks, Water, COLORS.
- /src/components/terrarium/TerrariumScene.jsx: TerrariumScene (main export), visualizes terrarium, imports COLORS, engine/terrariumEngine, useWorld, Gibbet, Resource, Sparkle.

## Terrarium resource sparklines (March 4, 2026)
- Resource rate and count sparklines use global normalization for direct comparison between colors.
- Count/second trace is a rolling time series, not a flat line.
- Crits and all resource flow are included in rate calculations.
- Defensive filtering for legacy data in collectionHistory.
- Note: allHistories and allBuckets are computed for global normalization, then recomputed per-color in COLORS.map. This is functionally redundant and could be cleaned up in a future refactor.

## data/
- /src/data/colors.js: COLORS array, decodeOutput function.
- /src/data/gibbet_breeds.js: GIBBET_BREEDS array.
- /src/data/networkConfig.js: NETWORK_LAYERS, NETWORK_CONFIG_T1, NETWORK_CONFIG_T2.
- /src/data/quotes.js: QUOTES array.
- /src/data/upgrades.js: UPGRADES array.

## engine/
- /src/engine/categorical-nn.js: dot, dense, relu, sigmoid, compose, train, forward.
- /src/engine/nn.js: dot, matvec, vadd, zeroVec, xavierMatrix, reluFn, reluPrime, sigmoidFn, sigmoidPrime, softmaxFn, softmax, makeNetwork, nnForward, nnTrainStep.
- /src/engine/terrariumEngine.js: TW, TH, GROUND_Y, GRASS, PEBBLES, DUST, ZONES, CZONE, game logic.

## store/
- /src/store/dragStore.jsx: DragProvider, useDrag.
- /src/store/gibbetStore.js: createGibbet, GibbetProvider, useGibbet.
- /src/store/gibbetStore.jsx: createBrain, createGibbet, GibbetProvider, useGibbet.
- /src/store/worldStore.jsx: randomBodyColor, createBrain, WorldProvider, useWorld.

---
This mapping should help track down import issues and clarify which files provide which symbols and how many folders deep they are. Update as needed during refactoring.

**2026-03-03 03:14 UTC:**
- Visual polish and scroll/zoom bugfix for buy/selection panels complete. All buy panels now use shared SlidePanel with zoom-compensated height and margin auto centering. No more clipping at top or bottom at any UI scale. Code duplication removed.

**2026-03-03 03:30 UTC:**
- Buy menus for brains and bodies are now injected from App.jsx and rendered in RightPanel via props. BrainsRoster and BodiesRoster are no longer rendered directly in App or RightPanel. Unlock and resource deduction logic now follows the upgrades sidebar pattern for robust reactivity. This file now matches the actual codebase structure as of this commit.

### Note remember to update this file when adding, creating or modifying files and their components.