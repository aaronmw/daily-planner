import {
    forwardRef,
    type ButtonHTMLAttributes,
    type ForwardedRef,
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

type GhostButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

interface TracerSize {
    height: number;
    radius: number;
    width: number;
}

const setForwardedRef = (
    ref: ForwardedRef<HTMLButtonElement>,
    element: HTMLButtonElement | null
) => {
    if (typeof ref === 'function') {
        ref(element);
    } else if (ref) {
        ref.current = element;
    }
};

export const GhostButton = forwardRef<HTMLButtonElement, GhostButtonProps>(
    function GhostButton(
        { children, className = '', type = 'button', ...buttonProps },
        forwardedRef
    ) {
        const buttonRef = useRef<HTMLButtonElement | null>(null);
        const [size, setSize] = useState<TracerSize>({
            height: 0,
            radius: 0,
            width: 0,
        });
        const assignRef = useCallback(
            (element: HTMLButtonElement | null) => {
                buttonRef.current = element;
                setForwardedRef(forwardedRef, element);
            },
            [forwardedRef]
        );

        useLayoutEffect(() => {
            const element = buttonRef.current;
            if (!element) return;

            const measure = () => {
                const styles = getComputedStyle(element);
                const nextSize = {
                    height: element.offsetHeight,
                    radius: Number.parseFloat(styles.borderTopLeftRadius) || 0,
                    width: element.offsetWidth,
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
            observer.observe(element);
            return () => observer.disconnect();
        }, []);

        return (
            <button
                {...buttonProps}
                className={`planner-ghost-button ${className}`}
                ref={assignRef}
                type={type}
            >
                <svg
                    aria-hidden="true"
                    className="planner-ghost-tracer-frame"
                    preserveAspectRatio="none"
                    viewBox={`0 0 ${size.width} ${size.height}`}
                >
                    <rect
                        className="planner-ghost-tracer"
                        height={size.height}
                        rx={size.radius}
                        width={size.width}
                        x="0"
                        y="0"
                    />
                </svg>
                <span className="relative z-10">{children}</span>
            </button>
        );
    }
);
