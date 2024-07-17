import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL
type Example = {
  id: string
  name: string
}

function App() {
  const [examples, setExamples] = useState<Example[]>([])

  useEffect(() => {
    fetchExampleDATA()
  }, [])

  const fetchExampleDATA = async () => {
    try {
      const url = API_URL ? `${API_URL}/api/getExample` : '/api/getExample'
      const response = await fetch(url)
      const data = await response.json()
      setExamples(data)
    } catch (error) {
      console.error(error)
    }
  }

  const postExampleDATA = async () => {
    try {
      const response = await fetch(`${API_URL}/api/upsertExample`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: "", name: `example ${examples.length}` }),
      })
      const data = await response.json() as Example
      setExamples([...examples, data])
    }
    catch (error) {
      console.error
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h1>Examples</h1>
      <ul>
        {examples.map((example) => (
          <li key={example.id}>{example.name}</li>
        ))}
      </ul>
      <button onClick={postExampleDATA}>Post Example Data</button>
    </div>
  )
}

export default App