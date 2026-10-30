<div align="center">

# <img src="images/Nexy.svg" width="64" height="64"> Nexy

[![GitHub release](https://img.shields.io/github/release/valzzu/nexy.svg)](https://github.com/valzzu/nexy/releases/latest)

A friendship companion for [NexVR](https://nexvr.net).

</div>

Nexy keeps track of your NexVR friends: who is online, where they are, who you were in an instance with, and how that changed over time. It runs alongside the NexVR client (or on its own) and keeps its history on your computer.

Nexy is a fork of [VRCX](https://github.com/vrcx-team/VRCX), the companion app for VRChat, rebuilt to talk to NexVR instead.

## Getting started

Download the latest installer (`Nexy_<version>_Setup_x64.exe`) from [Releases](https://github.com/valzzu/nexy/releases/latest) and run it.

Sign in with your NexVR **username** (not your email) and password. Two-factor authentication works with an authenticator app, a recovery code, or an emailed code.

## Features

- **Friends, live.** Online, in-world and offline friends, updated the moment they move, with each friend's location, status and region.
- **Feed and friend log.** A history of friends coming online, changing worlds, statuses and bios, and of friends added or removed.
- **Game log and player list.** While the NexVR client is running, Nexy logs each instance you join and who joins and leaves it.
- **Profiles.** Bios, pronouns, social rank, NexVR badges (age and ID verification, staff, creator), groups and spoken languages.
- **Worlds and instances.** World details, instance info, and one-click join through the NexVR client.
- **Invites and friend requests.** Send invites and invite requests, and accept or decline friend requests from the notification list.
- **Groups.** Browse groups, join or leave them, and create your own.
- **Notes and memos** about people, kept locally.
- **Dashboards, charts and quick search**, as in VRCX.
- **NexVR Credits** balance on your profile.

## How it works

- **Sign-in** uses NexVR's own login, the same as nexvr.net. Your session is stored locally and refreshed automatically. NexVR's OAuth apps only grant identity, which isn't enough for a friends list.
- **Live data** (friends, presence, notifications, who is in your instance) comes over NexVR's realtime connection. The rest is NexVR's public API.
- **Staying online:** while Nexy is signed in it tells NexVR you are active, the same way nexvr.net does, so friends see you as online.
- **Game detection** looks for the NexVR client process (`NexVR.exe`).
- **History** (feed, game log, friend log, notes) is stored on your computer in `%APPDATA%\Nexy`.

## Not available yet

These VRCX features rely on VRChat services that NexVR doesn't have, or haven't been ported yet. They are hidden for now:

- Favorites, avatars and My Avatars
- Mutual friends and the mutual-friends chart
- Direct access by ID or URL
- VRChat-specific tools (screenshot metadata, gallery, VRChat config and launch options, registry backup, and similar)
- Automatic updates; download new versions from Releases

## Building from source

Requirements: [Node.js](https://nodejs.org/) 24.15 or newer and the [.NET 10 SDK](https://dotnet.microsoft.com/download).

```bash
npm ci
```

Run in development, with the frontend dev server and Electron side by side:

```bash
dotnet build Dotnet/VRCX-Electron.csproj -p:Configuration=Release -p:Platform=x64 --runtime win-x64
npm run dev
npm run start-electron
```

Build the Windows installer into `build/`:

```bash
dotnet build Dotnet/VRCX-Electron.csproj -p:Configuration=Release -p:Platform=x64 --runtime win-x64
npm run prod
npm run build-electron
```

The NexVR integration lives in [`src/services/nexvr/`](src/services/nexvr/): the API translation layer, the realtime client, and the game session feed.

Nexy icons are sourced from `images/Nexy.svg` and `images/Nexy_notify.svg`, with PNG and ICO files committed for packaging.

Found a bug or have a request? [Open an issue](https://github.com/valzzu/nexy/issues).

## Credits

Nexy is built on [VRCX](https://github.com/vrcx-team/VRCX) by pypy, Natsumi, Map1en and its contributors, used under the MIT license. See [LICENSE](LICENSE).

---

Nexy is not endorsed by NexVR and does not reflect the views or opinions of NexVR or anyone officially involved in producing or managing NexVR. NexVR and all associated properties are trademarks of their respective owners.
