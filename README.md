# frontend-engineer

A lightweight React + TypeScript chat UI for the Doodle frontend challenge.

## Quick start

```bash
npm install
npm run dev
```

The app expects the chat API to be running locally at `http://localhost:3000/api/v1` and uses the default token from the challenge (`super-secret-doodle-token`).

## Environment variables

You can override the defaults with Vite env vars:

```
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TOKEN=super-secret-doodle-token
```