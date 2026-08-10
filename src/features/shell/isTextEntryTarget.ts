export const isTextEntryTarget = (target: EventTarget | null): boolean => {
    const element = target instanceof HTMLElement ? target : null;
    return Boolean(
        element?.closest('input, textarea, select, [contenteditable="true"]')
    );
};
