import React from 'react';
import styled from 'styled-components';
import Button from './atoms/Button';
import { UNIFIED_TRANSITION } from './atoms/tokens';
import ToolBar from './ToolBar';

const OptionButton = styled(Button)(
    ({ isSelected, theme }) => `
        background: transparent;
        color: inherit;
        font-weight: ${isSelected ? 900 : 100};
        opacity: ${isSelected ? 1 : 0.75};
        width: auto;
        ${UNIFIED_TRANSITION};
        
        ${ToolBar}:focus-within > &,
        ${ToolBar}:hover > & {
            opacity: 1;
        }
     
        &:hover {
            border-color: ${theme.HIGH_CONTRAST_BACKGROUND};
        }
    `
);

const OptionBar = ({
    options,
    renderOption = option => option,
    renderSelectedOption = option => option,
    selectedOption,
    onChange,
    ...otherProps
}) => (
    <ToolBar {...otherProps}>
        {options.map((option, optionIndex) => {
            const isSelected = option === selectedOption;

            return (
                <OptionButton
                    key={option}
                    isSelected={isSelected}
                    onClick={() => onChange(option)}
                >
                    {isSelected
                        ? renderSelectedOption(
                              renderOption(option, optionIndex),
                              optionIndex
                          )
                        : renderOption(option, optionIndex)}
                </OptionButton>
            );
        })}
    </ToolBar>
);

export default OptionBar;
