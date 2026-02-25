import { useState } from 'react'
import './App.css'
// Import the neural net library
import './categorical-nn.js'

function App() {
  const [count, setCount] = useState(0)
  const [nnOutput, setNnOutput] = useState(null)

  // Create a simple network (e.g., 1 input, 1 output)
  // Only create once per session
  if (!window.nn) {
    window.nn = window.CategoricalNN.compose(
      window.CategoricalNN.dense(1, 1),
      window.CategoricalNN.sigmoid()
    )
  }

  const handleClick = () => {
    setCount(count + 1)
    // Run a forward pass with the current count
    const output = window.CategoricalNN.forward(window.nn, [count + 1])
    setNnOutput(output[0])
  }

  return (
    <div className="card">
      <button onClick={handleClick}>
        count is {count}
      </button>
      {nnOutput !== null && (
        <div>Neural net output: {nnOutput.toFixed(4)}</div>
      )}
    </div>
  )
}

export default App
