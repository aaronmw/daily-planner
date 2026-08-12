# Options Panel and Shortcut Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reliably recordable desktop-shortcut editor inside a lightweight anchored Options popover, correct its visual grouping, and replace the Deleted Items row with a conditional counted ghost button.

**Architecture:** Extend the existing `ShortcutProvider` with one exclusive, reversible keyboard-capture session and serialize native global-shortcut registration so a registered accelerator cannot be swallowed by macOS while it is being edited. Extract desktop shortcut rows into a focused settings component, keep disclosure state in `OptionsMenu`, and share deleted-entry derivation between the menu count and the Deleted Items view.

**Tech Stack:** React 19, TypeScript 6, Zustand, Tauri 2 global shortcuts, Vitest, Testing Library, Tailwind CSS 4, existing planner UI primitives.

## Global Constraints

- Preserve the current production desktop icon and all unrelated uncommitted work.
- Keep the existing user-managed `pnpm dev` Tauri/HMR session running; do not start, stop, restart, reinstall, or otherwise manage it.
- Shortcut keycaps in Options remain permanently visible when not actively previewing held keys.
- Native shortcut preferences change only after the complete candidate map registers successfully.
- Escape, outside click, focus loss, panel close, window blur, and hidden-page transitions must leave the original native shortcut map registered.
- Do not run browser or screenshot automation for visual review unless Aaron selects “Verify via automation”; focused browser tests remain part of ordinary behavioral verification.
- Before any final implementation commit or integration, present the required post-implementation decision audit. Per-task checkpoint commits are permitted only when executing with the approved subagent-driven workflow.

---

## File map

- Modify `src/core/application/ports.ts`: allow native-shortcut cleanup to be awaited.
- Modify `src/platform/runtime/platformAdapter.ts`: return an async cleanup that completes native unregistration.
- Modify `src/platform/runtime/desktopShortcuts.ts`: add live key-label formatting and serialize update/dispose operations.
- Modify `src/platform/runtime/__tests__/desktopShortcuts.test.ts`: cover live key labels and coordinator sequencing.
- Modify `src/platform/runtime/__tests__/platformAdapter.test.ts`: prove cleanup awaits Tauri unregistration.
- Modify `src/features/shortcuts/ShortcutProvider.tsx`: own the exclusive recording session and suppress ordinary shortcut dispatch while it is active.
- Modify `src/features/shortcuts/ShortcutProvider.test.tsx`: cover recording priority, live keys, completion, and cancellation cleanup.
- Create `src/features/settings/DesktopShortcutSettings.tsx`: render and operate the three editable desktop shortcut rows.
- Create `src/features/settings/DesktopShortcutSettings.test.tsx`: cover working registration, restoration, errors, and row presentation.
- Modify `src/features/settings/OptionsMenu.tsx`: render the anchored non-modal panel, section-owned separators, and counted Deleted Items ghost button.
- Create `src/features/trash/deletedItems.ts`: derive the canonical deleted-entry collection.
- Create `src/features/trash/deletedItems.test.ts`: lock the count/view semantics.
- Modify `src/features/trash/DeletedItems.tsx`: consume the shared deleted-entry derivation.
- Modify `src/features/shell/PlannerShellShortcuts.browser.test.tsx`: cover disclosure, Escape/outside closure, and conditional Deleted Items behavior.
- Modify `src/styles/features.css`: add Options launcher crossfade, popover, section, shortcut-row, and ghost-button layout styles.

---

### Task 1: Make native shortcut registration reversible and ordered

**Files:**
- Modify: `src/core/application/ports.ts:82-91`
- Modify: `src/platform/runtime/platformAdapter.ts:1-91`
- Modify: `src/platform/runtime/desktopShortcuts.ts:1-174`
- Test: `src/platform/runtime/__tests__/desktopShortcuts.test.ts`
- Test: `src/platform/runtime/__tests__/platformAdapter.test.ts`

**Interfaces:**
- Produces: `shortcutKeyLabelsFromKeyboardEvent(event): string[]`.
- Produces: serialized `DesktopShortcutCoordinator.update()` and `.dispose()` promises.
- Produces: `PlatformAdapter.registerGlobalShortcuts(...): Promise<() => void | Promise<void>>`.

- [ ] **Step 1: Add failing tests for live labels and ordered disposal**

Extend the desktop-shortcut unit test with modifier-only and completed chord previews:

```ts
expect(
    shortcutKeyLabelsFromKeyboardEvent(
        new KeyboardEvent('keydown', {
            code: 'MetaLeft',
            key: 'Meta',
            metaKey: true,
        })
    )
).toEqual(['⌘']);

expect(
    shortcutKeyLabelsFromKeyboardEvent(
        new KeyboardEvent('keydown', {
            code: 'KeyP',
            key: 'p',
            metaKey: true,
            shiftKey: true,
        })
    )
).toEqual(['⇧', '⌘', 'P']);
```

Add a coordinator test using deferred cleanup promises. Call `update(original)`, `dispose()`, and `update(next)` without awaiting between the calls, then assert the operation log is exactly:

```ts
expect(operations).toEqual([
    'register:original',
    'unregister:original',
    'register:next',
]);
```

Update the platform-adapter test so its returned cleanup remains pending until mocked `unregister()` resolves.

- [ ] **Step 2: Run the focused tests and confirm the missing behavior**

Run:

```bash
pnpm vitest run --project unit src/platform/runtime/__tests__/desktopShortcuts.test.ts src/platform/runtime/__tests__/platformAdapter.test.ts
```

Expected: FAIL because live label formatting is absent, cleanup is synchronous, and coordinator operations can overlap.

- [ ] **Step 3: Implement live event labels and awaitable cleanup**

In `desktopShortcuts.ts`, reuse the existing modifier order and supported physical-key mapping:

```ts
export const shortcutKeyLabelsFromKeyboardEvent = (
    event: KeyboardEvent | React.KeyboardEvent
): string[] => {
    const labels = MODIFIERS.filter(value => event[value.eventProperty]).map(
        value => value.symbol
    );
    if (
        event.code &&
        !MODIFIER_CODES.has(event.code) &&
        supportedCode(event.code)
    ) {
        labels.push(keyLabel(event.code));
    }
    return labels;
};
```

Change the port cleanup signature to `() => void | Promise<void>`, and return an `async` cleanup from `TauriPlatformAdapter` that awaits `unregister(registered)`.

- [ ] **Step 4: Serialize coordinator mutations**

Add an internal queue so every update or dispose begins only after the previous mutation settles, including after a rejection:

```ts
#operation: Promise<void> = Promise.resolve();

#enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.#operation.then(operation, operation);
    this.#operation = result.then(
        () => undefined,
        () => undefined
    );
    return result;
}
```

Move the existing `update` and `dispose` bodies into private async operations and have their public methods return `#enqueue(...)`. Preserve the current handler across `dispose()` so recording can restore registration without rebuilding command dispatch.

- [ ] **Step 5: Run the focused tests**

Run the Task 1 command again. Expected: PASS.

- [ ] **Step 6: Checkpoint Task 1 only when the selected execution workflow permits it**

For subagent-driven execution:

```bash
git add src/core/application/ports.ts src/platform/runtime/platformAdapter.ts src/platform/runtime/desktopShortcuts.ts src/platform/runtime/__tests__/desktopShortcuts.test.ts src/platform/runtime/__tests__/platformAdapter.test.ts
git commit -m "fix: serialize desktop shortcut registration"
```

For inline execution, leave the files uncommitted for the decision audit.

---

### Task 2: Add an exclusive shortcut-recording session

**Files:**
- Modify: `src/features/shortcuts/ShortcutProvider.tsx:1-247`
- Test: `src/features/shortcuts/ShortcutProvider.test.tsx`

**Interfaces:**
- Consumes: `shortcutFromKeyboardEvent` and `shortcutKeyLabelsFromKeyboardEvent` from Task 1.
- Produces:

```ts
interface ShortcutRecorderOptions {
    onCancel?: () => void | Promise<void>;
    onCandidate: (shortcut: string) => boolean | Promise<boolean>;
    onStart?: () => void | Promise<void>;
}

interface ShortcutRecorder {
    active: boolean;
    cancel: () => void;
    pressedKeyLabels: readonly string[];
    start: () => Promise<void>;
}

export function useShortcutRecorder(
    options: ShortcutRecorderOptions
): ShortcutRecorder;
```

- [ ] **Step 1: Write a failing recorder harness test**

Add a harness that registers ordinary `⌘1` through `useShortcut` and recording through `useShortcutRecorder`. Verify that:

```ts
fireEvent.click(screen.getByRole('button', { name: 'Record' }));
fireEvent.keyDown(window, {
    code: 'MetaLeft',
    key: 'Meta',
    metaKey: true,
});
expect(screen.getByTestId('pressed-keys')).toHaveTextContent('⌘');

fireEvent.keyDown(window, {
    code: 'Digit1',
    key: '1',
    metaKey: true,
});
expect(onCandidate).toHaveBeenCalledWith('Super+Digit1');
expect(onTrigger).not.toHaveBeenCalled();
```

Also verify repeat suppression, key-up removal, modifier-only persistence, successful-candidate completion, Escape cancellation, explicit cancellation, window blur, hidden-page cleanup, and unmount cleanup.

- [ ] **Step 2: Run the provider test and confirm RED**

Run:

```bash
pnpm vitest run --project unit src/features/shortcuts/ShortcutProvider.test.tsx
```

Expected: FAIL because `useShortcutRecorder` does not exist.

- [ ] **Step 3: Add recording state to the provider**

Store one active recorder in a ref and mirror only renderable state in React state:

```ts
interface ActiveShortcutRecorder {
    id: string;
    onCancel: () => void | Promise<void>;
    onCandidate: (shortcut: string) => boolean | Promise<boolean>;
    pending: boolean;
}

interface ShortcutRecordingView {
    id: string;
    pressedKeyLabels: readonly string[];
}
```

`startRecording` awaits cancellation of any previous recorder, then awaits the new recorder's `onStart`, and only then activates the new ID. `cancelRecording` clears the ref and pressed keys before awaiting `onCancel`. Successful candidate resolution clears the session without invoking cancellation; a false or rejected candidate leaves listening active. This ordering lets each desktop editor restore the previous native map before the next editor suspends it.

- [ ] **Step 4: Give recording first refusal over keyboard events**

Install capture-phase `keydown` and `keyup` listeners on `window`. When a recorder is active:

```ts
event.preventDefault();
if (event.key === 'Escape') {
    cancelRecording();
    return; // Allow propagation so the Options panel also closes.
}
event.stopPropagation();
if (event.repeat || active.pending) return;
setPressedKeyLabels(shortcutKeyLabelsFromKeyboardEvent(event));
```

On a valid `shortcutFromKeyboardEvent(event)`, call `onCandidate`. Mark the recorder pending until it settles. Complete on `true`; remain active on `false` or rejection. Key-up refreshes the currently held modifier labels. Window blur and hidden-page transitions cancel recording in the same cleanup path used for held-command hints.

- [ ] **Step 5: Expose `useShortcutRecorder`**

Use a stable hook ID, callback refs updated in `useLayoutEffect`, and an unmount cleanup that cancels only if that hook owns the active session. Return `pressedKeyLabels` only to the active hook.

- [ ] **Step 6: Run the provider tests**

Run the Task 2 command. Expected: PASS with all existing contextual-shortcut tests unchanged.

- [ ] **Step 7: Checkpoint Task 2 only when permitted**

For subagent-driven execution:

```bash
git add src/features/shortcuts/ShortcutProvider.tsx src/features/shortcuts/ShortcutProvider.test.tsx
git commit -m "feat: add shortcut recording sessions"
```

For inline execution, leave the files uncommitted.

---

### Task 3: Build the editable desktop shortcut rows

**Files:**
- Create: `src/features/settings/DesktopShortcutSettings.tsx`
- Create: `src/features/settings/DesktopShortcutSettings.test.tsx`
- Modify: `src/features/settings/OptionsMenu.tsx:1-190,277-284`
- Modify: `src/styles/features.css`

**Interfaces:**
- Consumes: `useShortcutRecorder` from Task 2 and serialized `desktopShortcutCoordinator` from Task 1.
- Produces:

```ts
interface DesktopShortcutSettingsProps {
    onUpdate: (
        shortcuts: Readonly<Record<PlannerCommandId, string>>
    ) => void;
    shortcuts: Readonly<Record<PlannerCommandId, string>>;
}

export function DesktopShortcutSettings(
    props: DesktopShortcutSettingsProps
): React.JSX.Element;
```

- [ ] **Step 1: Write failing component tests**

Render `DesktopShortcutSettings` inside `ShortcutProvider` with the default shortcut map. Mock `desktopShortcutCoordinator.dispose` and `.update`. Assert idle layout has command icon, label, right-aligned keycaps, and `Edit shortcut for Show Daily Planner`.

Exercise this sequence:

```ts
await user.click(
    screen.getByRole('button', {
        name: 'Edit shortcut for Show Daily Planner',
    })
);
expect(desktopShortcutCoordinator.dispose).toHaveBeenCalledOnce();

fireEvent.keyDown(window, {
    code: 'MetaLeft',
    key: 'Meta',
    metaKey: true,
});
expect(screen.getByTestId('show-planner-shortcut-keys')).toHaveTextContent(
    '⌘'
);
```

Then press `KeyP`, resolve registration, and assert the complete next map reaches `onUpdate`. Add cases for Escape restoration, focus-loss restoration, modifier release falling back to the snapshot keycaps, conflict/error retention, retry after an error, and no preference update before registration succeeds.

- [ ] **Step 2: Run the component test and confirm RED**

Run:

```bash
pnpm vitest run --project unit src/features/settings/DesktopShortcutSettings.test.tsx
```

Expected: FAIL because the component is absent.

- [ ] **Step 3: Extract the desktop shortcut option metadata and row**

Move `DESKTOP_SHORTCUT_OPTIONS` and shortcut-row presentation out of `OptionsMenu.tsx`. Render each row with:

```tsx
<div className="planner-desktop-shortcut-row" data-listening={active || undefined}>
    <span className="planner-desktop-shortcut-command-icon">
        <Icon name={icon} />
    </span>
    <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        {(active || error) && (
            <span aria-live="polite" className={error ? 'text-planner-danger' : 'text-planner-text-faded'}>
                {error || 'Listening…'}
            </span>
        )}
    </span>
    <span className="planner-desktop-shortcut-keys" data-testid={`${commandId}-shortcut-keys`}>
        {visibleLabels.map(label => (
            <KeyboardKey
                isIcon={['⇧', '⌃', '⌥', '⌘'].includes(label)}
                key={label}
                label={label}
            />
        ))}
    </span>
    <IconButton
        aria-pressed={active}
        icon={pending ? 'spinner' : 'pencil'}
        label={`${active ? 'Stop editing' : 'Edit'} shortcut for ${label}`}
        onBlur={active ? cancel : undefined}
        onClick={active ? cancel : beginRecording}
    />
</div>
```

When `pressedKeyLabels` is empty, `visibleLabels` must be `shortcutKeyLabels(shortcut)` so releasing modifiers restores the saved chord while listening remains active.

- [ ] **Step 4: Wire native suspension, registration, and restoration**

Pass `onStart: () => desktopShortcutCoordinator.dispose()` to `useShortcutRecorder`, and have the pencil await `start()`. `onCandidate` creates the complete next map, awaits `desktopShortcutCoordinator.update(next)`, calls `onUpdate(next)`, and returns `true`. It catches failures, stores their message, and returns `false`. `onCancel` calls `desktopShortcutCoordinator.update(shortcuts)` and reports restoration failures without altering preferences.

- [ ] **Step 5: Integrate the extracted component into Options**

Replace the old whole-row `ShortcutRow` implementation with:

```tsx
{getPlatformAdapter().kind === 'desktop' && (
    <section className="planner-settings-section">
        <GroupLabel>Desktop shortcuts</GroupLabel>
        <DesktopShortcutSettings
            onUpdate={desktopShortcuts =>
                commands.updatePreferences({ desktopShortcuts })
            }
            shortcuts={preferences.desktopShortcuts}
        />
    </section>
)}
```

- [ ] **Step 6: Add focused row styles**

Define a four-column row with `45px minmax(0,1fr) auto 45px`, right-align the keycaps, preserve a minimum 54px row height, and use the existing 150ms tokens for listening/error transitions. Do not hide the configured keycaps while idle.

- [ ] **Step 7: Run the Task 3 test and nearby shortcut tests**

Run:

```bash
pnpm vitest run --project unit src/features/settings/DesktopShortcutSettings.test.tsx src/features/shortcuts/ShortcutProvider.test.tsx src/platform/runtime/__tests__/desktopShortcuts.test.ts
```

Expected: PASS.

- [ ] **Step 8: Checkpoint Task 3 only when permitted**

For subagent-driven execution:

```bash
git add src/features/settings/DesktopShortcutSettings.tsx src/features/settings/DesktopShortcutSettings.test.tsx src/features/settings/OptionsMenu.tsx src/styles/features.css
git commit -m "feat: add editable desktop shortcut rows"
```

For inline execution, leave the files uncommitted.

---

### Task 4: Convert Options to an anchored, dismissible popover

**Files:**
- Modify: `src/features/settings/OptionsMenu.tsx:192-720`
- Modify: `src/features/shell/PlannerShellShortcuts.browser.test.tsx`
- Modify: `src/styles/features.css`

**Interfaces:**
- Consumes: existing `Icon`, `IconButton`, and panel contents.
- Produces: a launcher with `aria-expanded`, `aria-controls="planner-options-panel"`, and a non-modal `role="dialog"` panel.

- [ ] **Step 1: Add failing disclosure tests**

Extend the PlannerShell browser harness and verify:

```ts
const launcher = screen.getByRole('button', { name: 'Options' });
expect(launcher).toHaveAttribute('aria-expanded', 'false');
await user.click(launcher);
expect(launcher).toHaveAttribute('aria-expanded', 'true');
expect(screen.getByRole('dialog', { name: 'Options' })).toBeVisible();
expect(
    screen.queryByRole('heading', { name: 'Options' })
).not.toBeInTheDocument();
```

Add separate cases proving Escape, pointer-down outside, and a second launcher click close the panel, while pointer interaction within it does not. Assert the launcher contains gear and X icon layers whose visibility state follows `data-open`.

- [ ] **Step 2: Run the focused browser test and confirm RED**

Run:

```bash
pnpm vitest run --project browser src/features/shell/PlannerShellShortcuts.browser.test.tsx
```

Expected: FAIL against the current modal dialog/header implementation.

- [ ] **Step 3: Replace imperative modal state with controlled disclosure**

In `OptionsMenu`, use `open` state plus wrapper, launcher, and panel refs. Render:

```tsx
<div className="planner-options" ref={optionsRef}>
    <button
        aria-controls="planner-options-panel"
        aria-expanded={open}
        aria-label="Options"
        className="planner-options-trigger"
        onClick={() => setOpen(value => !value)}
        type="button"
    >
        <Icon className="planner-options-trigger-gear" name="gear" />
        <Icon className="planner-options-trigger-close" name="xmark" />
    </button>
    {open && (
        <div
            aria-label="Options"
            className="planner-options-panel"
            id="planner-options-panel"
            ref={panelRef}
            role="dialog"
        >
            {sections}
        </div>
    )}
</div>
```

Remove the Options heading and internal close button entirely.

- [ ] **Step 4: Implement dismissal and focus behavior**

While open, register document `pointerdown` and `keydown` listeners. Close only when the pointer target is outside `optionsRef`, or when `event.key === 'Escape'`. On open, focus the first enabled interactive control in the panel. On close triggered by Escape or the launcher, restore focus to the launcher. Component cleanup removes both listeners.

- [ ] **Step 5: Add anchored layout and crossfade styles**

Position `.planner-options-panel` absolutely at `right: 0; top: 100%`, with the existing 460px/viewport width cap, viewport-derived max height, scrolling, border, background, and shadow. Keep the wrapper `position: relative` and above column contents while open. Stack the gear and X in one icon slot, transition opacity over `var(--planner-motion-fast)`, and switch their opacity from `data-open` without rotation or shape morphing.

- [ ] **Step 6: Run the focused browser test**

Run the Task 4 command. Expected: PASS.

- [ ] **Step 7: Checkpoint Task 4 only when permitted**

For subagent-driven execution:

```bash
git add src/features/settings/OptionsMenu.tsx src/features/shell/PlannerShellShortcuts.browser.test.tsx src/styles/features.css
git commit -m "feat: anchor and dismiss options panel"
```

For inline execution, leave the files uncommitted.

---

### Task 5: Correct section grouping and add counted Deleted Items access

**Files:**
- Create: `src/features/trash/deletedItems.ts`
- Create: `src/features/trash/deletedItems.test.ts`
- Modify: `src/features/trash/DeletedItems.tsx:1-122`
- Modify: `src/features/settings/OptionsMenu.tsx`
- Modify: `src/features/shell/PlannerShellShortcuts.browser.test.tsx`
- Modify: `src/styles/features.css`

**Interfaces:**
- Produces:

```ts
export type DeletedItem =
    | { id: string; label: string; listId: string; type: 'list' }
    | {
          id: string;
          label: string;
          listArchived: boolean;
          listId: string;
          type: 'item';
      };

export function buildDeletedItems(
    lists: ReadonlyMap<ListId, PlannerList>,
    items: ReadonlyMap<ItemId, PlannerItem>
): DeletedItem[];
```

- [ ] **Step 1: Add failing deleted-entry derivation tests**

Build one active list, one archived list, one active item, and archived items under both lists. Assert `buildDeletedItems` returns the archived list and both archived items in the same list-first/item-second order currently rendered. Assert active records are excluded.

- [ ] **Step 2: Add failing panel semantics tests**

Extend the PlannerShell browser harness to accept archived fixtures. Verify no Deleted Items button exists at count zero. With three deleted entries, assert a ghost button named `Deleted items, 3` contains the trash icon and visible count `3`; clicking it closes Options and switches the details heading to Deleted Items.

Assert every settings section after the first has its separator on `.planner-settings-section`, before its group-label child, and that no border separates “Sync & Sharing” from Encrypted sync.

- [ ] **Step 3: Run the focused tests and confirm RED**

Run:

```bash
pnpm vitest run --project unit src/features/trash/deletedItems.test.ts
pnpm vitest run --project browser src/features/shell/PlannerShellShortcuts.browser.test.tsx
```

Expected: FAIL because derivation is local, Deleted Items is unconditional and uncounted, and row-owned borders split labels from their content.

- [ ] **Step 4: Extract and reuse deleted-entry derivation**

Move the existing `DeletedItem` union and list/item traversal unchanged into `deletedItems.ts`. In `DeletedItems.tsx`, replace the local traversal with:

```ts
const deletedItems = useMemo(
    () => buildDeletedItems(lists, plannerItems),
    [lists, plannerItems]
);
```

In `OptionsMenu`, derive only the count from the same helper so the badge always matches the view.

- [ ] **Step 5: Make separators belong to sections**

Apply a shared `.planner-settings-section` class to sections, style sibling sections with a top border, and remove `border-t` from the first row class. Add a row-divider class only between sibling rows within a section. This places each group label below its section cutline and directly above its first item.

- [ ] **Step 6: Replace the Planner row with a conditional ghost button**

Remove the Planner `GroupLabel`. When `deletedItemCount > 0`, render:

```tsx
<GhostButton
    aria-label={`Deleted items, ${deletedItemCount}`}
    className="planner-deleted-items-button"
    onClick={() => {
        close();
        onShowDeletedItems();
    }}
>
    <span className="grid size-[45px] place-items-center">
        <Icon name="trash" />
    </span>
    <span>Deleted items</span>
    <span className="grid size-[45px] place-items-center tabular-nums">
        {deletedItemCount}
    </span>
</GhostButton>
```

Keep the button visually subtle at rest and let the shared `GhostButton` supply focus, hover, and Marching Ants behavior.

- [ ] **Step 7: Run Task 5 tests**

Run both Task 5 commands. Expected: PASS.

- [ ] **Step 8: Checkpoint Task 5 only when permitted**

For subagent-driven execution:

```bash
git add src/features/trash/deletedItems.ts src/features/trash/deletedItems.test.ts src/features/trash/DeletedItems.tsx src/features/settings/OptionsMenu.tsx src/features/shell/PlannerShellShortcuts.browser.test.tsx src/styles/features.css
git commit -m "feat: refine options grouping and deleted items"
```

For inline execution, leave the files uncommitted.

---

### Task 6: Verify the complete behavior and prepare the decision audit

**Files:**
- Review all files changed in Tasks 1-5.
- Do not create a final implementation commit before the audit unless the selected workflow explicitly permits task checkpoint commits.

**Interfaces:**
- Consumes: all prior task deliverables.
- Produces: verified implementation plus a decision audit for Aaron.

- [ ] **Step 1: Run focused unit tests**

```bash
pnpm vitest run --project unit src/platform/runtime/__tests__/desktopShortcuts.test.ts src/platform/runtime/__tests__/platformAdapter.test.ts src/features/shortcuts/ShortcutProvider.test.tsx src/features/settings/DesktopShortcutSettings.test.tsx src/features/trash/deletedItems.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused browser behavior tests**

```bash
pnpm vitest run --project browser src/features/shell/PlannerShellShortcuts.browser.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run the normal non-visual verification matrix**

```bash
pnpm test
pnpm test:browser
pnpm lint
pnpm typecheck
pnpm build
pnpm format:check
```

Expected: every command exits 0. Formatting may be applied only to files in this feature's scope, followed by rerunning `pnpm format:check`.

- [ ] **Step 4: Run React Doctor**

Read and follow the `react-doctor` skill, then scan the changed React surface. Resolve findings caused by this work; report unrelated existing findings separately.

- [ ] **Step 5: Perform a static interaction review**

Confirm from code and tests that native registration is suspended before capture, restored on every cancellation path, serialized across rapid editor switches, and never updates persisted preferences before successful registration. Confirm the non-modal panel has correct accessible disclosure state and no focus trap or backdrop.

- [ ] **Step 6: Hand visual validation to Aaron**

Do not manage the existing HMR process. Report that the live dev app should already reflect frontend changes and ask:

1. Looks good to me, keep going
2. Verify via automation

- [ ] **Step 7: Present the post-implementation decision audit**

Before finalizing, enumerate implementation decisions, alternatives, confidence, remaining risks, validation gaps, and the required pride gate. Stop for Aaron's response unless he explicitly directs continuation through the gate.
