# Codebase Structure and Key Functions

_Last updated: 2026-02-27_

This document provides a concise mapping of the main files and their key functions/components, to help understand the codebase structure and imports during refactoring. All filepaths are relative to `/src/`.

---

## Upcoming: Brain Types & Body Types (Sprint 2026-03-03)

- /src/data/brainTypes.js: BRAIN_TYPES array, type definitions, icons, unlock logic for brains (weather-aware, etc).
- /src/data/bodyTypes.js: BODY_TYPES array, type definitions, icons, unlock logic for bodies (resource multipliers, etc).
- /src/store/worldStore.jsx: Will be updated to support brain/body types, unlocks, and correct creation logic.
- /src/components/roster/BrainsRoster.jsx: Will display brain types, unlocks, icons, and badges.
- /src/components/roster/BodiesRoster.jsx: Will display body types, unlocks, icons, and compact multiplier bar.
- /src/components/panels/RightPanel.jsx: Will integrate new type displays and combine logic.
- /src/engine/terrariumEngine.js: Will integrate weather state and resource multiplier logic.

---

## panels/
- /src/components/panels/App.jsx: CombinePanel, main app logic, imports NetworkViz, TrainingButtons, Terrarium, DropZone, DragLayer, BrainsRoster, BodiesRoster, GibbetRoster, RosterSection, AccuracyRing, Gibbet.
- /src/components/panels/LeftPanel.jsx: LeftPanel (main export), imports GibbetBioPanel (from App.jsx), NetworkViz, useWorld.
- /src/components/panels/CenterPanel.jsx: CenterPanel (main export), imports useWorld.
- /src/components/panels/RightPanel.jsx: RightPanel (main export), imports BrainsRoster, BodiesRoster, GibbetRoster, useWorld.

## shared/
- /src/components/shared/NetworkViz.jsx: NetworkViz (main export), visualizes neural network, imports COLORS, NETWORK_LAYERS, useWorld.
- /src/components/shared/TrainingButtons.jsx: TrainingButtons (main export), renders color buttons, imports COLORS, useWorld.

## roster/
- /src/components/roster/AccuracyRing.jsx: AccuracyRing (main export), SVG ring for accuracy, imports Gibbet, useWorld, R, COLORS.
- /src/components/roster/BodiesRoster.jsx: BodiesRoster (main export), imports useWorld, RosterSection, RosterItem, StatusPip, ActionButton, R, Gibbet, DraggableItem, COLORS.
- /src/components/roster/BrainsRoster.jsx: BrainsRoster (main export), imports useWorld, RosterSection, RosterItem, StatusPip, ActionButton, R, NETWORK_CONFIG_T1, COLORS, AccuracyRing, DraggableItem, Gibbet.
- /src/components/roster/GibbetRoster.jsx: GibbetRoster (main export), imports useWorld, RosterSection, RosterItem, ActionButton, R, Gibbet, DraggableItem, COLORS.
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
