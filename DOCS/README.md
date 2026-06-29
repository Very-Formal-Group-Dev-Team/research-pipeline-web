# Web Documentation

Frontend and end-user documentation for **Archivum** (Student Research Portal).

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Frontend structure, auth flow, API wrappers |
| [USER_GUIDE.md](./USER_GUIDE.md) | End-user guide by role (student, adviser, coordinator, admin) |
| [Notes/DESIGN.md](./Notes/DESIGN.md) | UI design tokens and component guidelines |

In-app help (requires sign-in): `/help` — powered by [lib/content/roleGuides.ts](../lib/content/roleGuides.ts).

## Related

- [README.md](../README.md) — Web quick start
- [AGENTS.md](../AGENTS.md) — contributor conventions

## Maintenance

- Keep [USER_GUIDE.md](./USER_GUIDE.md) in sync with [lib/content/roleGuides.ts](../lib/content/roleGuides.ts) when role workflows change.
- Update [ARCHITECTURE.md](./ARCHITECTURE.md) when route groups, auth flow, or `lib/api/` structure changes.
