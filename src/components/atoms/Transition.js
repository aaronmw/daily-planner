import FlexBox from './FlexBox';
import { ROUTE_TRANSITION_ANIMATION_DURATION } from './tokens';
import cx from '../../utils/cx';

const Transition = ({ className, isTransitioning, style, ...otherProps }) => (
    <FlexBox
        align="stretch"
        direction="column"
        isFlexible
        className={cx('transition-opacity ease-in-out', className)}
        style={{
            opacity: isTransitioning ? 0 : 1,
            transitionDuration: `${ROUTE_TRANSITION_ANIMATION_DURATION / 2}ms`,
            ...style,
        }}
        {...otherProps}
    />
);

export default Transition;
