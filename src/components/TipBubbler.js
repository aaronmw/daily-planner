import sample from 'lodash/sample';
import React from 'react';
import Box from './atoms/Box';
import { ToggleButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import { COPY, FONTS, ICONS } from './atoms/tokens';

const TipBubbler = ({ ...props }) => {
    const currentTip = sample(COPY.TIPS);

    return (
        <FlexBox
            align="flex-start"
            justify="stretch"
            paddingX={1}
            paddingY={0.5}
            spacing={0.5}
            className="fixed bottom-[var(--spacing-grid)] right-[calc(var(--spacing-grid)*4)] z-[100] w-[450px] rounded-planner bg-planner-contrast text-planner-contrast-text"
            style={{
                fontSize: FONTS.LARGE.SIZE,
                lineHeight: FONTS.LARGE.LINE_HEIGHT,
            }}
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
        </FlexBox>
    );
};

export default TipBubbler;
