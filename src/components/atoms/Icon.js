import React from 'react';

const STYLE_PREFIX_MAP = {
    solid: 'fas',
    regular: 'far',
    light: 'fal',
    duotone: 'fad',
    brands: 'fab',
};

const Icon = ({ iconName, styleName = 'solid', ...otherProps }) => (
    <i
        className={`${STYLE_PREFIX_MAP[styleName]} fa-${iconName}`}
        {...otherProps}
    />
);

export default Icon;
