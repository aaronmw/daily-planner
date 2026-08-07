import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

const useDrag = dataTypes => {
    const [isDragging, setIsDragging] = useState(false);
    const dataTypesRef = useRef(dataTypes);

    useLayoutEffect(() => {
        dataTypesRef.current = dataTypes;
    }, [dataTypes]);

    const onDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    const onDragStart = useCallback(evt => {
        if (
            ['input', 'textarea'].includes(
                document.activeElement.tagName.toLowerCase()
            )
        ) {
            evt.preventDefault();
            return;
        }

        Object.keys(dataTypesRef.current).forEach(dataType => {
            evt.dataTransfer.setData(dataType, dataTypesRef.current[dataType]);
        });

        setIsDragging(true);
    }, []);

    const dragProps = useMemo(() => {
        const props = {
            draggable: true,
            onDragEnd,
            onDragStart,
        };

        Object.defineProperty(props, 'isDragging', {
            enumerable: false,
            value: isDragging,
        });

        return props;
    }, [isDragging, onDragEnd, onDragStart]);

    return [dragProps];
};

export default useDrag;
