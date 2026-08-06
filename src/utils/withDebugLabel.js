import React from 'react';

export const withDebugLabel = (Component, label = false) => {
    const debugLabel = label || Component.displayName || Component.name;

    const DebugLabeledComponent = props => {
        return <Component data-debug-label={debugLabel} {...props} />;
    };

    DebugLabeledComponent.displayName = `WithDebugLabel(${debugLabel})`;

    return DebugLabeledComponent;
};
