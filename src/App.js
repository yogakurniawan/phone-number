import { useState } from 'react'
import PhoneInput from './PhoneInput'
import PhoneInputClass from './PhoneInputClass'
import './App.css'

function App() {
  const [preferredCountries, setPreferredCountries] = useState([])
  const [toggleShowPhoneInput, setToggleShowPhoneInput] = useState(true)
  const handleChange = value => {
    console.log(value)
  }

  const handlePhoneClassKeyDown = e => {
    console.log(e)
  }

  const handlePhoneChange = localPhone => {
    if (localPhone && localPhone.alpha2) {
      const thePhone = `${localPhone.callingCode}${localPhone.phoneNumber.replace(/\s/g, '')}`
      setPreferredCountries([localPhone.alpha2])
      console.log(thePhone)
    } else {
      setPreferredCountries([])
    }
  }

  return (
    <div className="app-container">
      <button onClick={() => setToggleShowPhoneInput(!toggleShowPhoneInput)}>Toggle Phone Input</button>
      {toggleShowPhoneInput && (
        <div>
          <PhoneInput
            id="phoneNumber"
            dataTestId="inpPhoneNumberLogin"
            preferredCountries={preferredCountries}
            onChange={handleChange}
            autoFocus
            onKeyDown={handlePhoneClassKeyDown}
            defaultCountry="AE"
            value='+6285737273839'
            error={false}
          />
        </div>
      )}
      <div>
        {/* <PhoneInputClass
          id="phoneNumber"
          dataTestId="inpPhoneNumberLogin"
          preferredCountries={preferredCountries}
          onChange={handlePhoneChange}
          autoFocus
          onKeyDown={handlePhoneClassKeyDown}
          defaultCountry="AE"
          error={false}
        /> */}
      </div>
    </div>
  )
}

export default App
