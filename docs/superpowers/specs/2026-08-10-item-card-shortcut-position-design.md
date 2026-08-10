# Item Card Shortcut Position Design

## Goal

Move each numbered keyboard shortcut keycap from the item card's content row to the midpoint of the card's left edge. The keycap should be centered over that edge both horizontally and vertically, with half of it inside the card and half outside.

## Design

Keep the shortcut keycap inside the existing item-card button and position its wrapper absolutely. Anchor the wrapper at `left: 0` and `top: 50%`, then translate it by `-50%` on both axes. This keeps the keycap centered on the left edge regardless of the card's height and removes it from the flex layout so it no longer consumes horizontal content space.

Allow item cards to display visible overflow so the outer half of the keycap is not clipped. List cards retain their existing clipped overflow. Give the shortcut wrapper an explicit stacking position so it remains above the card surface and accent strip.

The item label keeps its current left padding. Its content begins beyond the inner half of the 21-pixel keycap, leaving a small gap without introducing another spacing rule.

## Scope

- Update the item-card shortcut positioning styles.
- Separate item-card overflow behavior from list-card overflow behavior.
- Preserve the existing shortcut rendering, keyboard behavior, accessibility text, card sizing, drag behavior, and timeline/collection contexts.
- Do not change the keycap component or add new behavior.

## Verification

Run formatting checks, lint, and TypeScript checks. Because this is a small styling-only change, hand visual review to Aaron before using browser automation.
