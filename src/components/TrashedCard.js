import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import random from 'lodash/random';
import FlexBox from './atoms/FlexBox';
import Icon from './atoms/Icon';
import { GRID_UNIT } from './atoms/tokens';

const animation = ({ minOpacity, translationDistance }) => keyframes`
    0% {
        transform: translateY(-${translationDistance}px);
        opacity: ${minOpacity};
    }
    100% {
        transform: translateY(${translationDistance}px);
        opacity: 1;
    }
`;

const Container = styled.div(
    () => css`
        animation-direction: alternate;
        animation-duration: ${random(300, 400)}ms;
        animation-iteration-count: infinite;
        animation-name: ${animation({
            translationDistance: random(0.5, 2),
            minOpacity: random(0.75, 0.9),
        })};
        animation-timing-function: ease-in-out;
        position: relative;

        & > * {
            width: auto;
        }
    `
);

const RestoreButton = styled(FlexBox).attrs({
    align: 'center',
    justify: 'center',
    padding: 0.25,
})(
    ({ theme }) => `
        background-color: ${theme.HIGH_CONTRAST_TEXT};
        border: 2px solid ${theme.HIGH_CONTRAST_BACKGROUND};
        border-radius: 100px;
        color: ${theme.HIGH_CONTRAST_BACKGROUND};
        cursor: pointer;
        height: calc(${GRID_UNIT});
        position: absolute;
        right: 0;
        top: 0;
        transform: translate(50%, -50%);
        width: calc(${GRID_UNIT});
        z-index: 1000;
        
        &:hover {
            background-color: ${theme.HIGH_CONTRAST_BACKGROUND};
            color: ${theme.HIGH_CONTRAST_TEXT};
        }
    `
);

const TrashedCard = ({
    children,
    restoreButtonTitle,
    onRestore,
    ...otherProps
}) => {
    return (
        <Container {...otherProps}>
            <RestoreButton title={restoreButtonTitle} onClick={onRestore}>
                <Icon iconName="reply" />
            </RestoreButton>
            {children}
        </Container>
    );
};

export default TrashedCard;
