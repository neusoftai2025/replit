# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This is a Meeting Room Reservation System (会議室予約システム).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Auth**: Cookie-based session (`cookie-session`)
- **Language**: Japanese UI

## Project Structure

### Frontend (`artifacts/meeting-rooms`)
- `/login` — Login page (matches provided screenshot with blue CTA)
- `/` — Dashboard with stats and today's reservations
- `/rooms` — Searchable meeting room list
- `/rooms/:id` — Room detail with reservation history
- `/reservations` — My reservations / all reservations (admin)
- `/reservations/new` — New reservation form
- `/admin/rooms` — Admin room management (admin only)

### Backend (`artifacts/api-server`)
- `/api/auth/login` — Login with email/password
- `/api/auth/me` — Get current user
- `/api/auth/logout` — Logout
- `/api/rooms` — CRUD for meeting rooms
- `/api/reservations` — CRUD for reservations (conflict detection)
- `/api/dashboard/summary` — Stats summary
- `/api/dashboard/today` — Today's reservations
- `/api/dashboard/room-usage` — Room usage statistics

## Test Accounts

| Role  | Email                   | Password    |
|-------|-------------------------|-------------|
| Admin | admin@example.com       | password123 |
| User  | user@example.com        | password123 |
| User  | tanaka@example.com      | password123 |
| User  | sato@example.com        | password123 |

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
