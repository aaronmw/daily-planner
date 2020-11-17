import { useState } from 'react';

const useDrop = (type, callback = () => {}) => {
    const [isTargetedForDrop, setIsTargetedForDrop] = useState(false);

    const onDragEnter = evt => {
        evt.preventDefault();
        setIsTargetedForDrop(true);
    };

    const onDragOver = evt => {
        evt.preventDefault();
        setIsTargetedForDrop(true);
    };

    const onDragLeave = () => {
        setIsTargetedForDrop(false);
    };

    const onDrop = evt => {
        const payload = evt.dataTransfer.getData(type);
        if (payload) {
            callback(isNaN(payload) ? payload : parseFloat(payload));
        }
        setIsTargetedForDrop(false);
    };

    const dropProps = {
        isTargetedForDrop,
        droppable: true,
        onDragEnter,
        onDragOver,
        onDragLeave,
        onDrop,
    };

    return [dropProps];
};

export default useDrop;
