// upgrades.js
// Central upgrade definitions for the terrarium/idle game

export const UPGRADES = [
  {
    id: "speedBoost",
    label: "Faster Creature",
    description: "Increases creature walking speed by 20% per level.",
    cost: 50,
    maxLevel: 5,
    apply: (gs, level) => {
      gs._speedBonus = (gs._speedBonus || 0) + 0.2 * level;
    }
  },
  {
    id: "speedAndRespawn",
    label: "Speed & Respawn",
    description: "Increases speed by 10% and resources respawn 15% faster per level.",
    cost: 120,
    maxLevel: 3,
    apply: (gs, level) => {
      gs._speedBonus = (gs._speedBonus || 0) + 0.1 * level;
      gs._respawnBonus = (gs._respawnBonus || 0) + 0.15 * level;
    }
  },
  // Add more upgrades as desired
];
