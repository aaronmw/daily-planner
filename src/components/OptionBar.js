import React from 'react';
import { transparentize } from 'polished';
import styled from 'styled-components';
import Button from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import { COLORS, UNIFIED_TRANSITION } from '../tokens';

const Container = styled(FlexBox).attrs({
    justify: 'space-between',
    paddingX: 1,
    paddingY: 0.25,
    spacing: 0.5,
})(
    ({ theme }) => `
        background: ${transparentize(0.5, COLORS[theme.name].SHADED)};
        color: ${COLORS[theme.name].TEXT_FADED};
        
        &:hover {
            color: ${COLORS[theme.name].TEXT};
        }
    `
);

const OptionButton = styled(Button)(
    ({ isSelected, theme }) => `
        background: transparent;
        color: inherit;
        font-weight: ${isSelected ? 900 : 100};
        opacity: ${isSelected ? 1 : 0};
        ${UNIFIED_TRANSITION};
        
        ${Container}:hover > & {
            opacity: 1;
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
    <Container {...otherProps}>
        {options.map(option => {
            const isSelected = option === selectedOption;

            return (
                <OptionButton
                    key={option}
                    isSelected={isSelected}
                    onClick={() => onChange(option)}
                >
                    {isSelected
                        ? renderSelectedOption(renderOption(option))
                        : renderOption(option)}
                </OptionButton>
            );
        })}
    </Container>
);

export default OptionBar;
