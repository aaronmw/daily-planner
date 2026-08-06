import React, { forwardRef } from 'react';
import preventWidowsFunction from '../../utils/preventWidows';
import cx from '../../utils/cx';

const toGridValue = value =>
    typeof value === 'number' ? `calc(${value} * var(--spacing-grid))` : value;

const buildStyles = (style, propName = '', propValue = null, edges = []) => {
    if (propValue !== null) {
        edges.forEach(edge => {
            const styleName = `${propName}${edge}`;
            style[styleName] = toGridValue(propValue);
        });
    }

    return style;
};

const buildBoxStyle = ({
    margin = null,
    marginBottom = null,
    marginLeft = null,
    marginRight = null,
    marginTop = null,
    marginX = null,
    marginY = null,
    padding = null,
    paddingBottom = null,
    paddingLeft = null,
    paddingRight = null,
    paddingTop = null,
    paddingX = null,
    paddingY = null,
}) =>
    [
        ['margin', margin, ['Top', 'Right', 'Bottom', 'Left']],
        ['margin', marginBottom, ['Bottom']],
        ['margin', marginLeft, ['Left']],
        ['margin', marginRight, ['Right']],
        ['margin', marginTop, ['Top']],
        ['margin', marginX, ['Right', 'Left']],
        ['margin', marginY, ['Top', 'Bottom']],
        ['padding', padding, ['Top', 'Right', 'Bottom', 'Left']],
        ['padding', paddingBottom, ['Bottom']],
        ['padding', paddingLeft, ['Left']],
        ['padding', paddingRight, ['Right']],
        ['padding', paddingTop, ['Top']],
        ['padding', paddingX, ['Right', 'Left']],
        ['padding', paddingY, ['Top', 'Bottom']],
    ].reduce(
        (style, [propName, propValue, edges]) =>
            buildStyles(style, propName, propValue, edges),
        {}
    );

const Box = forwardRef(
    (
        {
            as: Element = 'div',
            border = false,
            children,
            className,
            isFlexible = false,
            isRounded = false,
            isScrollable = false,
            margin = null,
            marginBottom = null,
            marginLeft = null,
            marginRight = null,
            marginTop = null,
            marginX = null,
            marginY = null,
            onClick = null,
            padding = null,
            paddingBottom = null,
            paddingLeft = null,
            paddingRight = null,
            paddingTop = null,
            paddingX = null,
            paddingY = null,
            preventWidows = false,
            style,
            ...otherProps
        },
        ref
    ) => (
        <Element
            ref={ref}
            className={cx(
                'self-stretch',
                border && 'shadow-[0_0_0_1px_var(--planner-border)]',
                isFlexible && 'grow shrink',
                isRounded && 'rounded-planner',
                isScrollable && 'overflow-auto',
                onClick && 'cursor-pointer',
                className
            )}
            style={{
                ...buildBoxStyle({
                    margin,
                    marginBottom,
                    marginLeft,
                    marginRight,
                    marginTop,
                    marginX,
                    marginY,
                    padding,
                    paddingBottom,
                    paddingLeft,
                    paddingRight,
                    paddingTop,
                    paddingX,
                    paddingY,
                }),
                ...style,
            }}
            onClick={onClick}
            {...otherProps}
        >
            {preventWidows ? preventWidowsFunction(children) : children}
        </Element>
    )
);

export default Box;
