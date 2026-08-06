# Next.js Migration Design

**Goal:** Replace Create React App with a modern Next.js App Router setup while keeping the daily planner behavior intact.

**Approved Direction:** Use Next.js. Nothing from the old GitHub Pages `/daily-planner/` hosting shape needs to be preserved.

## Architecture

The app remains a browser-driven planner with local state, localStorage persistence, drag/drop interactions, portals, and styled-components theming. Next.js owns the application shell through `app/layout.js` and `app/page.js`; the existing planner UI moves into a client component so browser-only APIs continue to run on the client.

The migration avoids a broad component rewrite. Existing components, hooks, utilities, and tests stay in place unless they reference CRA-specific entry points.

## Files

- Create `app/layout.js` for the root HTML/body shell and metadata.
- Create `app/page.js` as the route entry that renders the planner.
- Create `src/App.js` from the current `src/index.js` app component.
- Delete CRA entry files: `src/index.js`, `public/index.html`, and generated `build/`.
- Replace `react-scripts` scripts and dependencies with Next.js equivalents.
- Update Jest enough to keep the existing utility tests running without CRA.

## Dependencies

Use `next`, `react`, and `react-dom` as the runtime framework stack. Remove `react-scripts` and CRA-specific testing dependencies that are no longer needed. Keep existing app libraries such as `styled-components`, `marked`, `polished`, and `lodash`.

## Testing And Verification

Run the existing utility tests with Jest in non-watch mode. Run a production Next.js build. Start the Next.js dev server once, verify the served page returns HTTP 200, and stop only that server process.

## Known Non-Goals

- No visual redesign.
- No conversion to TypeScript.
- No server-side data model.
- No preservation of `/daily-planner/` as a base path.
- No deployment or commit as part of this migration.
