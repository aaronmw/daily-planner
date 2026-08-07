import React from 'react';

const Icon = ({ iconName, ...otherProps }) => (
    <i className={`fa-solid fa-${iconName}`} {...otherProps} />
);

export default Icon;
