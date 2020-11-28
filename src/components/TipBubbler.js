import sample from 'lodash/sample';
import React from 'react';
import styled from 'styled-components';
import Box from './atoms/Box';
import { ToggleButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import {
    BORDER_RADIUS,
    COLORS,
    COPY,
    FONTS,
    GRID_UNIT,
    ICONS,
} from './atoms/tokens';

const Container = styled(FlexBox)(
    ({ theme }) => `
        background-color: ${COLORS[theme.name].HIGH_CONTRAST_BACKGROUND};
        border-radius: ${BORDER_RADIUS};
        bottom: ${GRID_UNIT};
        color: ${COLORS[theme.name].HIGH_CONTRAST_TEXT};
        font-size: ${FONTS.LARGE.SIZE};
        line-height: ${FONTS.LARGE.LINE_HEIGHT};
        position: fixed;
        right: calc(${GRID_UNIT} * 4);
        width: 450px;
        z-index: 100;
    `
);

const TipBubbler = ({ ...props }) => {
    const currentTip = sample(COPY.TIPS);

    return (
        <Container
            align="flex-start"
            justify="stretch"
            paddingX={1}
            paddingY={0.5}
            spacing={0.5}
            {...props}
        >
            <Box>{ICONS.TIP}</Box>
            <Box isFlexible preventWidows>
                {currentTip}
            </Box>
            <FlexBox
                align="flex-end"
                direction="column"
                justify="space-between"
                spacing={0.25}
            >
                <ToggleButton>{ICONS.LEFT}</ToggleButton>
                <ToggleButton>{ICONS.RIGHT}</ToggleButton>
            </FlexBox>
        </Container>
    );
};

export default TipBubbler;
