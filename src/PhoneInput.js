import React, { useState, useEffect, useRef } from 'react'
import { FlagIcon } from 'react-flag-kit'
import countries from 'country-data'
import escapeStringRegexp from 'escape-string-regexp'
import { AsYouTypeFormatter, PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'

function PhoneInput({
  disabled,
  inputClassName,
  placeholder,
  inputId,
  validMessage,
  callingCodeMessage,
  minLengthMessage,
  maxLengthMessage,
  catchAllMessage,
  onChange
}) {
  const phoneUtil = PhoneNumberUtil.getInstance()
  const [inputType, setInputType] = useState('text')
  const [searchTerm, setSearchTerm] = useState('')
  const [intlPhoneNumber, setIntlPhoneNumber] = useState('')
  const [hoverIndex, setHoverIndex] = useState('text')
  const [selectedCountry, setSelectedCountry] = useState({})
  const [open, setOpen] = useState(false)
  const [filteredCountries, setFilteredCountries] = useState([])
  const [preferredCountries, setPreferredCountries] = useState([])
  const [tabbedIndex, setTabbedIndex] = useState(-1)
  const [lastPreferred, setLastPreferred] = useState()
  const [callingCode, setCallingCode] = useState()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [valid, setValid] = useState(false)
  const [value, setValue] = useState('')
  const inputTel = useRef()
  const inputText = useRef()
  const mouseDownOnMenu = useRef()
  const countryDropdownRef = useRef()
  const phoneInputRef = useRef()
  const { alpha2 } = selectedCountry
  const missingFlags = { AQ: 'WW', BQ: 'NL', EH: 'WW-AFR', MF: 'FR', SH: 'GB' }
  const assignedCountries = countries.callingCountries.all.filter(country => country.status === 'assigned')
  const tabbedCountry = filteredCountries.length > 0 && filteredCountries[0].alpha2
  const flag =
    (missingFlags[alpha2]
      ? missingFlags[alpha2]
      : selectedCountry !== 'unknown' && Object.keys(selectedCountry).length > 0 && alpha2.toUpperCase()) || 'WW'
  //   const handleChange = (e) => {
  //     const theValue = (e.target.value || "").trim();
  //     if (isNaN(theValue) || theValue === "") {
  //       setInputType("text");
  //     } else {
  //       setInputType("tel");
  //     }
  //     setValue(theValue);
  //   };

  const onChangeTypeAhead = value => {
    const filteredCountries = assignedCountries.filter(country => {
      const { name, countryCallingCodes } = country
      const searchCriteria = `${name} ${countryCallingCodes.join(' ')}`
      return new RegExp(escapeStringRegexp(value.trim()), 'gi').test(searchCriteria)
    })
    setFilteredCountries(value.trim() === '' ? preferredCountries : filteredCountries)
    setSearchTerm(value)
    setTabbedIndex(-1)
  }

  const testNumber = number => {
    return new RegExp(/^[0-9]+$/).test(number)
  }

  const unformatNumber = number => {
    const theNumber = !isNaN(number) ? number.toString() : number
    return theNumber ? theNumber.replace(/[^0-9]/g, '') : number
  }

  const getNationalNumber = (alpha2, number) => {
    return number && alpha2 && alpha2.length ? number.substr(alpha2.length + 1) : ''
  }

  const formatNumber = (alpha2, number) => {
    const unformattedNumber = unformatNumber(number)
    const formatter = new AsYouTypeFormatter(alpha2)
    const formattedNumberArray = `+${number}`.split('').map(char => formatter.inputDigit(char))
    const intlPhoneNumber = formattedNumberArray.length
      ? formattedNumberArray[formattedNumberArray.length - 1]
      : unformattedNumber
    formatter.clear()
    return {
      intlPhoneNumber,
      callingCode: intlPhoneNumber.split(' ')[0]
    }
  }

  const lookupCountry = callingCode => {
    const _callingCode = callingCode.toString().trim()
    if (_callingCode === '1') {
      return countries.countries.US
    } else {
      return countries.lookup
        .countries({
          countryCallingCodes: `${_callingCode.charAt(0) === '+' ? _callingCode : '+'.concat(_callingCode)}`
        })
        .filter(country => country.status === 'assigned')[0]
    }
  }

  const formatValidation = (valid, internalMessage, friendlyMessage, parsed, intlPhoneNumber) => {
    return {
      valid,
      internalMessage,
      friendlyMessage,
      parsed,
      intlPhoneNumber
    }
  }

  const mapErrorMessage = message => {
    if (
      message === 'The string supplied did not seem to be a phone number' ||
      message === 'The string supplied is too short to be a phone number' ||
      message === 'Phone number too short after IDD'
    ) {
      return minLengthMessage
    } else if (message === 'The string supplied is too long to be a phone number') {
      return maxLengthMessage
    } else if (message === 'Invalid country calling code') {
      return callingCodeMessage
    } else {
      return catchAllMessage
    }
  }

  const validateNumber = (alpha2, phoneNumber) => {
    if (alpha2) {
      const _alpha2 = alpha2 === 'unknown' ? '' : alpha2
      try {
        phoneUtil.parse(phoneNumber, _alpha2)
      } catch (e) {
        const { message } = e
        return formatValidation(false, message, mapErrorMessage(message), null, null)
      }
      const parsed = phoneUtil.parse(phoneNumber, _alpha2)
      const valid = phoneUtil.isPossibleNumber(parsed)
      const intlPhoneNumber = phoneUtil.format(parsed, PhoneNumberFormat.INTERNATIONAL)
      return formatValidation(valid, '', valid ? validMessage : mapErrorMessage(), parsed, intlPhoneNumber)
    } else {
      return formatValidation(false, '', callingCodeMessage, null, null)
    }
  }

  const getBgColor = (index, selected) => {
    const hovered = index === hoverIndex
    const tabbed = index === tabbedIndex
    if (tabbed) {
      return '#EBEBEB'
    } else if (selected && hovered) {
      return '#BBDEF8'
    } else if (selected) {
      return '#E3F2FD'
    } else if (hovered) {
      return '#EBEBEB'
    }
  }

  const onOpenHandler = () => {
    if (!disabled) {
      setOpen(!open)
      if (!open) {
        phoneInputRef.current.focus()
      } else {
        setTabbedIndex(-1)
      }
    }
  }

  const mouseDownHandler = () => {
    mouseDownOnMenu.current = true
  }

  const mouseUpHandler = () => {
    mouseDownOnMenu.current = false
  }

  const pageClick = () => {
    if (!mouseDownOnMenu.current) {
      setOpen(false)
      setTabbedIndex(-1)
      countryDropdownRef.current.scrollTop = 0
    }
  }

  const selectCountry = (country, mounted = false, onClick = false) => {
    if (Object.keys(country).length > 0) {
      const { countryCallingCodes, alpha2 } = country
      const callingCode = countryCallingCodes && countryCallingCodes[0]
      const _intlPhoneNumber = mounted
        ? intlPhoneNumber
        : formatNumber(alpha2, unformatNumber(`${callingCode}${phoneNumber}`)).intlPhoneNumber
      const validation = validateNumber(alpha2, _intlPhoneNumber)
      setSelectedCountry(country)
      setCallingCode(callingCode)
      setOpen(false)
      setTabbedIndex(-1)
      setSearchTerm(searchTerm.trim())
      if (onClick) {
        setIntlPhoneNumber(_intlPhoneNumber)
      }
      if (onChange) {
        onChange({ country, validation, callingCode, phoneNumber, intlPhoneNumber: _intlPhoneNumber })
      }
    } else {
      setSelectedCountry({})
      setCallingCode(null)
      setPhoneNumber('')
      setIntlPhoneNumber('')
      if (onChange) {
        onChange({ phoneNumber: '', validation: validateNumber(null, ''), callingCode: '', intlPhoneNumber: '' })
      }
    }

    if (!mounted) {
      phoneInputRef.current.focus()
    }
  }

  const onChangePhone = (value = '', isDeleteContentBackward) => {
    const unformattedNumber = unformatNumber(value)
    const getCallingCode = formatNumber(null, unformattedNumber).callingCode
    console.log(getCallingCode)
    const theLookupCountry = lookupCountry(getCallingCode.replace('+', ''))
    const country = theLookupCountry || (Object.keys(selectedCountry).length > 0 && selectedCountry)
    if (testNumber(unformattedNumber) && value !== callingCode && country) {
      const { alpha2 } = country
      const intlPhoneNumber = formatNumber(alpha2, unformattedNumber).intlPhoneNumber
      const phoneNumber = getNationalNumber(alpha2, intlPhoneNumber)
      const validation = validateNumber(alpha2, intlPhoneNumber)
      const { friendlyMessage, valid } = validation
      setIntlPhoneNumber(intlPhoneNumber)
      setPhoneNumber(phoneNumber)
      setMessage(friendlyMessage)
      setValid(valid)
      selectCountry(country)
    }

    if (
      (isDeleteContentBackward && country && unformattedNumber.length <= country.countryCallingCodes[0].length) ||
      !country
    ) {
      setIntlPhoneNumber(value)
    }

    if (value === '') {
      selectCountry({})
    }
  }

  const handleChange = e => {
    const isDeleteContentBackward = e.nativeEvent.inputType === 'deleteContentBackward'
    const value = e.target.value
    if (open) {
      onChangeTypeAhead(value)
    } else {
      onChangePhone(value, isDeleteContentBackward)
    }
  }

  useEffect(() => {
    window.addEventListener('mousedown', pageClick)
    return () => {
      window.removeEventListener('mousedown', pageClick)
    }
  }, [])

  //   useEffect(() => {
  //     if (inputType === "tel") {
  //       inputTel.current.focus();
  //     } else {
  //       inputText.current.focus();
  //     }
  //   }, [inputType]);

  return (
    <div
      style={{
        position: 'relative'
      }}
      onMouseDown={mouseDownHandler}
      onMouseUp={mouseUpHandler}>
      {/* {inputType === "tel" && (
        <input
          ref={inputTel}
          name="phone input"
          type="tel"
          value={value}
          onChange={handleChange}
        />
      )}
      {inputType === "text" && (
        <input
          ref={inputText}
          name="phone input"
          value={value}
          type="text"
          onChange={handleChange}
        />
      )} */}
      <div className="input-group">
        <div className="input-group-prepend">
          <button
            type="button"
            tabIndex={0}
            disabled={disabled}
            aria-hidden
            style={{
              borderBottomLeftRadius: open ? 0 : null,
              transition: 'background-color .25s, color .25s',
              cursor: disabled ? null : 'pointer'
            }}
            className="btn btn-outline-secondary dropdown-toggle country-selector"
            onClick={onOpenHandler}>
            {flag && <FlagIcon code={flag} size={24} className="flag-icon" />}
          </button>
        </div>
        <input
          id={inputId}
          autoComplete={'off'}
          aria-describedby={'validation-info'}
          type="text"
          ref={phoneInputRef}
          className={`form-control phone-input${inputClassName ? inputClassName : ''}`}
          style={{
            paddingRight: 38,
            borderBottomLeftRadius: open ? 0 : null,
            borderBottomRightRadius: open ? 0 : null
          }}
          placeholder={open ? placeholder : ''}
          //   onKeyDown={(e) => this.onKeyDown(e)}
          value={open ? searchTerm : intlPhoneNumber}
          disabled={disabled}
          onChange={handleChange}
        />
      </div>
      <ul
        aria-hidden
        tabIndex={-1}
        ref={countryDropdownRef}
        className="dropdown-menu country-dropdown"
        style={{
          display: 'block',
          zIndex: 101,
          overflowX: 'auto',
          marginTop: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          maxHeight: open ? 400 : 0,
          borderWidth: open ? 1 : 0,
          padding: open ? '10px 0 10px 0' : 0,
          transition: 'all 0.2s ease',
          width: '100%',
          borderTop: 'none'
        }}>
        {filteredCountries &&
          filteredCountries.length > 0 &&
          filteredCountries.map((country, index) => {
            const { name, alpha2, countryCallingCodes } = country
            return (
              <li
                id={alpha2}
                tabIndex={0}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(NaN)}
                className={`dropdown-item${tabbedIndex === index + 1 ? ' tabbed' : ''}`}
                key={`${alpha2}-${index}`}
                style={{
                  padding: 15,
                  cursor: 'pointer',
                  borderBottom:
                    lastPreferred && lastPreferred.alpha2 === alpha2 && searchTerm === '' ? '1px solid #c1c1c1' : '',
                  transition: 'background-color .25s, color .25s',
                  backgroundColor: getBgColor(index, alpha2 === selectedCountry.alpha2)
                }}
                onClick={() => selectCountry(country, false, true)}>
                <h6 style={{ margin: 0 }}>
                  <FlagIcon
                    style={{ marginRight: 10 }}
                    code={missingFlags[alpha2] ? missingFlags[alpha2] : alpha2}
                    size={30}
                  />
                  {name}&nbsp;
                  {countryCallingCodes.map((code, index) => {
                    return (
                      <small className="text-muted" key={code}>
                        {code}
                      </small>
                    )
                  })}
                </h6>
              </li>
            )
          })}
      </ul>
    </div>
  )
}

export default PhoneInput
