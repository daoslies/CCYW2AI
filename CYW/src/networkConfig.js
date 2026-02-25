// src/networkConfig.js
// Single source of truth for network architecture (layer sizes)
// Update this array to change the network shape everywhere (nn.js, NetworkViz.jsx, etc)

export const NETWORK_LAYERS = [3, 8, 4, 3]; // [input(one-hot), hidden1, hidden2, output(one-hot)]
