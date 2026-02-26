// upgrades.js
// Central upgrade definitions for the terrarium/idle game
import { COLORS } from "./colors";

export const UPGRADES = [
  {
    id: "speedBoost",
    label: "Gibbet Speed",
    description: "Increases gibbet walking speed by 20% per level.",
    cost: (level) => ({ red: 0, green: 0, blue: 3 * (level + 1) }), // Lowered cost
    maxLevel: 5,
    apply: (gs, level) => {
      gs._speedBonus = (gs._speedBonus || 0) + 0.2 * level;
    }
  },
    {
    id: "resourceField",
    label: "Resource Field",
    description: "Increase the number of resources on screen by 1 for each color per level.",
    cost: (level) => ({ red: 0, green: 3 * (level + 1), blue: 0}),
    maxLevel: 5,
    apply: (gs, level) => {
      gs._resourceFieldBonus = level;
    }
  },
  {
    id: "critBonus",
    label: "Critical Gathering",
    description: "Gain a random chance to get +50% extra resource when gathering. Chance increases by 10% per level.",
    cost: (level) => ({ red: 3 * (level + 1), green: 0, blue: 0 }),
    maxLevel: 5,
    apply: (gs, level) => {
      gs._critBonus = level * 10;
    }
  },
  {
    id: "speedAndRespawn",
    label: "Speed & Respawn",
    description: "Increases speed by 10% and resources respawn 15% faster per level.",
    cost: (level) => ({ red: 12 * (level + 1), green: 16 * (level + 1), blue: 8 * (level + 1) }), // Lowered cost
    maxLevel: 3,
    apply: (gs, level) => {
      gs._speedBonus = (gs._speedBonus || 0) + 0.1 * level;
      gs._respawnBonus = (gs._respawnBonus || 0) + 0.15 * level;
    }
  },
  {
    id: "redGather",
    label: "Red Gathering",
    description: "Gain +1 extra red resource per red collected.",
    cost: (level) => ({ red: 12 * (level + 1), green: 4 * (level + 1), blue: 0 }),
    maxLevel: 5,
    apply: (gs, level) => {
      gs._redGatherBonus = level;
    }
  },
  {
    id: "greenGather",
    label: "Green Gathering",
    description: "Gain +1 extra green resource per green collected.",
    cost: (level) => ({ red: 0, green: 12 * (level + 1), blue: 4 * (level + 1) }),
    maxLevel: 5,
    apply: (gs, level) => {
      gs._greenGatherBonus = level;
    }
  },
  {
    id: "blueGather",
    label: "Blue Gathering",
    description: "Gain +1 extra blue resource per blue collected.",
    cost: (level) => ({ red: 4 * (level + 1), green: 0, blue: 12 * (level + 1) }),
    maxLevel: 5,
    apply: (gs, level) => {
      gs._blueGatherBonus = level;
    }
  },
  {
    id: "secondTerrarium",
    label: "Unlock Weather Terrarium",
    description: "Unlocks a second terrarium with weather and new neural network mechanics.",
    cost: (level) => ({ red: 0, green: 0, blue: 0 }),
    maxLevel: 1,
    apply: (gs, level) => {
      // Unlock logic handled in App.jsx; this is a marker upgrade.
    }
  },
];
