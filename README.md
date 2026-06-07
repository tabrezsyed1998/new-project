# New Project Backend

Node.js + Express + TypeScript + Prisma + PostgreSQL authentication starter with:

- User registration
- Login
- Access token issuance
- Refresh token rotation
- Logout by refresh token revocation
- Protected `/api/me` route

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

5. Start the server:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default.

## Scripts

```bash
npm run dev                    # Start the API in watch mode
npm run build                  # Generate Prisma Client and compile TypeScript
npm start                      # Run compiled JavaScript from dist/
npm run prisma:generate        # Regenerate Prisma Client
npm run prisma:migrate:dev     # Create/apply local development migrations
npm run prisma:migrate:deploy  # Apply committed migrations in production
npm run prisma:studio          # Open Prisma Studio
```

## API

### Register

`POST /api/auth/register`

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!"
}
```

### Login

`POST /api/auth/login`

```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

### Refresh access token

`POST /api/auth/refresh`

```json
{
  "refreshToken": "your_refresh_token"
}
```

### Logout

`POST /api/auth/logout`

```json
{
  "refreshToken": "your_refresh_token"
}
```

### Current user

`GET /api/me`

Header:

```text
Authorization: Bearer your_access_token
```

## Notes

Refresh tokens are stored as SHA-256 hashes in PostgreSQL. On refresh, the old refresh token is revoked and replaced with a new one. On logout, the refresh token is revoked; any existing access token will remain valid until its short expiry time.

The Prisma schema lives in `prisma/schema.prisma`. Prisma Client is generated into `src/generated/prisma`, which is ignored by Git and recreated with `npm run prisma:generate`.
