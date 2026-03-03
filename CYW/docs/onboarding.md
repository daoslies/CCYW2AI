Welcome to the team.

## New for 2026: Brain Types & Body Types

The game now features multiple Brain Types and Body Types, each with unique gameplay effects and unlock conditions:

- **Brain Types**: Brains can now have special types (e.g., weather-aware brains) that change how they process input and interact with the terrarium environment. Some types are unlockable via upgrades. Brain type affects the input vector and can provide special abilities.
- **Body Types**: Bodies now come in different types, each with their own resource collection multipliers and visual accents. Some body types are unlockable. The body type determines how efficiently a gibbet collects different resources.

These features are fully data-driven and extensible. See `/src/data/brainTypes.js` and `/src/data/bodyTypes.js` for type definitions, unlock logic, and icons. The store (`worldStore.jsx`) and engine (`terrariumEngine.js`) have been updated to support these new mechanics. The UI (BrainsRoster, BodiesRoster, CombinePanel) now displays type icons, unlocks, and compatibility info.

For architectural details, see the top of `task_board.md` and `codebase_structure.md`.

---

What we're building
This is a terrarium idle game with a neural network training mechanic at its core. The central conceit is that you're training AI creatures — called gibbets — by teaching their brains to recognise colour signals. A well-trained gibbet will correctly collect resources from its terrarium; a poorly trained one will blunder around collecting the wrong things and get poisoned.
It's an idle game in the sense that once trained, gibbets work autonomously. But the training itself is an active, hands-on loop that sits at the heart of the experience.

The world model
There are three entities that the player works with:
Brains are neural networks. They live in the trainer, get trained by the player pressing coloured buttons in response to colour prompts, and accumulate a loss history that shows how well they're learning. A brain exists independently — it's not tied to a body or a terrarium until the player decides.
Bodies are physical templates. They determine what the gibbet looks like and will eventually affect movement characteristics. Right now there's essentially one breed (Classic), but the architecture supports more.
Gibbets are the combination of exactly one brain and one body. The player explicitly combines them. A gibbet can then be assigned to a terrarium slot where it operates autonomously, using its brain to decide which resources to collect.
This separation matters. You train the brain first, then house it. A brain committed to a gibbet can't be retrained until the gibbet is dissolved back into its parts.

The neural network
The network itself lives in src/engine/nn.js. It's a from-scratch implementation — no ML libraries. The architecture is a simple feedforward net with ReLU hidden layers and a softmax output, trained with backprop and cross-entropy loss.
The input is a one-hot vector representing the current colour indicator (red, green, or blue). The output is a probability distribution over those same three colours. The gibbet moves toward whichever colour the network predicts with highest confidence.
Training is supervised: the player sees a colour prompt and presses a button indicating what the gibbet should collect. That button press becomes the training target. After enough presses, the network learns to map each colour input to the correct collection behaviour.
The key file relationships here are nn.js (the math), networkConfig.js (layer shapes), and NetworkViz.jsx (the live visualisation you see in the left sidebar).

The terrarium engine
src/engine/terrariumEngine.js is the pure game logic — no React, no rendering. It manages:

Resources scattered across the terrarium in three colour zones
The indicator which rotates every few seconds telling the gibbet what to collect
Gibbet movement — pathfinding, sniffing pauses, harvest duration, poison on wrong collection
Weather (in the second terrarium) which above a threshold inverts the collection rules
Sparkles, collection history, upgrade effects

The engine runs on requestAnimationFrame via a tick loop in Terrarium.jsx. Each tick calls gameTick(gs, gibbetEntries, UPGRADES, config) and then snapshot(gs) which produces a plain object that React can render from. The game state gs is kept in a useRef — it's mutable and fast, not React state.

The store
src/store/worldStore.jsx is the global React context that owns everything the player has accumulated: their brains array, bodies array, gibbets array, slot assignments, and which brain is active in the trainer.
The critical architectural detail: networks never go into React state. They're mutable objects trained in place. They live in a Map inside a useRef (networkMapRef), keyed by brain ID. getNetwork(brainId) retrieves the live network for any brain. Everything else about a brain (name, trainCount, lossHistory) is in React state and can drive re-renders normally.

The drag and drop system
src/store/dragStore.jsx and the DraggableItem, DropZone, DragLayer components handle physical-feeling drag interactions. It uses pointer events rather than the HTML5 drag API — this gives us full control over the drag preview so it looks like you're picking up the actual item rather than a ghost copy.
One important quirk: the app uses html { zoom: 1.4 } in index.css for display scaling. Pointer event coordinates don't scale with CSS zoom, so all coordinates in the drag system are divided by UI_ZOOM = 1.4 before use. If you ever touch the drag system and things feel offset, that's the first thing to check.

The UI structure
The layout is three fixed columns:

Left sidebar — NetworkViz showing the active brain's weights and activations, plus resource counters when in terrarium view
Centre panel — tab-switched between the Trainer (manual brain training) and the Terrarium view (watching gibbets work)
Right sidebar — tab-switched between Upgrades and the Grow Gibbets panel (brains roster, bodies roster, gibbet roster, combine panel)

The right sidebar's Grow Gibbets tab is where most of the brain/body/gibbet management happens. The design system for those panels lives conceptually in rosterTokens.js — consistent colours, spacing, and component primitives (RosterSection, RosterItem, ActionButton, StatusPip) that keep all three rosters visually unified.

The narrative layer
The world has a lore context that surfaces through rotating quotes in the terrarium view. Gibbets are creatures whose skin is attuned to radio waves, which they perceive as colour. The "psionic training" the player performs in the trainer directly shapes the structure of the gibbet's brain. Dr Firestone designed the gibbet's eyes to illuminate raw essences. The Meridian Institute published the field handbook.
This isn't decoration — it's the interpretive frame that makes the mechanics feel meaningful rather than abstract. When you're writing UI copy, error states, or empty states, lean into this voice. "No gibbets assigned" is fine functionally but "no gibbet inhabits this terrarium" fits the world better.

Good places to start
Read terrariumEngine.js top to bottom — it's well-commented and contains the core game logic in one place. Then read worldStore.jsx to understand how entities are created and related. Then open the app and train a brain from scratch, combine it with a body, assign it to a terrarium, and watch it work. The mechanic is clearest when you experience it directly.
Any questions, the courier knows where to find us.