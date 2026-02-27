/**
 * categorical-nn.js
 *
 * A minimal neural network library whose architecture mirrors the Haskell
 * "Categorical" repo (daoslies/Categorical).
 *
 * Core ideas from the repo:
 *   - Layers are morphisms between vector spaces
 *   - Networks are built by categorical composition  (>>>)
 *   - Training is a functorial transformation of parameters
 *
 * API mirrors the Haskell combinators:
 *   dense(inSize, outSize)   – a fully-connected layer (random init)
 *   relu()                   – ReLU activation morphism
 *   sigmoid()                – Sigmoid activation morphism
 *   compose(...layers)       – categorical composition  (>>>)
 *   train(network, data, opts)
 *   forward(network, input)
 */
// ...existing code from backend...
// (Full code pasted as provided)

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/** Dot product of two equal-length arrays. */
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Matrix-vector multiply.  W is rows×cols stored as Array<Array>. */
function matvec(W, x) {
  return W.map(row => dot(row, x));
}

/** Element-wise add. */
function vadd(a, b) {
  return a.map((v, i) => v + b[i]);
}

/** Scale a vector. */
function vscale(a, s) {
  return a.map(v => v * s);
}

/** Xavier / Glorot uniform initialisation. */
function xavierMatrix(rows, cols) {
  const limit = Math.sqrt(6 / (rows + cols));
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() * 2 - 1) * limit)
  );
}

function zeroVec(n) {
  return new Array(n).fill(0);
}

// ---------------------------------------------------------------------------
// Activation functions (morphisms with no learnable parameters)
// ---------------------------------------------------------------------------

const reluFn     = x => Math.max(0, x);
const reluPrime  = x => (x > 0 ? 1 : 0);
const sigmoidFn  = x => 1 / (1 + Math.exp(-x));
const sigmoidPrime = x => { const s = sigmoidFn(x); return s * (1 - s); };

// ---------------------------------------------------------------------------
// Layer constructors
// Each layer is a plain object (morphism) with:
//   type        – 'dense' | 'relu' | 'sigmoid'
//   forward(x)  – returns { output, cache }
//   backward(dOut, cache) – returns { dInput, dParams }
//   params      – { W, b }  (only for dense)
//   applyGrads(dParams, lr) – mutates params (only for dense)
// ---------------------------------------------------------------------------

/**
 * Dense (fully-connected) layer.
 * Morphism:  ℝⁿ → ℝᵐ
 *   y = W x + b
 */
function dense(inSize, outSize, W, b) {
  const params = {
    W: W || xavierMatrix(outSize, inSize),
    b: b || zeroVec(outSize),
  };

  return {
    type: 'dense',
    params,

    forward(x) {
      const preActivation = vadd(matvec(params.W, x), params.b);
      return { output: preActivation, cache: { x } };
    },

    backward(dOut, cache) {
      const { x } = cache;
      // dW[i][j] = dOut[i] * x[j]
      const dW = params.W.map((_, i) => x.map(xj => dOut[i] * xj));
      // db = dOut
      const db = dOut.slice();
      // dInput[j] = sum_i W[i][j] * dOut[i]
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

/**
 * ReLU activation morphism.
 * Morphism:  ℝⁿ → ℝⁿ  (element-wise)
 */
function relu() {
  return {
    type: 'relu',
    params: null,

    forward(x) {
      return { output: x.map(reluFn), cache: { x } };
    },

    backward(dOut, cache) {
      const dInput = dOut.map((d, i) => d * reluPrime(cache.x[i]));
      return { dInput, dParams: null };
    },

    applyGrads() {},
  };
}

/**
 * Sigmoid activation morphism.
 * Morphism:  ℝⁿ → ℝⁿ  (element-wise)
 */
function sigmoid() {
  return {
    type: 'sigmoid',
    params: null,

    forward(x) {
      return { output: x.map(sigmoidFn), cache: { x } };
    },

    backward(dOut, cache) {
      const dInput = dOut.map((d, i) => d * sigmoidPrime(cache.x[i]));
      return { dInput, dParams: null };
    },

    applyGrads() {},
  };
}

// ---------------------------------------------------------------------------
// Categorical composition  (>>>)
// Mirrors Haskell:  f >>> g  =  g . f
// ---------------------------------------------------------------------------

/**
 * Compose a sequence of morphisms into a single network.
 * Equivalent to Haskell's  l1 >>> l2 >>> l3 ...
 *
 * @param  {...object} layers
 * @returns {{ layers, forward, backward }}
 */
function compose(...layers) {
  return {
    layers,

    /** Run the full forward pass; store per-layer caches. */
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

    /** Backprop through all layers in reverse. */
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

// ---------------------------------------------------------------------------
// Loss:  Mean Squared Error  (binary cross-entropy also available)
// ---------------------------------------------------------------------------

function mseLoss(pred, target) {
  let loss = 0;
  const dOut = pred.map((p, i) => {
    const diff = p - target[i];
    loss += diff * diff;
    return 2 * diff / pred.length;
  });
  return { loss: loss / pred.length, dOut };
}

function bceLoss(pred, target) {
  const eps = 1e-7;
  let loss = 0;
  const dOut = pred.map((p, i) => {
    const pc = Math.max(eps, Math.min(1 - eps, p));
    loss += -(target[i] * Math.log(pc) + (1 - target[i]) * Math.log(1 - pc));
    return (pc - target[i]) / (pc * (1 - pc) * pred.length);
  });
  return { loss: loss / pred.length, dOut };
}

// ---------------------------------------------------------------------------
// Training loop
// ---------------------------------------------------------------------------

/**
 * Train a composed network.
 *
 * @param {object} network      – result of compose(...)
 * @param {Array}  data         – Array of { input: [...], target: [...] }
 * @param {object} opts
 *   @param {number} opts.epochs     default 5000
 *   @param {number} opts.lr         learning rate, default 0.1
 *   @param {string} opts.loss       'mse' | 'bce', default 'mse'
 *   @param {number} opts.logEvery   print loss every N epochs, default 500
 *   @param {function} opts.onEpoch  optional callback(epoch, loss)
 */
function train(network, data, opts = {}) {
  const {
    epochs   = 5000,
    lr       = 0.1,
    loss     = 'mse',
    logEvery = 500,
    onEpoch,
  } = opts;

  const lossFn = loss === 'bce' ? bceLoss : mseLoss;

  for (let epoch = 1; epoch <= epochs; epoch++) {
    let epochLoss = 0;

    // Shuffle data each epoch for better convergence
    const shuffled = data.slice().sort(() => Math.random() - 0.5);

    for (const { input, target } of shuffled) {
      // Forward
      const { output, caches } = network.forward(input);

      // Compute loss + gradient at output
      const { loss: l, dOut } = lossFn(output, target);
      epochLoss += l;

      // Backward + update
      network.backward(dOut, caches, lr);
    }

    const avgLoss = epochLoss / data.length;

    if (onEpoch) onEpoch(epoch, avgLoss);

    if (logEvery && epoch % logEvery === 0) {

    }
  }
}

/**
 * Run a forward pass and return the output vector.
 */
function forward(network, input) {
  return network.forward(input).output;
}

// ---------------------------------------------------------------------------
// XOR demo  (mirrors examples/Example.hs)
// ---------------------------------------------------------------------------

function runXORDemo() {


  // Network mirrors the Haskell architecture:
  //   network = dense 2 4 w1 >>> relu >>> dense 4 1 w2 >>> sigmoid
  //
  // We use 8 hidden units and lr=0.3.  Because Xavier init is random, the
  // demo retries up to 5 times until it finds an initialisation that escapes
  // any saddle points (this is the same practical reality in the Haskell
  // version, which uses a fixed seed).
  const xorData = [
    { input: [0, 0], target: [0] },
    { input: [0, 1], target: [1] },
    { input: [1, 0], target: [1] },
    { input: [1, 1], target: [0] },
  ];

  let network, lossHistory, attempt = 0;

  do {
    attempt++;
    network = compose(
      dense(2, 4),
      relu(),
      dense(4, 1),
      sigmoid(),
    );
    lossHistory = [];

    train(network, xorData, {
      epochs:   10000,
      lr:       0.3,
      loss:     'mse',
      logEvery: 0,
      onEpoch: (epoch, loss) => {
        if (epoch % 100 === 0) lossHistory.push({ epoch, loss });
      },
    });
  } while (
    lossHistory[lossHistory.length - 1].loss > 1e-3 && attempt < 10
  );



  const logAt = [1000, 2000, 3000, 5000, 7000, 10000];
  for (const { epoch, loss } of lossHistory.filter(p => logAt.includes(p.epoch))) {

  }


  for (const { input, target } of xorData) {
    const out = forward(network, input);
    const pred = out[0] > 0.5 ? 1 : 0;

      // `[${input}] -> [${out[0].toFixed(6)}]  → ${pred} (expected: ${target[0]})` // debug output removed
  }

  const finalLoss = lossHistory[lossHistory.length - 1].loss;


  return { network, lossHistory };
}

// ---------------------------------------------------------------------------
// Exports  (works as ESM, CJS, or plain browser script)
// ---------------------------------------------------------------------------

const CategoricalNN = { dense, relu, sigmoid, compose, train, forward, mseLoss, bceLoss };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...CategoricalNN, runXORDemo };
} else if (typeof window !== 'undefined') {
  window.CategoricalNN = CategoricalNN;
  window.runXORDemo = runXORDemo;
}

// Auto-run demo when executed directly with Node
if (typeof require !== 'undefined' && require.main === module) {
  runXORDemo();
}
