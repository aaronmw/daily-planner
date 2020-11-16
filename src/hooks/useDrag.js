import { useState } from 'react';

export default (type, payload) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const onDragStart = evt => {
        evt.dataTransfer.setData(type, payload);
        setIsDragging(true);
    };

    const onDragEnd = () => {
        setIsDragging(false);
        setIsDraggingOver(false);
    };

    const onDragEnter = () => setIsDraggingOver(true);

    const onDragLeave = () => setIsDraggingOver(false);

    const dragProps = {
        draggable: true,
        isDragging,
        isDraggingOver,
        onDragEnd,
        onDragEnter,
        onDragLeave,
        onDragStart,
    };

    return [dragProps];
};
