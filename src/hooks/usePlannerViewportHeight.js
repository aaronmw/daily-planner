import { useEffect, useState } from 'react';
import { GRID_UNIT } from '../components/atoms/tokens';

const getPlannerViewportHeight = () =>
    typeof window === 'undefined'
        ? 0
        : Math.max(0, window.innerHeight - Number.parseFloat(GRID_UNIT));

const usePlannerViewportHeight = () => {
    const [viewportHeight, setViewportHeight] = useState(0);

    useEffect(() => {
        const updateViewportHeight = () =>
            setViewportHeight(getPlannerViewportHeight());
        const viewport = window.visualViewport;

        updateViewportHeight();
        window.addEventListener('resize', updateViewportHeight);
        viewport?.addEventListener('resize', updateViewportHeight);

        return () => {
            window.removeEventListener('resize', updateViewportHeight);
            viewport?.removeEventListener('resize', updateViewportHeight);
        };
    }, []);

    return viewportHeight;
};

export default usePlannerViewportHeight;
