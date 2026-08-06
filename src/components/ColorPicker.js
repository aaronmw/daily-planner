import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Box from './atoms/Box';
import { ToggleButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import { ACCENT_SWATCHES, ICONS } from './atoms/tokens';
import cx from '../utils/cx';

const Container = ({ className, ...otherProps }) => (
    <FlexBox
        align="center"
        justify="flex-end"
        paddingX={0.25}
        paddingY={0.25}
        className={className}
        {...otherProps}
    />
);

const ClientPortal = ({ children, portalRoot }) => {
    return portalRoot ? ReactDOM.createPortal(children, portalRoot) : null;
};

const WindowShader = ({ children, portalRoot, ...otherProps }) => {
    return (
        <ClientPortal portalRoot={portalRoot}>
            <div className="fixed inset-0 z-[1099]" {...otherProps}>
                {children}
            </div>
        </ClientPortal>
    );
};

const ColorPaletteContainer = ({ children, portalRoot, ...otherProps }) => {
    return (
        <ClientPortal portalRoot={portalRoot}>
            <FlexBox
                isRounded
                paddingX={0.5}
                paddingY={0.5}
                spacing={0.5}
                className="fixed left-1/2 top-1/2 z-[1100] bg-planner-background shadow-[0_0_10px_10px_var(--planner-shadow)] -translate-x-1/2 -translate-y-1/2"
                {...otherProps}
            >
                {children}
            </FlexBox>
        </ClientPortal>
    );
};

const ColorChip = ({ className, isSelected, ...otherProps }) => (
    <Box
        isFlexible
        className={cx(
            'h-[calc(var(--spacing-grid)*2)] w-[calc(var(--spacing-grid)*2)] rounded-planner transition-transform duration-150 ease-in-out hover:scale-110',
            isSelected && 'shadow-[0_0_0_2px_var(--planner-text)]',
            className
        )}
        {...otherProps}
    />
);

const ColorPicker = ({ accentKey, onPickColor, ...otherProps }) => {
    const [isPickingColor, setIsPickingColor] = useState(false);
    const [portalRoot, setPortalRoot] = useState(null);

    const showPicker = () => {
        setPortalRoot(document.body);
        setIsPickingColor(true);
    };

    const hidePicker = () => {
        setIsPickingColor(false);
        setPortalRoot(null);
    };

    return (
        <Container {...otherProps}>
            <ToggleButton isInverted={!isPickingColor} onClick={showPicker}>
                {ICONS.COLOR_PICKER}
            </ToggleButton>
            {isPickingColor && (
                <>
                    <ColorPaletteContainer portalRoot={portalRoot}>
                        {ACCENT_SWATCHES.map(swatch => {
                            return (
                                <ColorChip
                                    key={swatch.key}
                                    isSelected={accentKey === swatch.key}
                                    title={swatch.label}
                                    style={{
                                        backgroundColor: swatch.value,
                                    }}
                                    onClick={onPickColor.bind(null, swatch.key)}
                                />
                            );
                        })}
                    </ColorPaletteContainer>
                    <WindowShader
                        portalRoot={portalRoot}
                        onClick={hidePicker}
                    />
                </>
            )}
        </Container>
    );
};

export default ColorPicker;
