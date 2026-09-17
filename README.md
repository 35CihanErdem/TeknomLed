# TeknomLed

Architectural lighting storefront + ASP.NET Core backend.

## Projects

| Path | Description |
|------|-------------|
| `storefront/` | Angular 19 storefront |
| `backend/` | ASP.NET Core 8 Web API |

## Local development

### 1. PostgreSQL

Create a database and set `ConnectionStrings__DefaultConnection` (see `backend/README.md`).

### 2. Backend

```bash
cd backend
dotnet run --project src/TeknomLed.Api --launch-profile http
```

### 3. Storefront

```bash
cd storefront
npm install
npm start
```

Dev proxy: `/api` → `http://localhost:5223`

### 4. Google Sign-In

See [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md).

## Status

See `storefront/PROJECT_STATUS.md`.
