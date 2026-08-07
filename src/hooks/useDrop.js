import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

const onDragOver = evt => {
    evt.preventDefault();
};

const useDrop = dataTypeHandlers => {
    const [isTargetedForDrop, setIsTargetedForDrop] = useState(false);
    const dataTypeHandlersRef = useRef(dataTypeHandlers);
    const targetedElement = useRef(null);

    useLayoutEffect(() => {
        dataTypeHandlersRef.current = dataTypeHandlers;
    }, [dataTypeHandlers]);

    const onDragEnter = useCallback(evt => {
        evt.preventDefault();
        targetedElement.current = evt.target;
        setIsTargetedForDrop(true);
    }, []);

    const onDragLeave = useCallback(evt => {
        if (evt.target === targetedElement.current) {
            setIsTargetedForDrop(false);
        }
    }, []);

    const onDrop = useCallback(evt => {
        Object.keys(dataTypeHandlersRef.current).forEach(dataType => {
            const data = evt.dataTransfer.getData(dataType);
            const payload =
                data.length === 0
                    ? null
                    : isNaN(data)
                      ? data
                      : parseFloat(data);

            if (payload !== null) {
                const dataTypeHandler = dataTypeHandlersRef.current[dataType];
                dataTypeHandler(payload, evt);
            }
        });

        setIsTargetedForDrop(false);
    }, []);

    const dropProps = useMemo(() => {
        const props = {
            'data-droppable': true,
            onDragEnter,
            onDragOver,
            onDragLeave,
            onDrop,
        };

        Object.defineProperty(props, 'isTargetedForDrop', {
            enumerable: false,
            value: isTargetedForDrop,
        });

        return props;
    }, [isTargetedForDrop, onDragEnter, onDragLeave, onDrop]);

    return [dropProps];
};

export default useDrop;
