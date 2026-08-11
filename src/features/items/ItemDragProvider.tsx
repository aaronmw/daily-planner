import {
    createContext,
    type PropsWithChildren,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ItemId } from '../../core/domain/ids';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { hasCrossedItemDragThreshold } from './itemDragSession';
import {
    areActiveItemDropsEqual,
    resolveRegisteredItemDrop,
    type ActiveItemDrop,
    type ItemDropTarget,
} from './itemDropTargets';

interface PointerDrag {
    active: boolean;
    ghost: HTMLElement | null;
    grabOffsetX: number;
    grabOffsetY: number;
    grabRatioY: number;
    id: ItemId;
    pointerId: number;
    source: HTMLElement;
    startX: number;
    startY: number;
}

interface ItemDragContextValue {
    activeDrop: ActiveItemDrop | null;
    activeItemId: ItemId | null;
    registerDropTarget: (target: ItemDropTarget) => () => void;
}

const ItemDragContext = createContext<ItemDragContextValue | null>(null);

const positionDragGhost = (
    ghost: HTMLElement,
    clientX: number,
    clientY: number,
    grabOffsetX: number,
    grabOffsetY: number
) => {
    ghost.style.transform = `translate3d(${clientX - grabOffsetX}px, ${clientY - grabOffsetY}px, 0)`;
};

const createDragGhost = (
    source: HTMLElement,
    bounds: DOMRect,
    clientX: number,
    clientY: number,
    grabOffsetX: number,
    grabOffsetY: number
): HTMLElement => {
    const ghost = source.cloneNode(true) as HTMLElement;
    ghost.classList.add('planner-item-card-drag-ghost');
    ghost.dataset.active = 'false';
    ghost.dataset.pointerDragGhost = 'true';
    ghost.removeAttribute('data-item-id');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.setAttribute('inert', '');
    ghost.setAttribute('tabindex', '-1');
    ghost.style.height = `${bounds.height}px`;
    ghost.style.width = `${bounds.width}px`;
    positionDragGhost(ghost, clientX, clientY, grabOffsetX, grabOffsetY);
    (source.closest('.planner-root') ?? document.body).append(ghost);
    return ghost;
};

export function ItemDragProvider({ children }: PropsWithChildren): ReactNode {
    const itemsById = usePlannerSelector(state => state.itemsById);
    const targetsRef = useRef(new Map<string, ItemDropTarget>());
    const activeDropRef = useRef<ActiveItemDrop | null>(null);
    const [activeDrop, setActiveDrop] = useState<ActiveItemDrop | null>(null);
    const [activeItemId, setActiveItemId] = useState<ItemId | null>(null);

    const registerDropTarget = useCallback((target: ItemDropTarget) => {
        targetsRef.current.set(target.id, target);
        return () => {
            if (targetsRef.current.get(target.id) === target) {
                targetsRef.current.delete(target.id);
            }
        };
    }, []);

    useEffect(() => {
        let drag: PointerDrag | null = null;
        let clickSuppressionTimer: number | null = null;
        let suppressClickFrom: HTMLElement | null = null;

        const resetDrag = (updateReactState = true) => {
            const currentDrag = drag;
            drag = null;
            currentDrag?.ghost?.remove();
            if (currentDrag) {
                delete currentDrag.source.dataset.pointerDragging;
                if (
                    currentDrag.source.hasPointerCapture(currentDrag.pointerId)
                ) {
                    currentDrag.source.releasePointerCapture(
                        currentDrag.pointerId
                    );
                }
            }
            delete document.documentElement.dataset.itemDragging;
            activeDropRef.current = null;
            if (updateReactState) {
                setActiveItemId(null);
                setActiveDrop(null);
            }
        };

        const handlePointerDown = (event: PointerEvent) => {
            if (!event.isPrimary || event.button !== 0 || drag) return;
            const target = event.target;
            const card =
                target instanceof Element
                    ? target.closest<HTMLElement>(
                          '[data-item-id][data-draggable="true"]'
                      )
                    : null;
            const rawId = card?.dataset.itemId;
            if (!rawId) return;

            const bounds = card.getBoundingClientRect();
            drag = {
                active: false,
                ghost: null,
                grabOffsetX: event.clientX - bounds.left,
                grabOffsetY: event.clientY - bounds.top,
                grabRatioY:
                    bounds.height > 0
                        ? Math.max(
                              0,
                              Math.min(
                                  1,
                                  (event.clientY - bounds.top) / bounds.height
                              )
                          )
                        : 0,
                id: rawId as ItemId,
                pointerId: event.pointerId,
                source: card,
                startX: event.clientX,
                startY: event.clientY,
            };
            try {
                card.setPointerCapture(event.pointerId);
            } catch {
                // Document listeners still keep the drag functional when
                // pointer capture is unavailable in an older webview.
            }
        };

        const handlePointerMove = (event: PointerEvent) => {
            const currentDrag = drag;
            if (event.pointerId !== currentDrag?.pointerId) {
                return;
            }

            if (
                !currentDrag.active &&
                !hasCrossedItemDragThreshold(
                    currentDrag.startX,
                    currentDrag.startY,
                    event.clientX,
                    event.clientY
                )
            ) {
                return;
            }

            if (!currentDrag.active) {
                const bounds = currentDrag.source.getBoundingClientRect();
                currentDrag.active = true;
                currentDrag.ghost = createDragGhost(
                    currentDrag.source,
                    bounds,
                    event.clientX,
                    event.clientY,
                    currentDrag.grabOffsetX,
                    currentDrag.grabOffsetY
                );
                currentDrag.source.dataset.pointerDragging = 'true';
                document.documentElement.dataset.itemDragging = 'true';
                setActiveItemId(currentDrag.id);
            } else if (currentDrag.ghost) {
                positionDragGhost(
                    currentDrag.ghost,
                    event.clientX,
                    event.clientY,
                    currentDrag.grabOffsetX,
                    currentDrag.grabOffsetY
                );
            }

            event.preventDefault();
            const item = itemsById.get(currentDrag.id);
            const nextDrop = item
                ? resolveRegisteredItemDrop(
                      Array.from(targetsRef.current.values()),
                      {
                          clientX: event.clientX,
                          clientY: event.clientY,
                          grabRatioY: currentDrag.grabRatioY,
                      },
                      item
                  )
                : null;
            activeDropRef.current = nextDrop;
            setActiveDrop(current =>
                areActiveItemDropsEqual(current, nextDrop) ? current : nextDrop
            );
        };

        const handlePointerUp = (event: PointerEvent) => {
            const currentDrag = drag;
            if (event.pointerId !== currentDrag?.pointerId) {
                return;
            }

            const activeDrop = currentDrag.active
                ? activeDropRef.current
                : null;
            const target = activeDrop
                ? targetsRef.current.get(activeDrop.targetId)
                : undefined;
            const source = currentDrag.source;
            const id = currentDrag.id;
            const wasActive = currentDrag.active;
            resetDrag();

            if (!wasActive) return;
            event.preventDefault();
            suppressClickFrom = source;
            if (clickSuppressionTimer !== null) {
                window.clearTimeout(clickSuppressionTimer);
            }
            clickSuppressionTimer = window.setTimeout(() => {
                suppressClickFrom = null;
                clickSuppressionTimer = null;
            }, 0);
            if (activeDrop && target) {
                try {
                    void Promise.resolve(
                        target.commit(id, activeDrop.preview)
                    ).catch(error =>
                        console.error('Unable to drop item', error)
                    );
                } catch (error) {
                    console.error('Unable to drop item', error);
                }
            }
        };

        const handlePointerCancel = (event: PointerEvent) => {
            if (event.pointerId === drag?.pointerId) resetDrag();
        };
        const handleClick = (event: MouseEvent) => {
            const target = event.target;
            if (
                !suppressClickFrom ||
                !(target instanceof Node) ||
                !suppressClickFrom.contains(target)
            ) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            suppressClickFrom = null;
        };
        const handleWindowBlur = () => resetDrag();
        const pointerMoveOptions = { capture: true, passive: false } as const;

        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener(
            'pointermove',
            handlePointerMove,
            pointerMoveOptions
        );
        document.addEventListener('pointerup', handlePointerUp, true);
        document.addEventListener('pointercancel', handlePointerCancel, true);
        document.addEventListener('click', handleClick, true);
        window.addEventListener('blur', handleWindowBlur);
        return () => {
            document.removeEventListener(
                'pointerdown',
                handlePointerDown,
                true
            );
            document.removeEventListener(
                'pointermove',
                handlePointerMove,
                pointerMoveOptions
            );
            document.removeEventListener('pointerup', handlePointerUp, true);
            document.removeEventListener(
                'pointercancel',
                handlePointerCancel,
                true
            );
            document.removeEventListener('click', handleClick, true);
            window.removeEventListener('blur', handleWindowBlur);
            if (clickSuppressionTimer !== null) {
                window.clearTimeout(clickSuppressionTimer);
            }
            resetDrag(false);
        };
    }, [itemsById]);

    const contextValue = useMemo(
        () => ({ activeDrop, activeItemId, registerDropTarget }),
        [activeDrop, activeItemId, registerDropTarget]
    );

    return (
        <ItemDragContext.Provider value={contextValue}>
            {children}
        </ItemDragContext.Provider>
    );
}

const useItemDragContext = (): ItemDragContextValue => {
    const context = useContext(ItemDragContext);
    if (!context) {
        throw new Error('ItemDragProvider is missing from the app shell.');
    }
    return context;
};

export function useItemDragState(): Pick<
    ItemDragContextValue,
    'activeDrop' | 'activeItemId'
> {
    const { activeDrop, activeItemId } = useItemDragContext();
    return { activeDrop, activeItemId };
}

export function useItemDropTarget(target: ItemDropTarget): void {
    const { registerDropTarget } = useItemDragContext();
    useEffect(() => registerDropTarget(target), [registerDropTarget, target]);
}
