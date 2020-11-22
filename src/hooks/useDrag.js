import { useState } from 'react';

export default (type, payload) => {
    const [isDragging, setIsDragging] = useState(false);

    const onDragEnd = () => {
        setIsDragging(false);
    };

    const onDragStart = evt => {
        evt.dataTransfer.setData(type, payload);
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
