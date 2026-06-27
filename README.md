# Notit

Svelte monorepo scaffold for a note-taking app.

## Structure

- `app/` - Svelte app source
- `platforms/ios` - Capacitor iOS shell
- `platforms/android` - Capacitor Android shell
- `platforms/desktop` - Tauri desktop shell
- `backend/` - reserved for backend code when needed

## Commands

```sh
npm install
npm run dev
npm run check
npm run build
```

Platform wrappers:

```sh
npm run ios
npm run android
npm run desktop
```

Tauri desktop builds require Rust/Cargo installed.

## GitHub auth

Create a GitHub OAuth/GitHub App with Device Flow enabled, then run the app with:

```sh
VITE_GITHUB_CLIENT_ID=your_client_id npm run dev
```
# Web build only
  npm run build

  # Desktop app build (Tauri)
  npm run desktop:build

  # iOS / Android: build web app + sync Capacitor native projects
  npm run mobile:sync

  Then open native IDEs:

  # iOS in Xcode
  npm run ios

  # Android in Android Studio
  npm run android

  For development:

  npm run dev
  npm run desktop
