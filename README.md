# Sundara Backend

Node.js + Express + TypeScript + Prisma + PostgreSQL API for **Sundara**, India's salon &
wellness marketplace + SaaS.

### Auth
- User registration (role: `CUSTOMER` or `SALON_OWNER`)
- Login, access-token issuance, refresh-token rotation, logout (revocation)
- Protected `/api/me` (GET + PATCH profile)
- Role-based access control (`requireRole`)

### Marketplace (public)
- `GET /api/categories` — wellness verticals with salon counts
- `GET /api/cities` — distinct cities with active salons
- `GET /api/salons` — search & filter (`q`, `city`, `category`, `priceLevel`, `verified`, `sort`, `page`, `pageSize`)
- `GET /api/salons/:slug` — full detail (services, staff, reviews, opening hours)

### Bookings & reviews (customer)
- `POST /api/bookings` — create (computes refundable token; checks staff slot conflicts)
- `GET /api/bookings` — my bookings (filter by `status`)
- `PATCH /api/bookings/:id/cancel`
- `POST /api/salons/:salonId/reviews` — review a completed booking (recomputes cached rating)

### Salon-owner SaaS (`/api/owner`, role-guarded)
- `GET /analytics` — bookings by status, revenue (month + lifetime), recent bookings
- `GET/POST /salons`, `PATCH /salons/:id` — manage listings (auto-slug)
- `GET/POST /salons/:id/services`, `PATCH/DELETE /services/:id` — manage services (soft-delete)
- `POST /salons/:id/staff` — add professionals
- `GET /bookings`, `PATCH /bookings/:id/status` — confirm / complete / no-show / cancel

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a PostgreSQL database, then copy the environment template:

```bash
copy .env.example .env
```

Update `.env` with your actual `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.

3. Generate Prisma Client:

```bash
npm run prisma:generate
```

4. Create and run your first local migration:

```bash
npm run prisma:migrate:dev -- --name init
```

For production or staging deployments, use:

```bash
npm run prisma:migrate:deploy
```

5. Seed demo data (categories, salons, services, bookings, reviews + demo logins):

```bash
npm run prisma:seed
```

6. Start the server:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default.

### Demo logins (password: `Password123`)

| Role        | Email                  |
| ----------- | ---------------------- |
| Admin       | `admin@sundara.app`    |
| Salon owner | `owner@sundara.app`    |
| Salon owner | `priya@sundara.app`    |
| Customer    | `customer@sundara.app` |

## Scripts

```bash
npm run dev                    # Start the API in watch mode
npm run build                  # Generate Prisma Client and compile TypeScript
npm start                      # Run compiled JavaScript from dist/
npm run prisma:generate        # Regenerate Prisma Client
npm run prisma:migrate:dev     # Create/apply local development migrations
npm run prisma:migrate:deploy  # Apply committed migrations in production
npm run prisma:studio          # Open Prisma Studio
npm run prisma:seed            # Seed demo marketplace data
npm run db:reset               # Reset DB + re-run migrations (destructive)
```

## Notes

Refresh tokens are stored as SHA-256 hashes in PostgreSQL. On refresh, the old refresh token is revoked and replaced with a new one. On logout, the refresh token is revoked; any existing access token will remain valid until its short expiry time.

The Prisma schema lives in `prisma/schema.prisma`. Prisma Client is generated into `src/generated/prisma`, which is ignored by Git and recreated with `npm run prisma:generate`.
