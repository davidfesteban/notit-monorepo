# AGENTS.md

## Project

Notit is a Svelte note app that stores notes as Markdown files in GitHub. There is no backend in this repo.

## Layout

- `app/` contains the real product code.
- `platforms/ios/` and `platforms/android/` are Capacitor shells.
- `packages/notit-mcp/` is the local STDIO MCP server for Codex.
- `.github/workflows/pages.yml` publishes the web build to GitHub Pages.

## Commands

```sh
npm install
npm run dev
npm run build
npm run check
npm run test:e2e
npm run mcp:notit
```

Mobile:

```sh
npm run mobile:sync
npm run ios
npm run android
```

## Environment

Use one local app env file only:

```sh
app/.env
```

Required value:

```sh
VITE_GITHUB_CLIENT_ID=...
```

`app/.env` is intentionally tracked so distributed builds use the Notit GitHub OAuth app.

## Notes For Agents

- Keep product logic in focused feature folders under `app/src/features`.
- Do not add a backend unless the user explicitly asks for one.
- Keep wrapper/platform build config inside `platforms/`.
- Keep local MCP work in `packages/notit-mcp`; it should run without a hosted backend.
- Validate layout changes with Playwright when practical.

## Local MCP

Start the Notit MCP server with:

```sh
NOTIT_REPO_DIR=/absolute/path/to/your/notit-notes-repo npm run mcp:notit
```

Add it to Codex with:

```sh
codex mcp add notit \
  --env NOTIT_REPO_DIR=/absolute/path/to/your/notit-notes-repo \
  -- node /absolute/path/to/notit-monorepo/packages/notit-mcp/server.js
```
