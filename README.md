# Archivum — Student Research Portal (Frontend)

Next.js 16 frontend for **Archivum**, a platform for managing academic research projects from proposal through defense. Provides role-based dashboards for students, advisers, coordinators, and platform admins.

**Documentation:** [DOCS/README.md](./DOCS/README.md)

## Quick start

**Prerequisites:** Node.js 20+, npm, and the [API](../research-pipeline-api/) running on port 4000.

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

See [Documentation/DEVELOPER_SETUP.md](../Documentation/DEVELOPER_SETUP.md) for full-stack setup when both repos and the SRP workspace folder are present.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |

## Project structure

```
research-pipeline-web/
├── app/
│   ├── (dashboard)/     # Role-based dashboard routes
│   ├── auth/            # Auth continuation flows
│   └── help/            # In-app help center
├── components/          # UI and feature components
├── DOCS/                # Architecture, user guide, design notes
├── lib/
│   ├── api/             # Backend API wrappers (use these, not raw fetch)
│   └── auth/            # Role access and session helpers
└── proxy.ts             # Route protection middleware
```

## Conventions

See [AGENTS.md](./AGENTS.md) for contributor guidelines. Key rules:

- All backend calls go through `lib/api/` wrappers
- Respect the `session_token` cookie flow and `proxy.ts` protection
- UI design tokens: [DOCS/Notes/DESIGN.md](./DOCS/Notes/DESIGN.md)

## Related docs

- [Architecture](./DOCS/ARCHITECTURE.md)
- [User guide](./DOCS/USER_GUIDE.md)
- [Backend repo](../research-pipeline-api/) — API docs in `docs/`
