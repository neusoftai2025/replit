# Workspace

## Overview

pnpm workspace monorepo. This is a Meeting Room Reservation System (会議室予約システム).
Frontend: React + Vite (TypeScript). Backend: Spring Boot 3 (Java).

## Stack

### Frontend
- **Framework**: React + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (React Query)
- **Routing**: Wouter
- **Language**: TypeScript

### Backend
- **Framework**: Spring Boot 3.2.5 (Java 19)
- **Server**: Apache Tomcat (embedded)
- **Database**: PostgreSQL + Spring Data JPA + Hibernate 6
- **Connection pool**: HikariCP
- **Auth**: HttpSession (cookie-based, JSESSIONID)
- **Security**: Spring Security (CSRF disabled, permissive)
- **Password**: BCrypt (with plain text fallback for seed data)

## Project Structure

### Frontend (`artifacts/meeting-rooms`)
- `/login` — Login page
- `/` — Dashboard with stats and today's reservations
- `/rooms` — Searchable meeting room list
- `/rooms/:id` — Room detail with reservation history
- `/reservations` — My reservations / all reservations (admin)
- `/reservations/new` — New reservation form
- `/calendar` — Calendar view with drag-to-select
- `/admin/rooms` — Admin room management (admin only)

### Backend (`artifacts/spring-api`)
Spring Boot 3 project. Serves at port 8080 via artifact path `/api`.

- `POST /api/auth/login` — Login with email/password
- `GET /api/auth/me` — Get current user from session
- `POST /api/auth/logout` — Logout (invalidate session)
- `GET/POST /api/rooms` — List / create rooms
- `GET/PATCH/DELETE /api/rooms/:id` — Room CRUD
- `GET/POST /api/reservations` — List / create reservations (conflict detection)
- `GET/PATCH/DELETE /api/reservations/:id` — Reservation CRUD
- `GET /api/dashboard/summary` — Stats summary
- `GET /api/dashboard/today` — Today's reservations
- `GET /api/dashboard/room-usage` — Room usage statistics

Key packages:
- `com.meetingrooms.config` — Security, DataSource, CORS
- `com.meetingrooms.entity` — User, Room, Reservation (JPA entities)
- `com.meetingrooms.repository` — Spring Data JPA repositories
- `com.meetingrooms.service` — Business logic
- `com.meetingrooms.controller` — REST controllers
- `com.meetingrooms.dto` — Response DTOs

### Legacy (kept for reference)
- `artifacts/api-server/` — Original Node.js/Express backend (no longer running)
- `lib/db/` — Drizzle ORM schema (no longer used by backend)
- `lib/api-zod/`, `lib/api-client-react/`, `lib/api-spec/` — OpenAPI codegen artifacts

## Test Accounts

| Role  | Email                   | Password    |
|-------|-------------------------|-------------|
| Admin | admin@example.com       | password123 |
| User  | user@example.com        | password123 |
| User  | tanaka@example.com      | password123 |
| User  | sato@example.com        | password123 |

## Key Commands

- Spring Boot (dev): `mvn -f artifacts/spring-api/pom.xml spring-boot:run`
- Spring Boot (build): `mvn -f artifacts/spring-api/pom.xml package -DskipTests`
- Frontend (dev): `pnpm --filter @workspace/meeting-rooms run dev`
