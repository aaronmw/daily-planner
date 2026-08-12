import { useLayoutEffect, useRef, useState } from 'react';

interface MarchingAntsSize {
    height: number;
    radius: number;
    width: number;
}

export function MarchingAnts({ className = '' }: { className?: string }) {
    const frameRef = useRef<SVGSVGElement>(null);
    const [size, setSize] = useState<MarchingAntsSize>({
        height: 0,
        radius: 0,
        width: 0,
    });

    useLayoutEffect(() => {
        const frame = frameRef.current;
        const surface = frame?.parentElement;
        if (!frame || !surface) return;

        const measure = () => {
            const bounds = frame.getBoundingClientRect();
            const styles = getComputedStyle(surface);
            const nextSize = {
                height: bounds.height,
                radius: Number.parseFloat(styles.borderTopLeftRadius) || 0,
                width: bounds.width,
            };
            setSize(current =>
                current.height === nextSize.height &&
                current.radius === nextSize.radius &&
                current.width === nextSize.width
                    ? current
                    : nextSize
            );
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(frame);
        return () => observer.disconnect();
    }, []);

    return (
        <svg
            aria-hidden="true"
            className={`planner-marching-ants-frame ${className}`}
            preserveAspectRatio="none"
            ref={frameRef}
            viewBox={`0 0 ${size.width} ${size.height}`}
        >
            <rect
                className="planner-marching-ants"
                height={size.height}
                rx={size.radius}
                width={size.width}
                x="0"
                y="0"
            />
        </svg>
    );
}
