import { useEffect, useState } from 'react';

const EMPTY_RECT = { height: 0, width: 0 };

const useElementRect = elementRef => {
    const [rect, setRect] = useState(EMPTY_RECT);

    useEffect(() => {
        const element = elementRef.current;

        if (!element) {
            return undefined;
        }

        const updateRect = entry => {
            const nextRect =
                entry?.contentRect || element.getBoundingClientRect();
            setRect({ height: nextRect.height, width: nextRect.width });
        };
        const observer = new ResizeObserver(entries => updateRect(entries[0]));

        updateRect();
        observer.observe(element);

        return () => observer.disconnect();
    }, [elementRef]);

    return rect;
};

export default useElementRect;
