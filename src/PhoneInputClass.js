import React, { Component } from 'react'
import { Globe } from 'phosphor-react'
import PropTypes from 'prop-types'
import countries from 'country-data'
import { AsYouType } from 'libphonenumber-js'
import { PhoneNumberUtil } from 'google-libphonenumber'
import escapeStringRegexp from 'escape-string-regexp'
import { ButtonFlag, TextInput, Dropdown, DropdownList, ListItem } from './styles'

export default class PhoneInput extends Component {
  constructor() {
    super()
    this.phoneUtil = PhoneNumberUtil.getInstance()
    this.countries = countries.callingCountries.all.filter(country => country.status === 'assigned')
    this.mouseDownOnMenu = false
    this._pageClick = this.pageClick.bind(this)
    this.missingFlags = {
      AQ: 'WW',
      BQ: 'NL',
      EH: 'WW-AFR',
      MF: 'FR',
      SH: 'GB'
    }
    this.bgColorTransitionStyle = 'background-color .25s, color .25s'
    this.phoneInput = React.createRef()
    this.state = {
      open: false,
      callingCode: null,
      selectedCountry: {},
      intlPhoneNumber: '',
      phoneNumber: '',
      searchTerm: '',
      valid: false,
      filteredCountries: [],
      preferredCountries: [],
      paginateCount: 1,
      lastPreferred: '',
      tabbedIndex: -1,
      localPlaceholder: '',
      inputType: 'tel',
      isButtonFlagClicked: false
    }
  }

  getPreferredCountries(props) {
    const { preferredCountries } = props
    if (preferredCountries && preferredCountries.length) {
      const _preferredCountries = preferredCountries.map(country => country.toUpperCase())
      const preferred = this.countries.filter(country => _preferredCountries.indexOf(country.alpha2) !== -1).reverse()
      const regular = this.countries.filter(country => _preferredCountries.indexOf(country.alpha2) === -1)
      const orderedCountries = preferred.concat(regular)
      this.setState({
        preferredCountries: orderedCountries,
        lastPreferred: preferred[preferred.length - 1]
      })
      return orderedCountries
    } else {
      this.setState({ lastPreferred: '' })
      return this.countries
    }
  }

  mapErrorMessage(message) {
    const { minLengthMessage, maxLengthMessage, callingCodeMessage, catchAllMessage } = this.props
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

  formatValidation(valid, internalMessage, friendlyMessage, parsed, intlPhoneNumber) {
    return {
      valid,
      internalMessage,
      friendlyMessage,
      parsed,
      intlPhoneNumber
    }
  }

  validateNumber(alpha2, phoneNumber) {
    if (alpha2) {
      const _alpha2 = alpha2 === 'unknown' ? '' : alpha2
      try {
        this.phoneUtil.parse(phoneNumber, _alpha2)
      } catch (e) {
        const { message } = e
        return this.formatValidation(false, message, this.mapErrorMessage(message), null, null)
      }
      const { validMessage } = this.props
      const parsed = this.phoneUtil.parse(phoneNumber, _alpha2)
      const valid = this.phoneUtil.isPossibleNumber(parsed)
      const intlPhoneNumber = new AsYouType().input(phoneNumber)
      return this.formatValidation(valid, '', valid ? validMessage : this.mapErrorMessage(), parsed, intlPhoneNumber)
    } else {
      const { callingCodeMessage } = this.props
      return this.formatValidation(false, '', callingCodeMessage, null, null)
    }
  }

  onKeyDown(e) {
    const { onKeyDown } = this.props
    onKeyDown && onKeyDown(e)
  }

  onBlur() {
    this.setState({
      localPlaceholder: this.props.placeholder
    })
  }
  onFocus(e) {
    const { intlPhoneNumber, selectedCountry, isButtonFlagClicked } = this.state
    const { onKeyDown } = this.props
    onKeyDown && onKeyDown(e)
    this.setState({
      localPlaceholder: '',
      open: isButtonFlagClicked || (!intlPhoneNumber && Object.keys(selectedCountry).length === 0)
    })
  }

  lookupCountry(callingCode) {
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

  testNumber(number) {
    return new RegExp(/^[0-9]+$/).test(number)
  }

  unformatNumber(number) {
    const _number = !isNaN(number) ? number.toString() : number
    return _number ? _number.replace(/[^0-9]/g, '') : number
  }

  getNationalNumber(country, number) {
    const { countryCallingCodes } = country
    return number && countryCallingCodes && countryCallingCodes.length
      ? number.substr(countryCallingCodes[0].length)
      : ''
  }

  formatNumber(alpha2, number) {
    const formatter = new AsYouType(alpha2)
    const formattedNumberArray = `+${number}`.split('').map(char => formatter.input(char))
    const intlPhoneNumber = formattedNumberArray.length ? formattedNumberArray[formattedNumberArray.length - 1] : number
    return intlPhoneNumber
  }

  onChangeCallback({ country, validation, phoneNumber, intlPhoneNumber }) {
    const { onChange } = this.props
    if (country) {
      this.selectCountry(country, false)
    }
    onChange && onChange({ ...validation, phoneNumber, intlPhoneNumber })
  }

  handleSelectCountry = country => () => {
    this.selectCountry(country, false, true)
  }

  handleChangePhone = e => {
    const value = e.target.value
    this.onChangePhone(value)
  }

  onChangePhone(value = '') {
    if (!value.startsWith('+') && isNaN(value)) {
      this.setState({
        open: true
      })
      this.onChangeTypeAhead(value)
    } else {
      const { selectedCountry, callingCode } = this.state
      const unformattedNumber = this.unformatNumber(value)
      const phoneNoFormatted = new AsYouType().input(value)
      const getCountryCallingCode = phoneNoFormatted.split(' ')[0]
      const lookupCountry = this.lookupCountry(getCountryCallingCode.replace('+', ''))
      const country = lookupCountry || (Object.keys(selectedCountry).length > 0 && selectedCountry)
      this.setState({
        open: false
      })
      if (callingCode && this.testNumber(unformattedNumber) && value !== callingCode && country) {
        const { alpha2 } = country
        const intlPhoneNumber = this.formatNumber(alpha2, unformattedNumber)
        const phoneNumber = this.getNationalNumber(country, intlPhoneNumber)
        const validation = this.validateNumber(alpha2, intlPhoneNumber)
        const { friendlyMessage, valid } = validation
        this.setState(
          {
            intlPhoneNumber,
            phoneNumber,
            message: friendlyMessage,
            valid
          },
          () =>
            this.onChangeCallback({
              country,
              validation,
              phoneNumber,
              intlPhoneNumber
            })
        )
      } else {
        const { alpha2 } = country
        const intlPhoneNumber = this.formatNumber(alpha2, unformattedNumber)
        const phoneNumber = this.getNationalNumber(country, intlPhoneNumber)
        const validation = this.validateNumber(alpha2, intlPhoneNumber)
        this.setState(
          {
            intlPhoneNumber: value,
            phoneNumber
          },
          () => {
            if (value == '') {
              this.setState({
                filteredCountries: this.countries,
                selectedCountry: {},
                callingCode: null,
                inputType: 'text',
                searchTerm: ''
              })
              this.phoneInput.current.blur()
              setTimeout(() => {
                this.phoneInput.current.focus()
              }, 500)
              this.props.onChange(null)
            } else {
              this.setState({
                intlPhoneNumber
              })
              this.onChangeCallback({
                country,
                validation,
                phoneNumber,
                intlPhoneNumber
              })
            }
          }
        )
      }
    }
  }

  onChangeTypeAhead(value) {
    const { preferredCountries } = this.state
    const filteredCountries = this.countries.filter(country => {
      const { name, countryCallingCodes } = country
      const searchCriteria = `${name} ${countryCallingCodes.join(' ')}`
      return new RegExp(escapeStringRegexp(value.trim()), 'gi').test(searchCriteria)
    })
    this.setState({
      filteredCountries: value.trim() === '' ? preferredCountries : filteredCountries,
      searchTerm: value,
      tabbedIndex: -1
    })
  }

  selectCountry(country, mounted = false, onClick = false) {
    const { onChange } = this.props
    const { countryCallingCodes, alpha2 } = country
    const { intlPhoneNumber, phoneNumber, searchTerm } = this.state
    const callingCode = countryCallingCodes && countryCallingCodes[0]
    const _intlPhoneNumber = mounted
      ? `${callingCode}${intlPhoneNumber}`
      : this.formatNumber(alpha2, this.unformatNumber(`${callingCode}${phoneNumber}`))
    const validation = this.validateNumber(alpha2, _intlPhoneNumber)
    this.setState(
      {
        selectedCountry: country,
        callingCode,
        open: false,
        isButtonFlagClicked: false,
        tabbedIndex: -1,
        searchTerm: searchTerm.trim()
      },
      () => {
        if (onClick) {
          this.setState({ intlPhoneNumber: _intlPhoneNumber })
        }
        if (!mounted) {
          this.phoneInput.current.focus()
          if (onChange) {
            onChange({
              ...country,
              ...validation,
              callingCode,
              phoneNumber,
              intlPhoneNumber: _intlPhoneNumber
            })
          }
        }
      }
    )
  }

  pageClick() {
    if (!this.mouseDownOnMenu) {
      this.setState({ open: false, isButtonFlagClicked: false, tabbedIndex: -1 }, () => {
        this.countryDropdown.scrollTop = 0
      })
    }
  }

  handleClickButtonFlag() {
    const { disabled } = this.props
    const { open } = this.state
    return () => {
      if (!disabled) {
        this.setState({ open: !open, isButtonFlagClicked: true }, () => {
          if (!open) {
            this.setState({ searchTerm: '' })
            this.phoneInput.current.focus()
          } else {
            this.setState({ tabbedIndex: -1 })
          }
        })
      }
    }
  }

  mouseDownHandler() {
    this.mouseDownOnMenu = true
  }

  mouseUpHandler() {
    this.mouseDownOnMenu = false
  }

  getBgColor(index, selected) {
    const { tabbedIndex, hoverIndex } = this.state
    const hovered = index === hoverIndex
    const tabbed = index === tabbedIndex
    if (tabbed) {
      return '#f0f7fc'
    } else if (selected && hovered) {
      return '#f0f7fc'
    } else if (selected) {
      return '#f0f7fc'
    } else if (hovered) {
      return '#f0f7fc'
    }
  }

  propChangeHandler(props) {
    const { selectedCountry } = this.state
    const { defaultCountry, value } = props
    const countryNotSelected = Object.keys(selectedCountry).length < 1 && selectedCountry !== 'unknown'
    if (value || value === 0) {
      const unformattedNumber = this.unformatNumber(value)
      const phoneNoFormatted = new AsYouType().input(value)
      const getCountryCallingCode = phoneNoFormatted.split(' ')[0]
      const lookupCountry = this.lookupCountry(getCountryCallingCode.replace('+', ''))
      const country = lookupCountry || (Object.keys(selectedCountry).length > 0 && selectedCountry)
      const intlPhoneNumber = this.formatNumber(country.alpha2, unformattedNumber)
      if (country) {
        this.setState(
          {
            intlPhoneNumber
          },
          () => {
            if (defaultCountry && countryNotSelected) {
              this.selectCountry(country, true, false)
            }
          }
        )
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const { reset, value, preferredCountries } = nextProps
    if (reset || this.props.value !== value) {
      this.propChangeHandler(nextProps, false, reset)
    }
    if (JSON.stringify(this.props.preferredCountries) !== JSON.stringify(preferredCountries)) {
      this.setState({
        filteredCountries: this.getPreferredCountries(nextProps)
      })
    }
  }

  componentDidMount() {
    const { autoFocus, placeholder } = this.props
    window.addEventListener('mousedown', this._pageClick)
    this.propChangeHandler(this.props, true)
    this.setState({
      filteredCountries: this.getPreferredCountries(this.props)
    })
    if (autoFocus) {
      this.phoneInput.current.focus()
    }
    if (placeholder) {
      this.setState({
        localPlaceholder: placeholder
      })
    }
    this.autoSelectCountry()
  }

  autoSelectCountry() {
    const { selectedCountry } = this.state
    const { defaultCountry, value } = this.props
    const countryNotSelected = Object.keys(selectedCountry).length < 1 && selectedCountry !== 'unknown'
    if (defaultCountry && countryNotSelected) {
      const country = countries.countries[defaultCountry]
      this.selectCountry(country, true, false)
      if (!value) {
        const intlPhoneNumber = `${country.countryCallingCodes[0]} `
        this.setState({
          intlPhoneNumber
        })
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this._pageClick)
  }

  render() {
    const {
      open,
      selectedCountry,
      intlPhoneNumber,
      filteredCountries,
      searchTerm,
      paginateCount,
      lastPreferred,
      localPlaceholder
    } = this.state
    const { noResultsMessage, paginate, paginateText, maxHeight, disabled, error, inputName, id, dataTestId } =
      this.props
    const { alpha2 } = selectedCountry
    const flag =
      (this.missingFlags[alpha2]
        ? this.missingFlags[alpha2]
        : selectedCountry !== 'unknown' && Object.keys(selectedCountry).length > 0 && alpha2.toUpperCase()) || 'WW'
    return (
      <>
        <div
          style={{ position: 'relative' }}
          onMouseDown={() => this.mouseDownHandler()}
          onMouseUp={() => this.mouseUpHandler()}>
          <div className="input-group">
            <div className="input-group-prepend">
              <ButtonFlag
                type="button"
                tabIndex={0}
                disabled={disabled}
                aria-hidden
                error={error}
                onClick={this.handleClickButtonFlag()}>
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
            <TextInput
              name={inputName}
              id={id}
              data-test-id={dataTestId}
              autoComplete={'off'}
              aria-describedby={'validation-info'}
              type={this.state.inputType}
              ref={this.phoneInput}
              placeholder={localPlaceholder}
              onKeyDown={e => this.onKeyDown(e)}
              onFocus={e => this.onFocus(e)}
              onBlur={e => this.onBlur(e)}
              value={open ? searchTerm : intlPhoneNumber}
              disabled={disabled}
              error={error}
              onChange={this.handleChangePhone}
            />
          </div>
          <Dropdown
            open={open}
            maxHeight={maxHeight}
            aria-hidden
            tabIndex={-1}
            ref={dropdown => {
              this.countryDropdown = dropdown
            }}>
            {filteredCountries &&
              filteredCountries.length > 0 &&
              filteredCountries.map((country, index) => {
                const { name, alpha2, countryCallingCodes } = country
                const paginateTo = paginate && parseInt(paginate) * paginateCount
                const flag = this.missingFlags[alpha2] ? this.missingFlags[alpha2] : alpha2
                if (index <= paginateTo) {
                  return (
                    <DropdownList
                      key={`${alpha2}-${index}`}
                      hasPreferredCountries={lastPreferred && lastPreferred.alpha2 === alpha2 && searchTerm === ''}>
                      <ListItem
                        id={alpha2}
                        tabIndex={0}
                        onMouseEnter={() => this.setState({ hoverIndex: index })}
                        onMouseLeave={() => this.setState({ hoverIndex: NaN })}
                        style={{
                          transition: this.bgColorTransitionStyle,
                          backgroundColor: this.getBgColor(index, alpha2 === selectedCountry.alpha2)
                        }}
                        onClick={this.handleSelectCountry(country)}>
                        <div className="d-flex align-items-center">
                          {!this.missingFlags[alpha2] && (
                            <img
                              className="mr-2"
                              width={24}
                              height={24}
                              src={`https://img.okadoc.com/photos/countries-circ/${flag.toLowerCase()}-circular.svg`}
                              alt="country flag circular"
                            />
                          )}
                          {this.missingFlags[alpha2] && <Globe className="mr-2" size={30} weight="light" />}
                          <div className="country-calling-code mr-2">{countryCallingCodes[0].split(' ')[0]}</div>
                          <div className="country-name">{name}</div>
                        </div>
                      </ListItem>
                    </DropdownList>
                  )
                }
                if (index - 1 === paginateTo) {
                  return (
                    <div
                      className="dropdown-item"
                      aria-hidden
                      style={{
                        padding: 15,
                        cursor: 'pointer',
                        transition: this.bgColorTransitionStyle
                      }}
                      key={`addit-results-${index}`}
                      onClick={() => this.setState({ paginateCount: paginateCount + 1 })}>
                      {paginateText}
                    </div>
                  )
                }
              })}
            {filteredCountries && filteredCountries.length === 0 && (
              <div
                style={{
                  padding: 15,
                  cursor: 'pointer',
                  transition: this.bgColorTransitionStyle
                }}
                className="dropdown-item">
                {noResultsMessage}
              </div>
            )}
          </Dropdown>
        </div>
      </>
    )
  }
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
  inputName: 'Phone Number'
}

PhoneInput.propTypes = {
  preferredCountries: PropTypes.arrayOf(PropTypes.string),
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
