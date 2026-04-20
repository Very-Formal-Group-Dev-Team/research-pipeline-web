---
applyTo: "**"
description: >
  Coding conventions and architectural rules for the Student Research Platform —
  covers both the Next.js frontend (student-research-web) and Express API
  (student-research-api). Apply when adding features, routes, components or
  database migrations to either project.
---

# Student Research Platform — Coding Conventions

## Project Overview

Two separate repositories that work together:
- **student-research-api** — Express 5 / Node.js REST API backed by MySQL via `mysql2`
- **student-research-web** — Next.js 16 (App Router) + TypeScript + Tailwind CSS

---

## Backend (student-research-api)

### Module structure
Every domain feature lives in `src/modules/<domain>/`:
```
src/modules/<domain>/
  <domain>.service.js    ← all DB queries (raw mysql2, no ORM for new work)
  <domain>.controller.js ← request/response handling, no business logic
  <domain>.routes.js     ← express Router, auth middleware, multer if needed
```

### Route registration
Register every new router in `src/app.js`:
```js
const fooRouter = require('./modules/foo/foo.routes');
app.use('/api/foo', fooRouter);
```

### Async route handlers
Always wrap handlers in the `asyncHandler` helper defined in each routes file:
```js
router.get('/', asyncHandler(controller.list));
```

### Database access
Use `db.query(sql, params)` from `config/db` for simple queries.
Use `db.pool.getConnection()` + manual `beginTransaction / commit / rollback` for multi-step writes.

Return shape is `{ rows }` (destructured from `[rows]`).

### Authentication
Protect every route with `requireAuth` from `src/middleware/auth`.
Access the caller as `req.user.id`.

### File uploads
Use `createDocumentUpload()` from `src/middleware/multer` for `.docx/.pdf/.doc`.
Use `createAvatarUpload()` for images.
Files land in `uploads/files/` and are served at `/uploads/files/<filename>`.
Store the public path as `/uploads/files/<filename>` in the DB.

### Error responses
Always return `{ error: '<message>' }` JSON — never throw raw errors to the client.
HTTP status codes: 400 bad input, 401 unauth, 403 forbidden, 404 not found, 409 conflict, 500 server error.

### Migrations
New migrations go in `migrations/` as `NNN_description.sql` (zero-padded 3 digits).
Migrations are applied in filename order by `scripts/run-migrations.js`.
Always use `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF EXISTS` so migrations are idempotent.

---

## Frontend (student-research-web)

### API client pattern
All backend calls go through `lib/api/client.ts` helpers:
- `get<T>(path)` → `ApiResponse<T>`
- `post<T>(path, body)` → `ApiResponse<T>`

Add domain-specific wrappers in `lib/api/<domain>.ts` and export from `lib/api/index.ts`.

**Never** put raw `fetch` in components — always call an `lib/api/` function.

### Components
- Reusable UI primitives live in `components/ui/` (Card, Badge, Button, Modal, etc.).
- Feature components live in `components/`.
- Page-level components live in `app/(dashboard)/<role>/<feature>/page.tsx`.

### Tailwind conventions
- Prefer utility classes over custom CSS.
- Use the project's design tokens: `primary-*`, `neutral-*`, `success-*`, `warning-*`, `error-*`, `accent-*`.
- Never add inline `style={{}}` when a Tailwind class exists.

### React patterns
- Use `'use client'` only at the top of client components.
- Data fetching in `useEffect` with a cancellation flag (`let cancelled = false`).
- Loading/empty states must always be rendered.
- Never use `any` in TypeScript — define explicit interfaces.

### Icons
Use `react-icons/fi` (Feather icons) for all UI icons.

---

## Feature: Paper Version Control

The paper version control system tracks every revision of a project's research paper
like Git commits — each upload is an immutable version with a commit message.

### Data model
`paper_versions` table:
- `project_id` FK → projects
- `version_number` auto-incremented per project (1, 2, 3 …)
- `commit_message` — required, describes what changed
- `is_generated` — flag for template-generated versions
- `uploaded_by` FK → users

### API endpoints
- `GET  /api/projects/:id/paper-versions` — list all versions DESC
- `POST /api/projects/:id/paper-versions` — upload new version (multipart, field: `file` + body: `commitMessage`)
- `POST /api/projects/:id/paper-versions/generate` — generate .docx template (IMRAD or IEEE) as first version
- `GET  /api/projects/:id/paper-versions/:versionId/download` — redirect to file

### UI
- `PaperVersionTimeline` component in `components/PaperVersionTimeline.tsx`
- Shows a GitHub-style commit history list
- "Upload New Version" modal with commit-message field
- "Generate Template" button only visible when zero versions exist
- Each entry shows: version badge, commit message, uploader, date, download link
