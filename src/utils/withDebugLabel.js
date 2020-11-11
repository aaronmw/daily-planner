export const withDebugLabel = (Component, label = false) => {
    Component.defaultProps = {
        ...Component.defaultProps,
        'data-debug-label': label ? label : Component.name,
    };

    return Component;
};
