import React, { useEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import toInt from '../../utils/toInt';
import FlexBox from './FlexBox';
import { BORDER_RADIUS, BORDER_WIDTH, UNIFIED_TRANSITION } from './tokens';

const Button = styled(FlexBox).attrs({
    forwardedAs: 'button',
    justify: 'center',
    paddingX: 0.5,
    paddingY: 0.25,
})(
    ({ isInverted = false, theme }) => `
        align-self: unset;
        background-color: ${theme[isInverted ? 'BACKGROUND' : 'PRIMARY']};
        border: 2px solid transparent;
        border-radius: ${BORDER_RADIUS};
        color: ${theme[isInverted ? 'PRIMARY' : 'BACKGROUND']};
        cursor: pointer;
        transform: translateY(0);
        ${UNIFIED_TRANSITION};
        transition-property: border, color;
        
        &:focus,
        &:hover {
            border-color: ${theme[isInverted ? 'PRIMARY' : 'BACKGROUND']};
        }
        &:active {
            transform: translateY(2px);
        }
    `
);

const StyledGhostButton = styled(Button)(
    ({ theme }) => `
        background: unset; 
        color: ${theme.TEXT_FADED};
        position: relative;
        width: 100%;
        
        &:focus,
        &:hover {
            color: ${theme.TEXT};
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
    ({ isAnimated, isResizing, theme }) => css`
        animation-name: ${animation};
        animation-duration: 0.5s;
        animation-direction: normal;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
        animation-play-state: ${isAnimated ? 'running' : 'paused'};
        fill: none;
        stroke: ${isResizing
            ? 'transparent'
            : theme[isAnimated ? 'PRIMARY' : 'TEXT_FADED']};
        stroke-width: calc(${BORDER_WIDTH} * 2);
        stroke-dasharray: 6px, 6px;
        position: relative;
        z-index: 1000;
    `
);

const AnimatedTracer = ({ isAnimated, targetElementRef, ...otherProps }) => {
    const [isResizing, setIsResizing] = useState(true);
    const [viewBoxDimensions, setViewBoxDimensions] = useState({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        const measureTracer = () => {
            if (targetElementRef.current) {
                const { offsetWidth, offsetHeight } = targetElementRef.current;
                const { width, height } = viewBoxDimensions;

                if (offsetWidth !== width || offsetHeight !== height) {
                    setViewBoxDimensions({
                        width: offsetWidth,
                        height: offsetHeight,
                    });
                }
            }
        };

        const timer = setInterval(measureTracer, 100);

        return () => clearInterval(timer);
    }, [targetElementRef, viewBoxDimensions]);

    useEffect(() => {
        setIsResizing(true);

        const onComplete = () => setIsResizing(false);

        const timer = setTimeout(onComplete, 100);

        return () => clearTimeout(timer);
    }, [viewBoxDimensions]);

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
                isResizing={isResizing}
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
