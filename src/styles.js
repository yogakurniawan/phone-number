import styled, { css } from 'styled-components';

export const ButtonFlag = styled.button`
    padding: 12px;
    border-top-left-radius: 4px !important;
    border-bottom-left-radius: 4px !important;
    border: solid 1px #b3b6ba;
    background-color: #fff;
    height: 48px;
    width: 50px;
    ${({ disabled }) => css`
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
    `}
    ${({ error }) => error && css`
        border-top: solid 1px #cc1414;
        border-bottom: solid 1px #cc1414;
        border-left: solid 1px #cc1414;
    `}
`

export const TextInput = styled.input`
    padding: 12px;
    border-top-right-radius: 4px !important;
    border-bottom-right-radius: 4px !important;
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
    border: solid 1px #b3b6ba;
    background-color: #fff;
    height: 48px;
    width: 100%;
    font-size: 16px;
    line-height: 1.5;
    color: #363d45;
    ${({ error }) => error && css`
        border-top: solid 1px #cc1414;
        border-bottom: solid 1px #cc1414;
        border-right: solid 1px #cc1414;
    `}
`

export const Dropdown = styled.ul`
    display: block;
    z-index: 101;
    overflow: auto;
    border-radius: 4px;
    margin-top: 0;
    transition: all 0.2s ease;
    width: 100%;
    background-color: #fff;
    list-style: none;
    margin-bottom: 4px !important;
    ${({ open, maxHeight }) => css`
        border: ${open ? 'solid 1px #b3b6ba' : 'none'};
        border-top: none;
        max-height: ${open ? `${maxHeight}px` : 0};
        padding: ${open ? '9px 0' : 0};
    `}
`

export const DropdownList = styled.li`
    ${({ hasPreferredCountries }) => css`
        border-bottom: ${hasPreferredCountries ? '1px solid #c1c1c1' : 'none'};
        padding-bottom: ${hasPreferredCountries ? '9px' : 0};
        margin-bottom: ${hasPreferredCountries ? '9px' : 0};
    `}
`

export const ListItem = styled.div`
    padding: 8px 16px;
    cursor: pointer;
    &:hover {
        background-color: #f0f7fc;
    }
    font-size: 16px;
    line-height: 1.5;
    color: #000;
    .country-calling-code {
        min-width: 42px;
    }
    .country-name {
        font-weight: bold;
    }
` 