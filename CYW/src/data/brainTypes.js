import { NETWORK_CONFIG_T1, NETWORK_CONFIG_T2 } from "./networkConfig.js";

export const BRAIN_TYPES = {
  standard: {
    id: "standard",
    label: "Standard",
    description: "3-input network. Responds to colour signals.",
    config: NETWORK_CONFIG_T1,    // existing, 3 inputs
    inputLabels: ["red", "green", "blue"],
    weatherAware: false,
    unlocked: true,               // available from the start
    icon: "standard",            // references visual variant
    accentColor: "#7dd3fc",
  },
  weather: {
    id: "weather",
    label: "Weather",
    description: "4-input network. Inverts behaviour when weather exceeds threshold.",
    config: NETWORK_CONFIG_T2,    // existing, 4 inputs
    inputLabels: ["red", "green", "blue", "weather"],
    weatherAware: true,
    unlocked: false,              // requires unlock
    icon: "weather",
    accentColor: "#38bdf8",
  },
};
