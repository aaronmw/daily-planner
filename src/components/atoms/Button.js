import React, { useEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import toInt from '../../utils/toInt';
import FlexBox from './FlexBox';
import {
    BORDER_RADIUS,
    BORDER_WIDTH,
    COLORS,
    UNIFIED_TRANSITION,
} from './tokens';

const Button = styled(FlexBox).attrs({
    forwardedAs: 'button',
    justify: 'center',
    paddingX: 0.5,
    paddingY: 0.25,
})(
    ({ isInverted = false, theme }) => `
        align-self: unset;
        background-color: ${
            COLORS[theme.name][isInverted ? 'BACKGROUND' : 'PRIMARY']
        };
        border: 2px solid transparent;
        border-radius: ${BORDER_RADIUS};
        color: ${COLORS[theme.name][isInverted ? 'PRIMARY' : 'BACKGROUND']};
        cursor: pointer;
        transform: translateY(0);
        ${UNIFIED_TRANSITION};
        transition-property: border, color;
        
        &:focus,
        &:hover {
            border-color: ${
                COLORS[theme.name][isInverted ? 'PRIMARY' : 'BACKGROUND']
            };
        }
        &:active {
            transform: translateY(2px);
        }
    `
);

const StyledGhostButton = styled(Button)(
    ({ theme }) => `
        background: unset; 
        color: ${COLORS[theme.name].TEXT_FADED};
        position: relative;
        width: 100%;
        
        &:focus,
        &:hover {
            color: ${COLORS[theme.name].TEXT};
        }
    `
);

const animation = keyframes`
  from {
      stroke-dashoffset: 0;
  }
  to {
      stroke-dashoffset: 12px;
  }
`;

const TracerSVGElement = styled.svg`
    overflow: visible;
    position: absolute;
`;

const Tracer = styled.rect(
    ({ isAnimated, theme }) => css`
        animation-name: ${isAnimated ? animation : ''};
        animation-duration: 0.5s;
        animation-direction: normal;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
        fill: none;
        stroke: ${COLORS[theme.name][isAnimated ? 'PRIMARY' : 'TEXT_FADED']};
        stroke-width: calc(${BORDER_WIDTH} * 2);
        stroke-dasharray: 6px, 6px;
        position: relative;
        z-index: 1000;
    `
);

const AnimatedTracer = ({ isAnimated, targetElementRef, ...otherProps }) => {
    const [viewBoxDimensions, setViewBoxDimensions] = useState({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        if (targetElementRef.current) {
            setViewBoxDimensions({
                width: targetElementRef.current.offsetWidth,
                height: targetElementRef.current.offsetHeight,
            });
        }
    }, [targetElementRef]);

    return (
        <TracerSVGElement
            preserveAspectRatio="none"
            viewBox={`0 0 ${viewBoxDimensions.width} ${viewBoxDimensions.height}`}
            xmlns="http://www.w3.org/2000/svg"
            {...otherProps}
        >
            <Tracer
                width={viewBoxDimensions.width}
                height={viewBoxDimensions.height}
                isAnimated={isAnimated}
                rx={toInt(BORDER_RADIUS) * 2}
                x={0}
                y={0}
            />
        </TracerSVGElement>
    );
};

export const GhostButton = ({ children, ...otherProps }) => {
    const [isAnimated, setIsAnimated] = useState(false);

    const buttonElementRef = useRef(null);

    const handleMouseEnterAndLeave = () => setIsAnimated(!isAnimated);

    return (
        <StyledGhostButton
            ref={buttonElementRef}
            onMouseEnter={handleMouseEnterAndLeave}
            onMouseLeave={handleMouseEnterAndLeave}
            {...otherProps}
        >
            <AnimatedTracer
                isAnimated={isAnimated}
                targetElementRef={buttonElementRef}
            />
            {children}
        </StyledGhostButton>
    );
};

export const ToggleButton = styled(Button).attrs(({ isInverted }) => ({
    isInverted: !isInverted,
}))``;

export default Button;
