import React, { forwardRef } from 'react';
import Box from './Box';
import cx from '../../utils/cx';

const toGridValue = value =>
    typeof value === 'number' ? `calc(${value} * var(--spacing-grid))` : value;

const FlexBox = forwardRef(
    (
        {
            align = 'center',
            className,
            direction = 'row',
            justify = 'stretch',
            spacing = 0,
            wrapped = false,
            style,
            ...otherProps
        },
        ref
    ) => (
        <Box
            ref={ref}
            className={cx('flex', className)}
            style={{
                alignContent: wrapped ? align : undefined,
                alignItems: align,
                flexDirection: direction,
                flexWrap: wrapped ? 'wrap' : 'nowrap',
                gap: spacing ? toGridValue(spacing) : undefined,
                justifyContent: justify,
                ...style,
            }}
            {...otherProps}
        />
    )
);

export default FlexBox;
