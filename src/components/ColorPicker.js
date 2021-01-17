import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import Box from './atoms/Box';
import { ToggleButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import {
    BORDER_RADIUS,
    GRID_UNIT,
    ICONS,
    PRIMARY_COLORS,
    UNIFIED_TRANSITION,
} from './atoms/tokens';

const Container = styled(FlexBox).attrs({
    align: 'center',
    justify: 'flex-end',
    paddingX: 0.25,
    paddingY: 0.25,
})``;

const StyledWindowShader = styled.div`
    bottom: 0;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 1099;
`;

const WindowShader = ({ children, ...otherProps }) => {
    return ReactDOM.createPortal(
        <StyledWindowShader {...otherProps}>{children}</StyledWindowShader>,
        document.body
    );
};

const StyledColorPaletteContainer = styled(FlexBox).attrs({
    isRounded: true,
    paddingX: 0.5,
    paddingY: 0.5,
    spacing: 0.5,
})(
    ({ theme }) => `
        background-color: ${theme.BACKGROUND};
        box-shadow: 0 0 10px 10px ${theme.SHADOW};
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 1100;

        &:before {
            background-color: ${theme.SHADOW};
            position: fixed;
            width: 100vw;
            height: 100vh;
        }
    `
);

const ColorPaletteContainer = ({ children, ...otherProps }) => {
    return ReactDOM.createPortal(
        <StyledColorPaletteContainer {...otherProps}>
            {children}
        </StyledColorPaletteContainer>,
        document.body
    );
};

const ColorChip = styled(Box).attrs({ isFlexible: true })`
    border-radius: ${BORDER_RADIUS};
    height: calc(${GRID_UNIT} * 2);
    transform: scale(1);
    width: calc(${GRID_UNIT} * 2);
    ${UNIFIED_TRANSITION};

    &:hover {
        transform: scale(1.1);
    }
`;

const ColorPicker = ({ palette, onPickColor, ...otherProps }) => {
    const [isPickingColor, setIsPickingColor] = useState(false);

    const showPicker = () => {
        setIsPickingColor(true);
    };

    const hidePicker = () => {
        setIsPickingColor(false);
    };

    return (
        <Container {...otherProps}>
            <ToggleButton isInverted={!isPickingColor} onClick={showPicker}>
                {ICONS.COLOR_PICKER}
            </ToggleButton>
            {isPickingColor && (
                <>
                    <ColorPaletteContainer>
                        {PRIMARY_COLORS.map(color => {
                            return (
                                <ColorChip
                                    key={color}
                                    style={{
                                        backgroundColor: color,
                                    }}
                                    onClick={onPickColor.bind(null, color)}
                                />
                            );
                        })}
                    </ColorPaletteContainer>
                    <WindowShader onClick={hidePicker} />
                </>
            )}
        </Container>
    );
};

export default styled(ColorPicker)``;
