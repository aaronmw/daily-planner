import styled from 'styled-components';
import { BORDER_RADIUS, COLORS, UNIFIED_TRANSITION } from './tokens';
import FlexBox from './FlexBox';

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
        transform: scale(1);
        ${UNIFIED_TRANSITION};
        
        &:focus,
        &:hover {
            transform: scale(1.1);
        }
        &:active {
            transform: scale(0.9);
            filter: hue-rotate(20deg);
        }
    `
);

export const GhostButton = styled(Button)(
    ({ theme }) => `
        background: unset; 
        border-radius: ${BORDER_RADIUS};
        border: 2px dashed ${COLORS[theme.name].BORDER_IDLE};
        width: 100%;
        
        &:focus,
        &:hover {
            border-color: ${COLORS[theme.name].BORDER_HOVER};
        }
    `
);

export default Button;
