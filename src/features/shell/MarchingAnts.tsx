import { useLayoutEffect, useRef, useState } from 'react';

interface MarchingAntsSize {
    height: number;
    radius: number;
    strokeInset: number;
    width: number;
}

export function MarchingAnts({ className = '' }: { className?: string }) {
    const frameRef = useRef<SVGSVGElement>(null);
    const [size, setSize] = useState<MarchingAntsSize>({
        height: 0,
        radius: 0,
        strokeInset: 0,
        width: 0,
    });

    useLayoutEffect(() => {
        const frame = frameRef.current;
        const surface = frame?.parentElement;
        if (!frame || !surface) return;

        const measure = () => {
            const bounds = frame.getBoundingClientRect();
            const styles = getComputedStyle(surface);
            const strokeInset =
                (Number.parseFloat(
                    styles.getPropertyValue('--planner-stroke-width')
                ) || 0) / 2;
            const nextSize = {
                height: bounds.height,
                radius: Math.max(
                    0,
                    (Number.parseFloat(styles.borderTopLeftRadius) || 0) -
                        strokeInset
                ),
                strokeInset,
                width: bounds.width,
            };
            setSize(current =>
                current.height === nextSize.height &&
                current.radius === nextSize.radius &&
                current.strokeInset === nextSize.strokeInset &&
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
                height={Math.max(0, size.height - size.strokeInset * 2)}
                rx={size.radius}
                width={Math.max(0, size.width - size.strokeInset * 2)}
                x={size.strokeInset}
                y={size.strokeInset}
            />
        </svg>
    );
}
