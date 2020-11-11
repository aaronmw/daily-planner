import styled from 'styled-components';
import { BORDER_RADIUS, COLOR_PRIMARY, UNIFIED_TRANSITION } from '../../tokens';
import Box from './Box';

const Button = styled(Box).attrs({
    as: 'button',
    paddingX: 0.5,
    paddingY: 0.25,
})(
    props => `
        background: ${COLOR_PRIMARY};
        border-radius: ${BORDER_RADIUS};
        color: white;
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

export default Button;
