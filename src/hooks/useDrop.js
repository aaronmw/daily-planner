import { useRef, useState } from 'react';

const useDrop = (type, callback = () => {}) => {
    const [isTargetedForDrop, setIsTargetedForDrop] = useState(false);
    const targetedElement = useRef(null);

    const onDragEnter = evt => {
        evt.preventDefault();
        targetedElement.current = evt.target;
        if (!isTargetedForDrop) {
            setIsTargetedForDrop(true);
        }
    };

    const onDragOver = evt => {
        evt.preventDefault();
    };

    const onDragLeave = evt => {
        if (evt.target === targetedElement.current) {
            setIsTargetedForDrop(false);
        }
    };

    const onDrop = evt => {
        const payload = evt.dataTransfer.getData(type);
        if (payload) {
            callback(isNaN(payload) ? payload : parseFloat(payload), evt);
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
