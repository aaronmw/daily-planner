'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

const Tooltip = ({ children, content }) => (
    <TooltipPrimitive.Provider delayDuration={350} skipDelayDuration={100}>
        <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
                {children}
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                    className="planner-tooltip"
                    sideOffset={6}
                >
                    {content}
                    <TooltipPrimitive.Arrow className="planner-tooltip-arrow" />
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
);

export default Tooltip;
