import FlexBox from './atoms/FlexBox';
import cx from '../utils/cx';

const ToolBar = ({ className, isCollapsed = false, ...otherProps }) => (
    <FlexBox
        align="center"
        justify={isCollapsed ? 'center' : 'space-between'}
        paddingX={isCollapsed ? 0 : 0.5}
        spacing={0.5}
        className={cx('planner-toolbar', className)}
        {...otherProps}
    />
);

export default ToolBar;
