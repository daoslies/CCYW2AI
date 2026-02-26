# Terrarium Idle Game (AI Cookie Clicker)

## Overview
This project is a modular, extensible idle game built in React + Vite, themed around AI-driven terrariums. Players manage multiple terrarium variants, each powered by its own neural network, with unique mechanics and UI. The game features resource gathering, upgrades, and dynamic gameplay elements.

## Features
- **Multiple Terrarium Variants:** Each with independent neural networks, mechanics, and UI. Weather-enabled variants are supported.
- **Modular Game Engine:** Pure, parameterized logic extracted to `terrariumEngine.js` for maintainability and extensibility.
- **Flexible Upgrades System:** Resource-based, scaling costs; new upgrades for resource field size and critical gathering.
- **Organic Resource Placement:** Resources are interspersed and distributed organically, with multiplayer-aware claiming and harvesting.
- **Visual Feedback:** Resonance effects for correct resource collection, negative feedback for incorrect collection, and polished resource icons.
- **Resource Rate Indicator:** "Resources per second" ticker in the left panel, using main resource pile icons.
- **UI/UX Polish:** Pill-style training buttons, centered panels, consistent backgrounds, improved animations.
- **Network Visualization:** Per-terrarium architectures visualized in `NetworkViz.jsx`.
- **Gibbet Mechanics:** Creatures (now "gibbets") interact with resources in multiplayer-aware ways.
- **Upgrade Unlocks:** Unlock and interact with a second, weather-enabled terrarium.
- **Early Game Balance:** Lowered upgrade costs for better pacing; dynamic resource count growth.

## Code Structure
- `App.jsx`: Manages state for both terrariums, training panels, and unlock logic.
- `Terrarium.jsx`, `Terrarium2.jsx`: Main panels for each terrarium variant.
- `terrariumEngine.js`: Pure game logic engine, parameterized for variants.
- `upgrades.js`: Upgrade definitions and logic.
- `networkConfig.js`, `nn.js`, `colors.js`: Neural network and color logic.
- `Gibbet.jsx`, `Resource.jsx`, `Sparkle.jsx`, `TerrariumScene.jsx`: Shared rendering primitives.
- `NetworkViz.jsx`: Neural network visualization.
- `TrainingButtons.jsx`: Unified training panel buttons.
- `index.css`, `App.css`: Global and app-specific styles.

## Gameplay
- Collect resources by guiding gibbets to the correct resource, indicated visually.
- Upgrades unlock new mechanics, increase resource field size, and enable critical gathering.
- Weather mechanics invert resource collection logic in the second terrarium.
- Multiplayer-aware mechanics allow multiple gibbets to claim and harvest resources.

## Pending/Optional
- Further polish or gameplay changes as requested by gameplay or design teams.
- Additional balancing or new upgrade ideas.

## Getting Started
1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Open in browser: [http://localhost:5173](http://localhost:5173)

## License
MIT
