# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend dev server (port 9000)
npm run dev              # Windows/CEF platform
npm run dev-linux        # Linux/Electron platform

# Production frontend build (outputs to build/html/)
npm run prod             # Windows/CEF
npm run prod-linux       # Linux/Electron

# Lint (runs oxlint then eslint)
npm run lint

# Format
npm run format           # fix in place
npm run format:check     # check only

# Type checking (JS files via tsconfig.checkjs.json)
npm run typecheck:js

# Tests
npm test                 # run once
npm run test:coverage    # with coverage

# .NET builds (requires dotnet CLI)
dotnet build Dotnet/VRCX-Cef.csproj -p:Configuration=Release -p:Platform=x64 -p:PlatformTarget=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m -a x64 --self-contained
dotnet build 'Dotnet/VRCX-Electron.csproj' -p:Configuration=Release -p:Platform=x64 -p:PlatformTarget=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m -a x64

# Electron app (after building .NET + frontend)
npm run build-electron        # x64 AppImage/DMG
npm run build-electron-arm64  # arm64
npm run start-electron        # dev run with hot-reload
```

Tests live in `src/**/__tests__/` and match `src/**/*.{test,spec}.js`.

## Architecture

VRCX is a VRChat companion app with two platform targets sharing the same Vue 3 frontend:

- **Windows** — CEF (CefSharp/WinForms) + .NET 10, built from `Dotnet/VRCX-Cef.csproj`
- **Linux/macOS** — Electron + .NET 9 via `node-api-dotnet`, built from `Dotnet/VRCX-Electron.csproj`

The `PLATFORM` environment variable (`windows` | `linux`) controls which platform the frontend is compiled for. Vite injects `WINDOWS` and `LINUX` as compile-time boolean globals — use these to guard platform-specific code paths.

### Frontend (`src/`)

Layered Vue 3 app:

| Layer | Path | Role |
|---|---|---|
| API | `src/api/` | Raw VRChat API calls (one file per entity type) |
| Services | `src/services/` | Low-level infrastructure: SQLite, WebSocket, HTTP request wrapper, config |
| Coordinators | `src/coordinators/` | Business logic — orchestrate API calls and update stores |
| Stores | `src/stores/` | Pinia state (one store per domain) |
| Queries | `src/queries/` | TanStack Query for server-state caching |
| Views/Components | `src/views/`, `src/components/` | Vue UI |

Entry point is `src/app.js`. The VR overlay has its own separate entry (`src/vr/`, `src/vr.html`).

### .NET ↔ JS bridge

The frontend calls .NET methods through a platform-specific bridge:

- **Electron**: `src/ipc-electron/interopApi.js` — a `Proxy` that routes calls through `window.interopApi.callDotNetMethod(className, methodName, args)`, exposed by the Electron preload script via `node-api-dotnet`
- **CEF (Windows)**: direct JS interop — `interopApi` calls resolve to `undefined` and are handled natively

On the .NET side, `Dotnet/AppApi/` contains the exposed API classes (`AppApi/Common/`, `AppApi/Cef/`, `AppApi/Electron/`). IPC between the VRChat game process and VRCX is handled in `Dotnet/IPC/`.

### Electron main process (`src-electron/`)

`main.js` bootstraps Electron: sets `DOTNET_ROOT`, checks .NET availability, loads the bundled HTML, and sets up `ipcMain` handlers. Build-time scripts (`patch-package-version.js`, `patch-node-api-dotnet.js`, `rename-builds.js`, `download-dotnet-runtime.js`) run as npm lifecycle hooks.

## CI / GitHub Actions

Jobs in `.github/workflows/github_actions.yml` and their dependency order:

```
set_version
├── build_cef_html         → Cef-html artifact        (npm run prod)
├── build_electron_html    → Electron-html artifact    (npm run prod-linux)
├── build_dotnet_linux     → Electron-Release-Linux-{x64,arm64}  (sequential, single job)
└── build_dotnet_macos     → Electron-Release-macOS-{x64,arm64}  (sequential, single job)

build_dotnet_windows  (needs: set_version, build_cef_html)
build_node            (needs: set_version, build_dotnet_linux, build_electron_html)
build_electron_macos  (needs: set_version, build_dotnet_macos, build_electron_html)

create_setup          (needs: set_version, build_dotnet_windows, build_node, build_electron_macos)
```

- `build_dotnet_linux` / `build_dotnet_macos` build x64 then arm64 **sequentially** (no matrix) with a `rm -R build/Electron` cleanup between the two arches.
- `build_node` and `build_electron_macos` **download** `Electron-html` from `build_electron_html`; they do not build HTML themselves.
- Azure code signing steps are conditional on `secrets.AZURE_CLIENT_ID` being set.

## Performance baseline

Design for users with **1,000–4,000 friends** and databases up to **8 GB**. Any feature touching data operations should be validated against these scales.
