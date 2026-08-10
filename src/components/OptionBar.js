import React from 'react';
import Button from './atoms/Button';
import cx from '../utils/cx';
import ToolBar from './ToolBar';

const OptionButton = ({ className, isSelected, ...otherProps }) => (
    <Button
        className={cx('planner-option-button', className)}
        data-selected={isSelected}
        {...otherProps}
    />
);

const OptionBar = ({
    disabled = false,
    options,
    renderOption = option => option,
    renderSelectedOption = option => option,
    selectedOption,
    onChange,
    ...otherProps
}) => (
    <ToolBar {...otherProps}>
        {options.map((option, optionIndex) => {
            const isSelected = option === selectedOption;

            return (
                <OptionButton
                    disabled={disabled}
                    key={option}
                    isSelected={isSelected}
                    onClick={() => onChange(option)}
                >
                    {isSelected
                        ? renderSelectedOption(
                              renderOption(option, optionIndex),
                              optionIndex
                          )
                        : renderOption(option, optionIndex)}
                </OptionButton>
            );
        })}
    </ToolBar>
);

export default OptionBar;
