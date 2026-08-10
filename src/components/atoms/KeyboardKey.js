import React from 'react';
import cx from '../../utils/cx';

const KeyboardKey = ({ className, isIcon = false, label, ...otherProps }) => (
    <kbd className={cx('planner-keyboard-key', className)} {...otherProps}>
        <span
            className="planner-keyboard-key-face"
            data-icon={isIcon ? 'true' : undefined}
        >
            {label}
        </span>
    </kbd>
);

export default KeyboardKey;
