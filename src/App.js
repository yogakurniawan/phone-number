import { useState } from 'react'
import PhoneInput from './PhoneInput'
import './App.css'

function App() {
  const [toggleShowPhoneInput, setToggleShowPhoneInput] = useState(true)
  const handleChange = value => {
    console.log(value)
  }

  const handlePhoneClassKeyDown = e => {
    console.log(e)
  }

  return (
    <div className="app-container">
      <button onClick={() => setToggleShowPhoneInput(!toggleShowPhoneInput)}>Toggle Phone Input</button>
      {toggleShowPhoneInput && (
        <div>
          <PhoneInput
            id="phoneNumber"
            dataTestId="inpPhoneNumberLogin"
            onChange={handleChange}
            onKeyDown={handlePhoneClassKeyDown}
            defaultCountry="AE"
            value="+6285737273839"
          />
        </div>
      )}
    </div>
  )
}

export default App
