import { useRef, useState } from 'react';

const useDrop = dataTypeHandlers => {
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
        Object.keys(dataTypeHandlers).map(dataType => {
            const data = evt.dataTransfer.getData(dataType);
            const payload =
                data.length === 0
                    ? null
                    : isNaN(data)
                    ? data
                    : parseFloat(data);

            if (payload !== null) {
                const dataTypeHandler = dataTypeHandlers[dataType];
                dataTypeHandler(payload, evt);
            }

            return dataType;
        });

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
