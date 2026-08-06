import React, { useEffect, useRef, useState } from 'react';
import toInt from '../../utils/toInt';
import cx from '../../utils/cx';
import FlexBox from './FlexBox';
import { BORDER_RADIUS } from './tokens';

const Button = React.forwardRef(
    (
        {
            children,
            className,
            isActive,
            isInverted = false,
            type = 'button',
            ...otherProps
        },
        ref
    ) => (
        <FlexBox
            as="button"
            ref={ref}
            justify="center"
            paddingX={0.5}
            paddingY={0.25}
            type={type}
            aria-pressed={typeof isActive === 'boolean' ? isActive : undefined}
            className={cx(
                'w-auto cursor-pointer select-none rounded-planner border-2 border-transparent transition-[background-color,border-color,color,transform] duration-150 ease-in-out active:translate-y-0.5 focus:outline-none',
                isInverted
                    ? 'bg-planner-background text-planner-text-faded hover:border-planner-primary focus:border-planner-primary'
                    : 'bg-planner-contrast text-planner-contrast-text hover:border-planner-background focus:border-planner-background',
                className
            )}
            {...otherProps}
        >
            {children}
        </FlexBox>
    )
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
        <svg
            className="pointer-events-none absolute inset-0 overflow-visible"
            preserveAspectRatio="none"
            viewBox={`0 0 ${viewBoxDimensions.width} ${viewBoxDimensions.height}`}
            xmlns="http://www.w3.org/2000/svg"
            {...otherProps}
        >
            <rect
                className="planner-ghost-tracer"
                width={viewBoxDimensions.width}
                height={viewBoxDimensions.height}
                rx={toInt(BORDER_RADIUS) * 2}
                style={{
                    animationPlayState: isAnimated ? 'running' : 'paused',
                    stroke: isResizing
                        ? 'transparent'
                        : isAnimated
                          ? 'var(--planner-border)'
                          : 'var(--planner-dotted-line)',
                }}
                x={0}
                y={0}
            />
        </svg>
    );
};

export const GhostButton = React.forwardRef(
    ({ children, className, ...otherProps }, forwardedRef) => {
        const [isAnimated, setIsAnimated] = useState(false);

        const buttonElementRef = useRef(null);
        const setButtonRef = element => {
            buttonElementRef.current = element;

            if (typeof forwardedRef === 'function') {
                forwardedRef(element);
            } else if (forwardedRef) {
                forwardedRef.current = element;
            }
        };

        return (
            <Button
                ref={setButtonRef}
                className={cx(
                    'relative w-full bg-transparent text-planner-text-faded hover:border-transparent hover:text-planner-text focus:border-transparent focus:text-planner-text',
                    className
                )}
                onMouseEnter={setIsAnimated.bind(null, true)}
                onMouseLeave={setIsAnimated.bind(null, false)}
                {...otherProps}
            >
                <AnimatedTracer
                    isAnimated={isAnimated}
                    targetElementRef={buttonElementRef}
                />
                {children}
            </Button>
        );
    }
);

export const ToggleButton = ({ isInverted, ...otherProps }) => (
    <Button isInverted={!isInverted} {...otherProps} />
);

export default Button;
