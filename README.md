# ArbeitFlow

Junior IT job platform built with React, TypeScript, Vite, Express, and SQLite.

The home page is available at `/`, browse and filter junior roles at `/vacancies`,
contact the platform at `/contacts`, sign in at `/login`, and manage listings at `/admin`.

## Run locally

```sh
npm install
npm run dev
```

The first development start creates `credentials.local.txt` with one admin and one
user account. Keep this local file private; it is excluded from Git. The development
client runs at `http://127.0.0.1:4173` and the API at `http://127.0.0.1:3001`.

## Build

```sh
npm run build
```

## Tests

```sh
npm test
```

The test suite covers contact and sign-in forms, vacancy search and favorites,
administrator vacancy management, and API authentication, authorization, and CRUD.

## API

- `GET /api/vacancies` and `GET /api/vacancies/:id` are public.
- `POST /api/vacancies` and `PUT`/`DELETE /api/vacancies/:id` require the admin account.
- `POST /api/auth/login` and `POST /api/auth/logout` manage the HTTP-only session.
- `GET /api/favorites`, `POST /api/favorites/:vacancyId`, and
  `DELETE /api/favorites/:vacancyId` require a signed-in account.

The database is stored locally in `.data/arbeitflow.sqlite`.

## Deploy

The Vite frontend is a static site and can be deployed independently. The Express
API needs a Node.js host with Node.js 22.13 or newer and persistent storage for
SQLite.

### GitHub Pages

In the repository settings, select **Settings → Pages → GitHub Actions**. The
workflow in `.github/workflows/deploy.yml` builds the site with the repository
base path, adds a fallback for direct links such as `/vacancies`, and deploys
`dist`. Add the repository variable `VITE_API_BASE_URL` with the API origin, for
example `https://api.example.com` (without a trailing slash). Set the optional
`VITE_BASE_PATH` repository variable when using a custom domain or a nonstandard
Pages path. Without an API origin, static pages load but sign-in, favorites, and
administration need an API available at the same origin.

### Netlify

Import the repository into Netlify. The included `netlify.toml` configures
`npm run build`, publishes `dist`, and enables SPA routing. Set
`VITE_API_BASE_URL` in the site's build environment to the API origin.

### Express API

Deploy the repository as a Node.js service. Build with `npm ci && npm run build`
and start with `npm start`. Configure the service to bind to `0.0.0.0`, and mount
a persistent disk for the SQLite file. Set these server environment variables:

```text
NODE_ENV=production
HOST=0.0.0.0
DB_PATH=/path/to/persistent-storage/arbeitflow.sqlite
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong private password>
USER_EMAIL=user@example.com
USER_PASSWORD=<strong private password>
CORS_ORIGIN=https://your-frontend.example
COOKIE_SAME_SITE=none
```

Run `npm run setup:local` once after configuring the account variables to create
the accounts and initialize the database. Passwords are hashed before storage;
deployment credentials are read from the server environment and are not written
to the frontend bundle. `CORS_ORIGIN` accepts a comma-separated allow-list of
exact frontend origins. `COOKIE_SAME_SITE=none` is required when the frontend and
API are on different sites and requires HTTPS; use `strict` for same-site
deployments. The API rejects state-changing browser requests from unlisted
cross-origin origins while allowing same-origin requests. Browsers may block
cookies when the frontend and API are on different sites; a same-site custom
domain or same-origin API proxy is the most reliable setup for sign-in.

`VITE_BASE_PATH` defaults to `/`; set it to a trailing-slash path such as
`/my-repository/` when building for another subpath. The service worker is
registered on production builds, caches the app shell and static assets for
offline loading, and never caches API responses. PWA installation requires HTTPS
or localhost.
