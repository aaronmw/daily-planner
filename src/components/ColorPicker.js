import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import Box from './atoms/Box';
import { ToggleButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import {
    COLOR_PICKER_HEIGHT,
    COLOR_PICKER_WIDTH,
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

const StyledColorPaletteContainer = styled(Box).attrs({
    isRounded: true,
    paddingX: 1,
    paddingY: 1,
})(
    ({ theme }) => `
        background-color: ${theme.BACKGROUND};
        display: grid;
        gap: calc(${GRID_UNIT} * 0.25);
        grid-template-columns: 1fr 1fr 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr;
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 1100;
        width: ${COLOR_PICKER_WIDTH};
        height: ${COLOR_PICKER_HEIGHT};
        
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

const ColorChip = styled(Box).attrs({})`
    border-radius: 400px;
    transform: scale(1);
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
