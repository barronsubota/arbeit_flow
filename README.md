# ArbeitFlow

Static junior IT job platform built with React, TypeScript, and Vite.

The site includes a home page at `/`, a searchable vacancy catalog at
`/vacancies`, and a contact page at `/contacts`.

## Run locally

```sh
npm install
npm run dev
```

Vite serves the site at `http://127.0.0.1:4173`.

## Build and test

```sh
npm test
npm run build
```

## Vacancy catalog

Vacancies are static content maintained in `src/data/vacancies.ts`. Search,
location, and technology filters run in the browser. Saved vacancies are stored
in the current browser's `localStorage`; they are not synced between devices.

This static version has no accounts, authentication, admin page, server, or
database. Vacancy changes require editing the data file and deploying the site
again. The contact form is also a browser-only demo and does not send messages.

## Deploy to Netlify

Import the repository into Netlify. The included `netlify.toml` runs
`npm test && npm run build`, publishes `dist`, and enables SPA routing. No API
URL or server environment variables are required.

The project can also be deployed to GitHub Pages using the workflow in
`.github/workflows/deploy.yml`. `VITE_BASE_PATH` defaults to `/`; set it to a
trailing-slash path such as `/my-repository/` when building for a subpath.

The production service worker caches the app shell and static assets for offline
loading. PWA installation requires HTTPS or localhost.
