# Codebase Structure and Key Functions

_Last updated: 2026-02-27_

This document provides a rough mapping of the main files and their key functions/components, to help understand the codebase structure and imports during refactoring.

## panels/ (2 folders deep)
- **App.jsx**: CombinePanel, main app logic, imports NetworkViz, TrainingButtons, Terrarium, DropZone, DragLayer, BrainsRoster, BodiesRoster, GibbetRoster, RosterSection, AccuracyRing, Gibbet.
- **LeftPanel.jsx**: LeftPanel (main export), imports GibbetBioPanel (from App.jsx), NetworkViz, useWorld.
- **CenterPanel.jsx**: CenterPanel (main export), imports useWorld.
- **RightPanel.jsx**: RightPanel (main export), imports BrainsRoster, BodiesRoster, GibbetRoster, useWorld.

## shared/ (2 folders deep)
- **NetworkViz.jsx**: NetworkViz (main export), visualizes neural network, imports COLORS, NETWORK_LAYERS, useWorld.
- **TrainingButtons.jsx**: TrainingButtons (main export), renders color buttons, imports COLORS, useWorld.

## roster/ (2 folders deep)
- **AccuracyRing.jsx**: AccuracyRing (main export), SVG ring for accuracy, imports Gibbet, useWorld, R, COLORS.
- **BodiesRoster.jsx**: BodiesRoster (main export), imports useWorld, RosterSection, RosterItem, StatusPip, ActionButton, R, Gibbet, DraggableItem, COLORS.
- **BrainsRoster.jsx**: BrainsRoster (main export), imports useWorld, RosterSection, RosterItem, StatusPip, ActionButton, R, NETWORK_CONFIG_T1, COLORS, AccuracyRing, DraggableItem, Gibbet.
- **GibbetRoster.jsx**: GibbetRoster (main export), imports useWorld, RosterSection, RosterItem, ActionButton, R, Gibbet, DraggableItem, COLORS.
- **RosterSection.jsx**: RosterSection (main export), layout for roster sections, imports R, COLORS.

## dragdrop/ (2 folders deep)
- **DraggableItem.jsx**: DraggableItem (main export), imports useDrag.
- **DragLayer.jsx**: DragLayer (main export), imports useDrag, Gibbet, createPortal.
- **DropZone.jsx**: DropZone (main export), imports useDrag.

## gibbet/ (2 folders deep)
- **Gibbet.jsx**: Gibbet (main export), SVG visual for gibbet creature, imports COLORS.

## terrarium/ (2 folders deep)
- **Resource.jsx**: Resource (main export), SVG for resource, imports COLORS, useWorld.
- **Sparkle.jsx**: Sparkle (main export), SVG for sparkle, imports useWorld.
- **Terrarium.jsx**: Terrarium (main export), main game logic, imports COLORS, makeNetwork, nnTrainStep, NetworkViz, UPGRADES, engine/terrariumEngine, NETWORK_CONFIG_T1, TerrariumScene, Resource, TrainingButtons, useWorld, Gibbet, DropZone.
- **Terrarium2.jsx**: Terrarium2 (main export), 3D terrarium, imports useWorld, @react-three/fiber, @react-three/cannon, @react-three/drei, leva, Ground, Player, Trees, Rocks, Water, COLORS.
- **TerrariumScene.jsx**: TerrariumScene (main export), visualizes terrarium, imports COLORS, engine/terrariumEngine, useWorld, Gibbet, Resource, Sparkle.

## data/ (1 folder deep)
- **colors.js**: COLORS array, decodeOutput function.
- **gibbet_breeds.js**: GIBBET_BREEDS array.
- **networkConfig.js**: NETWORK_LAYERS, NETWORK_CONFIG_T1, NETWORK_CONFIG_T2.
- **quotes.js**: QUOTES array.
- **upgrades.js**: UPGRADES array.

## engine/ (1 folder deep)
- **categorical-nn.js**: dot, dense, relu, sigmoid, compose, train, forward.
- **nn.js**: dot, matvec, vadd, zeroVec, xavierMatrix, reluFn, reluPrime, sigmoidFn, sigmoidPrime, softmaxFn, softmax, makeNetwork, nnForward, nnTrainStep.
- **terrariumEngine.js**: TW, TH, GROUND_Y, GRASS, PEBBLES, DUST, ZONES, CZONE, game logic.

## store/ (1 folder deep)
- **dragStore.jsx**: DragProvider, useDrag.
- **gibbetStore.js**: createGibbet, GibbetProvider, useGibbet.
- **gibbetStore.jsx**: createBrain, createGibbet, GibbetProvider, useGibbet.
- **worldStore.jsx**: randomBodyColor, createBrain, WorldProvider, useWorld.

---
This mapping should help track down import issues and clarify which files provide which symbols and how many folders deep they are. Update as needed during refactoring.
