import styled from 'styled-components';
import FlexBox from './atoms/FlexBox';
import { GRID_UNIT } from './atoms/tokens';

const ToolBar = styled(FlexBox).attrs(({ isCollapsed = false }) => ({
    align: 'center',
    justify: isCollapsed ? 'center' : 'space-between',
    paddingX: isCollapsed ? 0 : 0.5,
    spacing: 0.5,
}))(
    ({ theme }) => `
        background-color: ${theme.BACKGROUND};
        color: ${theme.TEXT_FADED};
        height: calc(${GRID_UNIT} * 1.5);
        width: 100%;
        z-index: 10;
        
        &:focus-within,
        &:hover {
            color: ${theme.TEXT};
        }
    `
);

export default ToolBar;
