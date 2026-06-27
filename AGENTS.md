# AGENTS.md

## Project

Notit is a Svelte note app that stores notes as Markdown files in GitHub. There is no backend in this repo.

## Layout

- `app/` contains the real product code.
- `platforms/ios/` and `platforms/android/` are Capacitor shells.
- `platforms/desktop/` is the Tauri shell.
- `.github/workflows/pages.yml` publishes the web build to GitHub Pages.

## Commands

```sh
npm install
npm run dev
npm run build
npm run check
npm run test:e2e
```

Desktop:

```sh
npm run desktop
npm run desktop:build
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

Do not commit `app/.env`; keep `app/.env.example` as the tracked template.

## Notes For Agents

- Keep product logic in focused feature folders under `app/src/features`.
- Do not add a backend unless the user explicitly asks for one.
- Keep wrapper/platform build config inside `platforms/`.
- Validate layout changes with Playwright when practical.
