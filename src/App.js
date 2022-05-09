import PhoneInput from './PhoneInput'
import './App.css'

function App() {
  const handleChange = value => {
    console.log(value)
  }

  return (
    <div className="app-container">
      <PhoneInput onChange={handleChange} />
    </div>
  )
}

export default App
