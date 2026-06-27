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
```

Platform builds:

```sh
npm run desktop
npm run desktop:build
npm run ios
npm run android
```

Create `app/.env` with the GitHub client id:

```sh
VITE_GITHUB_CLIENT_ID=your_client_id
```
