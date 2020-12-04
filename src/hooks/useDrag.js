import { useState } from 'react';

const useDrag = dataTypes => {
    const [isDragging, setIsDragging] = useState(false);

    const onDragEnd = () => {
        setIsDragging(false);
    };

    const onDragStart = evt => {
        if (
            ['input', 'textarea'].includes(
                document.activeElement.tagName.toLowerCase()
            )
        ) {
            evt.preventDefault();
            return;
        }

        Object.keys(dataTypes).map(dataType => {
            evt.dataTransfer.setData(dataType, dataTypes[dataType]);
            return dataType;
        });

        setIsDragging(true);
    };

    const dragProps = {
        draggable: true,
        isDragging,
        onDragEnd,
        onDragStart,
    };

    return [dragProps];
};

export default useDrag;
