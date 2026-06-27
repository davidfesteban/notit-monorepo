# Notit

Markdown notes backed by a GitHub repository. The product code lives in `app/`; native shells live under `platforms/`.

## Structure

- `app/` - Svelte app source
- `platforms/ios/` - Capacitor iOS shell
- `platforms/android/` - Capacitor Android shell
- `platforms/desktop/` - Tauri desktop shell

## Commands

```sh
npm install
npm run dev
npm run build
npm run check
npm run test:e2e
npm run mcp:notit
```

Platform builds:

```sh
npm run desktop
npm run desktop:build
npm run ios
npm run android
```

Create a local `app/.env` from `app/.env.example` with the GitHub client id:

```sh
VITE_GITHUB_CLIENT_ID=your_client_id
```

## Local MCP

```sh
NOTIT_REPO_DIR=/absolute/path/to/your/notit-notes-repo npm run mcp:notit
```

Use this for local Codex integration. ChatGPT mobile should read the same GitHub notes repo through a connector or a future hosted MCP endpoint.
