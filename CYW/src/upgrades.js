// upgrades.js
// Central upgrade definitions for the terrarium/idle game
import { COLORS } from "./colors";

export const UPGRADES = [
  {
    id: "speedBoost",
    label: "Gibbet Speed",
    description: "Increases creature walking speed by 20% per level.",
    cost: (level) => ({ red: 5 * (level + 1), green: 0, blue: 0 }), // Cost scales with level
    maxLevel: 5,
    apply: (gs, level) => {
      gs._speedBonus = (gs._speedBonus || 0) + 0.2 * level;
    }
  },
  {
    id: "speedAndRespawn",
    label: "Speed & Respawn",
    description: "Increases speed by 10% and resources respawn 15% faster per level.",
    cost: (level) => ({ red: 30 * (level + 1), green: 40 * (level + 1), blue: 20 * (level + 1) }), // Cost scales with level
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
  // Add more upgrades as desired
];
