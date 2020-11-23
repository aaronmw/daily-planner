import React from 'react';
import styled from 'styled-components';
import FlexBox from './FlexBox';
import {
    ROUTE_TRANSITION_ANIMATION_DURATION,
    UNIFIED_TRANSITION,
} from './tokens';

const Transition = styled(FlexBox).attrs({
    align: 'stretch',
    direction: 'column',
    isFlexible: true,
})(
    ({ isTransitioning }) => `
        opacity: ${isTransitioning ? 0 : 1};
        ${UNIFIED_TRANSITION};
        transition-duration: ${ROUTE_TRANSITION_ANIMATION_DURATION / 2}ms;
    `
);

export default Transition;
