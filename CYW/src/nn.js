// src/nn.js
// Neural network primitives and architecture for the color predictor app

// 1. Math primitives
export function dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
export function matvec(W, x) { return W.map(row => dot(row, x)); }
export function vadd(a, b) { return a.map((v, i) => v + b[i]); }
export function zeroVec(n) { return new Array(n).fill(0); }

// 2. Weight initialisation
export function xavierMatrix(rows, cols) {
  const limit = Math.sqrt(6 / (rows + cols));
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() * 2 - 1) * limit)
  );
}

// 3. Activation functions
export const reluFn    = x => Math.max(0, x);
export const reluPrime = x => (x > 0 ? 1 : 0);
export const sigmoidFn    = x => 1 / (1 + Math.exp(-x));
export const sigmoidPrime = x => { const s = sigmoidFn(x); return s * (1 - s); };
// ML team: Softmax activation for multiclass output. Numerically stable.
export function softmaxFn(vec) {
  const max = Math.max(...vec);
  const exps = vec.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

export function softmax() {
  return {
    type: "softmax", params: null,
    forward(x) { return { output: softmaxFn(x), cache: { x } }; },
    // ML team: Gradient of softmax+cross-entropy simplifies to (p - y)
    backward(dOut, cache) { return { dInput: dOut, dParams: null }; },
    applyGrads() {},
  };
}

// 4. Layer constructors
export function dense(inSize, outSize) {
  const params = { W: xavierMatrix(outSize, inSize), b: zeroVec(outSize) };
  return {
    type: "dense", params,
    forward(x) { return { output: vadd(matvec(params.W, x), params.b), cache: { x } }; },
    backward(dOut, cache) {
      const { x } = cache;
      const dW = params.W.map((_, i) => x.map(xj => dOut[i] * xj));
      const db = dOut.slice();
      const dInput = zeroVec(inSize);
      for (let i = 0; i < outSize; i++)
        for (let j = 0; j < inSize; j++)
          dInput[j] += params.W[i][j] * dOut[i];
      return { dInput, dParams: { dW, db } };
    },
    applyGrads(dParams, lr) {
      for (let i = 0; i < params.W.length; i++) {
        params.b[i] -= lr * dParams.db[i];
        for (let j = 0; j < params.W[i].length; j++)
          params.W[i][j] -= lr * dParams.dW[i][j];
      }
    },
  };
}

export function relu() {
  return {
    type: "relu", params: null,
    forward(x) { return { output: x.map(reluFn), cache: { x } }; },
    backward(dOut, cache) { return { dInput: dOut.map((d, i) => d * reluPrime(cache.x[i])), dParams: null }; },
    applyGrads() {},
  };
}

export function sigmoid() {
  return {
    type: "sigmoid", params: null,
    forward(x) { return { output: x.map(sigmoidFn), cache: { x } }; },
    backward(dOut, cache) { return { dInput: dOut.map((d, i) => d * sigmoidPrime(cache.x[i])), dParams: null }; },
    applyGrads() {},
  };
}

// 5. Categorical composition (compose)
export function compose(...layers) {
  return {
    layers,
    forward(x) {
      let current = x;
      const caches = [];
      for (const layer of layers) {
        const { output, cache } = layer.forward(current);
        caches.push(cache);
        current = output;
      }
      return { output: current, caches };
    },
    backward(dOut, caches, lr) {
      let dCurrent = dOut;
      for (let i = layers.length - 1; i >= 0; i--) {
        const { dInput, dParams } = layers[i].backward(dCurrent, caches[i]);
        if (dParams) layers[i].applyGrads(dParams, lr);
        dCurrent = dInput;
      }
    },
  };
}

// 6. The single training step
// ML team: Use cross-entropy loss for multiclass classification.
export function nnTrainStep(network, input, target, lr = 0.5) {
  const { output, caches } = network.forward(input);
  // output: [p0, p1, p2], target: [y0, y1, y2] (one-hot)
  // Cross-entropy loss: -sum(y_i * log(p_i))
  const eps = 1e-8;
  const loss = -target.reduce((s, y, i) => s + y * Math.log(output[i] + eps), 0);
  // Gradient: (p - y) for softmax+cross-entropy
  const dOut = output.map((p, i) => p - target[i]);
  network.backward(dOut, caches, lr);
  return loss;
}

// Helper: run a forward pass through the network
export function nnForward(network, input) {
  return network.forward(input).output;
}

// Import network architecture config
import { NETWORK_LAYERS } from "./networkConfig";

// 7. Network architecture
// ML team: Output layer is now 3 neurons (for 3 classes), followed by softmax.
// Uses NETWORK_LAYERS from networkConfig.js for architecture.
export function makeNetwork() {
  const [input, h1, h2, output] = NETWORK_LAYERS;
  return compose(
    dense(input, h1), relu(),
    dense(h1, h2), relu(),
    dense(h2, output), softmax()
  );
}
