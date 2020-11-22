import React from 'react';
import styled from 'styled-components';
import sortBy from 'lodash/sortBy';
import { GhostButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import { BORDER_RADIUS, COLORS, COPY, FONTS, GRID_UNIT } from './atoms/tokens';
import EditInPlace from './EditInPlace';

const LIST_HEIGHT = `calc(${GRID_UNIT} * 8)`;
const LIST_WIDTH = `calc((100% * 0.5) - (${GRID_UNIT} * 0.5))`;

const Container = styled(FlexBox).attrs({
    align: 'flex-start',
    justify: 'flex-start',
    padding: 1,
    wrapped: true,
})(
    ({ theme }) => `
        align-content: flex-start;
        background-color: ${COLORS[theme.name].SHADED};
        height: 100%;
        overflow: auto;
        padding-bottom: calc(${GRID_UNIT} * 1.5);
    `
);

const ListCard = styled(FlexBox).attrs({
    align: 'flex-start',
    justify: 'flex-start',
    paddingX: 0.75,
    paddingY: 0.5,
})(
    ({ theme }) => `
        background-color: ${COLORS[theme.name].HIGH_CONTRAST_BACKGROUND};
        border-radius: ${BORDER_RADIUS};
        color: ${COLORS[theme.name].HIGH_CONTRAST_TEXT};
        cursor: pointer;
        height: ${LIST_HEIGHT};
        margin-bottom: ${GRID_UNIT};
        width: ${LIST_WIDTH};
        
        &:nth-child(even) {
            margin-left: ${GRID_UNIT};
        }
    `
);

const GhostListCard = styled(GhostButton).attrs({
    align: 'center',
    justify: 'center',
})(
    ({ theme }) => `
        height: ${LIST_HEIGHT};
        margin-bottom: ${GRID_UNIT};
        width: ${LIST_WIDTH};
    `
);

const ListManager = ({ appActions, appData }) => {
    const { onCreateList, onSelectList, onUpdateList } = appActions;
    const { isCreatingList, lists, selectedListId } = appData;
    const sortedLists = sortBy(lists, [list => list.label]);

    const tracingElementStyles = theme => `
        border-color: ${COLORS[theme.name].HIGH_CONTRAST_TEXT}
    `;

    return (
        <Container>
            <GhostListCard onClick={() => onCreateList()}>
                {COPY.CREATE_LIST_LABEL}
            </GhostListCard>
            {sortedLists.map(list => {
                return (
                    <ListCard
                        key={list.id}
                        isActive={selectedListId === list.id}
                        onClick={() => onSelectList(list.id)}
                    >
                        <EditInPlace
                            isRemotelyActivated={
                                isCreatingList && selectedListId === list.id
                            }
                            tracingElementStyles={tracingElementStyles}
                            value={list.label}
                            onSave={newLabel => {
                                onUpdateList(list.id, { label: newLabel });
                            }}
                        />
                    </ListCard>
                );
            })}
        </Container>
    );
};

export default ListManager;
