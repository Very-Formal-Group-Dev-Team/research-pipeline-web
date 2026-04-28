# Student Research Portal Frontend Instructions

## What to optimize for
- This repo is a Next.js 16 App Router app on Node.js 20+ with TypeScript, Tailwind CSS, and pnpm.
- Keep changes consistent with the existing route groups, dashboard structure, and API wrapper layer.
- Prefer focused UI and data-flow edits over broad refactors.

## Frontend conventions
- Put shared UI primitives in `components/ui/` and feature-specific components in `components/`.
- Put route pages under `app/`, especially the `(auth)` and `(dashboard)` groups.
- Use `lib/api/client.ts` and the domain wrappers in `lib/api/` for all backend calls; do not add raw `fetch()` calls in components.
- Respect the `session_token` cookie flow and the protection logic in `middleware.ts`.
- Use `'use client'` only when a component needs client-side behavior.
- Keep TypeScript explicit and render loading and empty states for async UI.
- Prefer Tailwind utilities and the existing design tokens over inline styles.
- Use `react-icons/fi` for icons unless the surrounding code already uses something else.

## Commands
- Install dependencies with `pnpm install`.
- Run the app locally with `pnpm dev`.
- Run lint with `pnpm lint`.
- Build with `pnpm build`.

## Before changing behavior
- Check [README.md](README.md), [Tasks.md](Tasks.md), and the existing convention file at [.github/instructions/paper-version-control.instructions.md](.github/instructions/paper-version-control.instructions.md).
- If you touch auth, routing, or API behavior, update the matching wrapper in `lib/api/` and keep route protection consistent with `middleware.ts`.
- If you touch paper version control, follow the dedicated instruction file instead of re-deriving that workflow.