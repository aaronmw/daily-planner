import styled from 'styled-components';
import FlexBox from './atoms/FlexBox';
import { COLORS, GRID_UNIT } from './atoms/tokens';

const ToolBar = styled(FlexBox).attrs({
    align: 'center',
    justify: 'space-between',
    paddingX: 1,
    spacing: 0.5,
})(
    ({ theme }) => `
        background-color: ${COLORS[theme.name].BACKGROUND};
        color: ${COLORS[theme.name].TEXT_FADED};
        height: calc(${GRID_UNIT} * 1.5);
        width: 100%;
        z-index: 10;
        
        &:focus-within,
        &:hover {
            color: ${COLORS[theme.name].TEXT};
        }
    `
);

export default ToolBar;
