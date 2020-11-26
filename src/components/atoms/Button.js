import styled from 'styled-components';
import FlexBox from './FlexBox';
import { BORDER_RADIUS, COLORS, UNIFIED_TRANSITION } from './tokens';

const Button = styled(FlexBox).attrs({
    as: 'button',
    justify: 'center',
    paddingX: 0.5,
    paddingY: 0.25,
})(
    ({ theme }) => `
        background: ${COLORS[theme.name].PRIMARY};
        border-radius: ${BORDER_RADIUS};
        color: ${COLORS[theme.name].TEXT};
        cursor: pointer;
        transform: translateY(0);
        ${UNIFIED_TRANSITION};
        transition-property: border, color;
        
        &:focus,
        &:hover {
            border-color: ${COLORS[theme.name].PRIMARY};
        }
        &:active {
            transform: translateY(2px);
        }
    `
);

export const GhostButton = styled(Button)(
    ({ theme }) => `
        background: unset; 
        border: 2px dashed ${COLORS[theme.name].BORDER_FADED};
        color: ${COLORS[theme.name].TEXT_FADED};
        width: 100%;
        
        &:focus,
        &:hover {
            color: ${COLORS[theme.name].TEXT};
            border-style: solid;
        }
    `
);

export const ToggleButton = styled(Button)(
    ({ isActive, theme }) => `
        background: unset;
        border: 2px solid transparent;
        width: auto;
    `
);

export default Button;
