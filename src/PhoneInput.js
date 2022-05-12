import React, { useState, useEffect, useRef } from 'react'
import { Globe } from 'phosphor-react'
import PropTypes from 'prop-types'
import countryData from 'country-data'
import parsePhoneNumber, { isPossiblePhoneNumber, AsYouType } from 'libphonenumber-js'
import escapeStringRegexp from 'escape-string-regexp'
import { ButtonFlag, TextInput, Dropdown, DropdownList, ListItem } from './styles'

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
  onChange,
  error,
  maxHeight,
  dataTestId,
  inputName,
  onKeyDown,
  defaultCountry,
  value
}) {
  const [inputType, setInputType] = useState('text')
  const [isButtonFlagClicked, setIsButtonFlagClicked] = useState(false)
  const [intlPhoneNumber, setIntlPhoneNumber] = useState('')
  const [localPlaceholder, setLocalPlaceholder] = useState('')
  const [hoverIndex, setHoverIndex] = useState('text')
  const [selectedCountry, setSelectedCountry] = useState({})
  const [open, setOpen] = useState(false)
  const [filteredCountries, setFilteredCountries] = useState([])
  const [tabbedIndex, setTabbedIndex] = useState(-1)
  const [lastPreferred, setLastPreferred] = useState()
  const [callingCode, setCallingCode] = useState()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [valid, setValid] = useState(false)
  const mouseDownOnMenu = useRef()
  const countryDropdownRef = useRef()
  const phoneInputRef = React.createRef()
  const { alpha2 } = selectedCountry
  const missingFlags = { AQ: 'WW', BQ: 'NL', EH: 'WW-AFR', MF: 'FR', SH: 'GB' }
  const assignedCountries = countryData.callingCountries.all.filter(country => country.status === 'assigned')
  const bgColorTransitionStyle = 'background-color .25s, color .25s'
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
    setFilteredCountries(value.trim() === '' ? assignedCountries : filteredCountries)
    setOpen(filteredCountries.length > 0)
    setTabbedIndex(-1)
  }

  const testNumber = number => {
    return new RegExp(/^[0-9]+$/).test(number)
  }

  const unformatNumber = number => {
    const theNumber = !isNaN(number) ? number.toString() : number
    return theNumber ? theNumber.replace(/[^0-9]/g, '') : number
  }

  const getNationalNumber = (country, number) => {
    const { countryCallingCodes } = country
    return number && countryCallingCodes && countryCallingCodes.length
      ? number.substr(countryCallingCodes[0].length)
      : ''
  }

  const formatNumber = (alpha2, number) => {
    const formatter = new AsYouType(alpha2)
    const formattedNumberArray = `+${number}`.split('').map(char => formatter.input(char))
    const intlPhoneNumber = formattedNumberArray.length ? formattedNumberArray[formattedNumberArray.length - 1] : number
    return {
      intlPhoneNumber,
      callingCode: intlPhoneNumber.split(' ')[0]
    }
  }

  const lookupCountry = callingCode => {
    const _callingCode = callingCode.toString().trim()
    if (_callingCode === '1') {
      return countryData.countries.US
    } else {
      return countryData.lookup
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
      const parsed = parsePhoneNumber(phoneNumber, _alpha2)
      if (parsed) {
        const valid = isPossiblePhoneNumber(phoneNumber, _alpha2)
        const intlPhoneNumber = parsed.formatInternational()
        return formatValidation(valid, '', valid ? validMessage : mapErrorMessage(), parsed, intlPhoneNumber)
      } else {
        return formatValidation(false, message, mapErrorMessage(message), null, null)
      }
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
      setIsButtonFlagClicked(true)
      setOpen(true)
      if (!open) {
        setTimeout(() => {
          phoneInputRef.current.focus()
        }, 300)
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
      setIsButtonFlagClicked(false)
      setTabbedIndex(-1)
      countryDropdownRef.current.scrollTop = 0
    }
  }

  const selectCountry = (country, mounted = false, onClick = false) => {
    if (Object.keys(country).length > 0) {
      const { countryCallingCodes, alpha2 } = country
      const callingCode = countryCallingCodes && countryCallingCodes[0]
      const { intlPhoneNumber } = formatNumber(alpha2, unformatNumber(`${callingCode}${phoneNumber}`))
      const validation = validateNumber(alpha2, intlPhoneNumber)
      setSelectedCountry(country)
      setCallingCode(callingCode)
      setOpen(false)
      setTabbedIndex(-1)
      if (onClick) {
        setIntlPhoneNumber(intlPhoneNumber)
      }
      if (onChange) {
        onChange({ country, validation, callingCode, phoneNumber, intlPhoneNumber })
      }
      populatePreferredCountries(country)
    } else {
      setSelectedCountry({})
      setCallingCode(null)
      setPhoneNumber('')
      setIntlPhoneNumber('')
      if (onChange) {
        onChange({ phoneNumber: '', validation: validateNumber(null, ''), callingCode: '', intlPhoneNumber: '' })
      }
    }
    setIsButtonFlagClicked(false)
    setTimeout(() => {
      if (!mounted) {
        phoneInputRef.current.focus()
      }
    }, 300)
  }

  const onChangePhone = (value = '', isDeleteContentBackward) => {
    const unformattedNumber = unformatNumber(value)
    const getCallingCode = formatNumber(null, unformattedNumber).callingCode
    const country = lookupCountry(getCallingCode.replace('+', ''))
    if (testNumber(unformattedNumber) && value !== callingCode && country) {
      const { alpha2 } = country
      const intlPhoneNumber = formatNumber(alpha2, unformattedNumber).intlPhoneNumber
      const phoneNumber = getNationalNumber(country, intlPhoneNumber)
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
      setOpen(true)
      setFilteredCountries(assignedCountries)
      selectCountry({})
    }

    if (!country) {
      setSelectedCountry({})
      setLastPreferred('')
      setCallingCode(null)
    }
  }

  const handleChange = e => {
    const isDeleteContentBackward = e.nativeEvent.inputType === 'deleteContentBackward'
    const value = e.target.value
    onChangeTypeAhead(value)
    onChangePhone(value, isDeleteContentBackward)
  }

  const populatePreferredCountries = country => {
    if (Object.keys(country).length > 0) {
      const preferred = assignedCountries.filter(c => country.alpha2 !== c.alpha2)
      const regular = assignedCountries.filter(c => country.alpha2 === c.alpha2)
      const orderedCountries = regular.concat(preferred)
      setFilteredCountries(orderedCountries)
      setLastPreferred(orderedCountries[0])
    }
  }

  const handleKeyDown = e => {
    onKeyDown && onKeyDown(e)
  }

  const handleFocus = e => {
    setLocalPlaceholder('')
    setOpen(isButtonFlagClicked || (!intlPhoneNumber && Object.keys(selectedCountry).length === 0))
  }

  const handleBlur = e => {
    e.preventDefault()
    setLocalPlaceholder(placeholder)
  }

  const setDefaultCountry = () => {
    const countryNotSelected = Object.keys(selectedCountry).length < 1 && selectedCountry !== 'unknown'
    if (defaultCountry && countryNotSelected) {
      const country = countryData.countries[defaultCountry]
      selectCountry(country, false, true)
    } else {
      setFilteredCountries(assignedCountries)
    }
  }

  useEffect(() => {
    setDefaultCountry()
    window.addEventListener('mousedown', pageClick)
    return () => {
      window.removeEventListener('mousedown', pageClick)
    }
  }, [])

  useEffect(() => {
    setInputType(intlPhoneNumber.startsWith('+') ? 'tel' : 'text')
  }, [intlPhoneNumber])

  useEffect(() => {
    setTimeout(() => {
      phoneInputRef.current.focus()
    }, 100)
  }, [inputType])

  useEffect(() => {
    if (value) {
      const unformattedNumber = unformatNumber(value)
      const phoneNoFormatted = new AsYouType().input(value)
      const getCountryCallingCode = phoneNoFormatted.split(' ')[0]
      const countryLookup = lookupCountry(getCountryCallingCode.replace('+', ''))
      const country = countryLookup || (Object.keys(selectedCountry).length > 0 && selectedCountry)
      const { intlPhoneNumber } = formatNumber(country.alpha2, unformattedNumber)
      const phoneNumber = getNationalNumber(country, intlPhoneNumber)
      if (country) {
        selectCountry(country, false, false)
        setIntlPhoneNumber(intlPhoneNumber)
        setPhoneNumber(phoneNumber)
      }
    }
  }, [value])

  return (
    <div
      style={{
        position: 'relative'
      }}
      onMouseDown={mouseDownHandler}
      onMouseUp={mouseUpHandler}>
      <div className="input-group">
        <div className="input-group-prepend">
          <ButtonFlag type="button" tabIndex={0} disabled={disabled} aria-hidden error={error} onClick={onOpenHandler}>
            {flag === 'WW' && <Globe size={24} weight="light" />}
            {flag !== 'WW' && (
              <img
                width={24}
                height={24}
                src={`https://img.okadoc.com/photos/countries-circ/${flag.toLowerCase()}-circular.svg`}
                alt="country flag circular"
              />
            )}
          </ButtonFlag>
        </div>
        {inputType === 'text' && (
          <TextInput
            id={inputId}
            name={inputName}
            data-test-id={dataTestId}
            autoComplete="chrome-off"
            type="text"
            dir="ltr"
            ref={phoneInputRef}
            className={`form-control phone-input${inputClassName ? inputClassName : ''}`}
            style={{
              paddingRight: 38,
              borderBottomLeftRadius: open ? 0 : null,
              borderBottomRightRadius: open ? 0 : null
            }}
            placeholder={localPlaceholder}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={intlPhoneNumber}
            disabled={disabled}
            onChange={handleChange}
          />
        )}
        {inputType === 'tel' && (
          <TextInput
            id={inputId}
            name={inputName}
            data-test-id={dataTestId}
            autoComplete="chrome-off"
            type="tel"
            dir="ltr"
            ref={phoneInputRef}
            className={`form-control phone-input${inputClassName ? inputClassName : ''}`}
            style={{
              paddingRight: 38,
              borderBottomLeftRadius: open ? 0 : null,
              borderBottomRightRadius: open ? 0 : null
            }}
            placeholder={localPlaceholder}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={intlPhoneNumber}
            disabled={disabled}
            onChange={handleChange}
          />
        )}
      </div>
      <Dropdown
        open={open}
        aria-hidden
        tabIndex={-1}
        ref={countryDropdownRef}
        className="dropdown-menu country-dropdown"
        maxHeight={maxHeight}>
        {filteredCountries &&
          filteredCountries.length > 0 &&
          filteredCountries.map((country, index) => {
            const { name, alpha2, countryCallingCodes } = country
            const flag = missingFlags[alpha2] ? missingFlags[alpha2] : alpha2
            return (
              <DropdownList
                key={`${alpha2}-${index}`}
                hasPreferredCountries={lastPreferred && lastPreferred.alpha2 === alpha2}>
                <ListItem
                  id={alpha2}
                  tabIndex={0}
                  onMouseEnter={() => setHoverIndex({ hoverIndex: index })}
                  onMouseLeave={() => setHoverIndex({ hoverIndex: NaN })}
                  style={{
                    transition: bgColorTransitionStyle,
                    backgroundColor: getBgColor(index, alpha2 === selectedCountry.alpha2)
                  }}
                  onClick={() => selectCountry(country, false, true)}>
                  <div className="d-flex align-items-center">
                    {!missingFlags[alpha2] && (
                      <img
                        className="mr-2"
                        width={24}
                        height={24}
                        src={`https://img.okadoc.com/photos/countries-circ/${flag.toLowerCase()}-circular.svg`}
                        alt="country flag circular"
                      />
                    )}
                    {missingFlags[alpha2] && <Globe className="mr-2" size={30} weight="light" />}
                    <div className="country-calling-code mr-2">{countryCallingCodes[0].split(' ')[0]}</div>
                    <div className="country-name">{name}</div>
                  </div>
                </ListItem>
              </DropdownList>
            )
          })}
      </Dropdown>
    </div>
  )
}

PhoneInput.defaultProps = {
  noResultsMessage: 'No results available',
  paginateText: 'Display additional results...',
  paginate: 50,
  placeholder: 'Search Country',
  maxHeight: 300,
  defaultCountry: '',
  disabled: false,
  minLengthMessage: 'Too short to be a valid phone number',
  maxLengthMessage: 'Too long to be a valid phone number',
  callingCodeMessage: 'Please select a valid country code',
  catchAllMessage: 'Not a valid phone number',
  validMessage: 'This phone number is valid',
  autoFocus: false,
  error: false,
  inputName: 'Phone Number',
  id: 'phoneNumber',
  dataTestId: 'inpPhoneNumberLogin'
}

PhoneInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  noResultsMessage: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  paginateText: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  paginate: PropTypes.number,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  maxHeight: PropTypes.number,
  defaultCountry: PropTypes.string,
  onChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  minLengthMessage: PropTypes.string,
  maxLengthMessage: PropTypes.string,
  callingCodeMessage: PropTypes.string,
  catchAllMessage: PropTypes.string,
  inputClassName: PropTypes.string,
  validMessage: PropTypes.string,
  autoFocus: PropTypes.bool,
  error: PropTypes.bool,
  inputName: PropTypes.string,
  id: PropTypes.string,
  dataTestId: PropTypes.string
}

export default PhoneInput
