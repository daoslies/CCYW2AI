// src/networkConfig.js
// Single source of truth for network architecture (layer sizes)
// Update this array to change the network shape everywhere (nn.js, NetworkViz.jsx, etc)

export const NETWORK_LAYERS = [3, 8, 4, 3]; // legacy export, T1

export const NETWORK_CONFIG_T1 = {
  layers: [3, 8, 4, 3],
  inputSize: 3,
  hasWeather: false,
};

export const NETWORK_CONFIG_T2 = {
  layers: [4, 10, 6, 3],
  inputSize: 4,
  hasWeather: true,
  weatherInvertThreshold: 0.6,
};
