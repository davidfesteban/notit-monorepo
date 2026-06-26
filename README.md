# Notit

Svelte monorepo scaffold for a note-taking app.

## Structure

- `app/` - Svelte app, Capacitor mobile targets, and Tauri desktop target
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
