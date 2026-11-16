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
