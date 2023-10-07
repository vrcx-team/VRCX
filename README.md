<div align="center">

# <img src="https://raw.githubusercontent.com/vrcx-team/VRCX/master/VRCX.ico" width="64" height="64"> </img> VRCX

[![GitHub release](https://img.shields.io/github/release/vrcx-team/VRCX.svg)](https://github.com/vrcx-team/VRCX/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/vrcx-team/VRCX/total?color=6451f1)](https://github.com/vrcx-team/VRCX/releases/latest)
[![GitHub Workflow Status](https://github.com/vrcx-team/VRCX/actions/workflows/github_actions.yml/badge.svg)](https://github.com/vrcx-team/VRCX/actions/workflows/github_actions.yml)
[![Crowdin](https://badges.crowdin.net/vrcx/localized.svg)](https://crowdin.com/project/vrcx)
[![VRCX Discord Invite](https://img.shields.io/discord/854071236363550763?color=%237289DA&logo=discord&logoColor=white&label=discord)](https://vrcx.pypy.moe/discord)


| **English** | [Français](./README.fr.md) | [日本語](./README.jp.md) | [简体中文](./README.zh_CN.md) | [Italiano](./README.it.md)

VRCX is an assistant/companion application for VRChat that provides information about and helps you accomplish various things related to VRChat in a more convenient fashion than relying on the plain VRChat client (desktop or VR), or website alone. It also includes some other neat features outlined below.

# Getting Started

<div align="center">

Download and run the latest installer (`VRCX_Setup.exe`) from [here](https://github.com/vrcx-team/VRCX/releases/latest).

# Features

<div align="left">

- :family: Friend, world, and avatar list management
  - Manage your friends list, world/group/avatar lists outside of VRChat.
  - Monitor the world/avatar activity of your friends and check their online status.
  - Keep track of when you first added them and when you last saw them.
  - See how much time you've spent together in worlds and how many times.
  - Keep track of friend name changes.
  - Save notes to help remember how you met.
- :electric_plug: Automatically launch apps when you start VRChat
  - You can configure VRCX to launch other apps when you start VRChat.
  - For example, you could have VRCX launch an OSC app or a voice changer app when VRChat opens up.
- :floppy_disk: World Persistence
  - For worlds that support the feature, VRCX can save world settings, save states, inventories, and other data!
  - **Note**: To use this feature, you must have "Allow Untrusted URLs" enabled in your VRChat settings.
  - For Developers: [Wiki Page - World Persistence (PWI)](<https://github.com/vrcx-team/VRCX/wiki/World-Persistence-(PWI)>)
- :mag: Search for avatars, users, worlds, and groups
- :earth_americas: Build a local, unrestricted world favorites list
- :camera: Store world data in the pictures you take in-game, so you can remember that one world you took those cool pictures in like... 6 months ago!
- :bell: Monitor/respond to notifications
  - You can send/receive invites and friend requests from VRCX as well as see the instance info of invites that you receive.
- :scroll: See stats/players for your current instance
- :tv: See the links to videos and that are playing in the world you're in, as well as various other logged data.
- :bar_chart: Improved Discord Rich Presence
  - You can optionally display more information about your current instance in Discord.
  - World integration for popular worlds like PyPyDance, LSMedia, Movies&Chill and VRDancing.
  - This includes the world thumbnail, name, instance ID, and player count, depending on your settings and whether the lobby is private. You can also add a join button for public lobbies!
- :crystal_ball: VR Overlay with configurable live feed of all supported events/notifications
- :outbox_tray: Upload avatar/world images without Unity
- :page_facing_up: Manage and edit uploaded avatar/world details without Unity
- :skull: Automatically restart and join last instance when VRC crashes
- :left_right_arrow: Export/import favorite groups

## Miscellanous

- Want a new look for VRCX? Check out [Themes](https://github.com/vrcx-team/VRCX/wiki/Themes)
- See [Building from source](https://github.com/vrcx-team/VRCX/wiki/Building-from-source) for instructions on how to build VRCX from source.
- For a guide on how to run VRCX on linux, see [here](https://github.com/vrcx-team/VRCX/wiki/Running-VRCX-on-Linux)

# Screenshots

<div align="center">

<h3>Login</h3>

<table>
  <tr>
    <td align="center"><img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251994190-5e6a961e-b2fe-4d3b-bf66-455d8626b8bf.png" alt="login"></td>
    <td align="center"><img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251994414-a21faf59-6199-45de-94e7-a093a6b8c0ac.png" alt="2fa"></td>
  </tr>
</table>

<h3>Feed</h3>

<img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251987020-9839a2c9-47db-4271-b1bf-8e07669a7056.png" alt="feed">

<h3>GameLog</h3>

<img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251987498-b82266ed-131d-42ad-be2f-b167f24acf9f.png" alt="gamelog">

<h3>UserInfo</h3>

<h4>Me</h4>

<img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251990237-0c863d27-141c-4447-82de-4279ab8973ea.png" alt="me">

<h4>Friend</h4>

<img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251989666-8f918786-e632-451d-be29-f92d2c681b80.png" alt="friend">

<h3>World</h3>

<table>
  <tr>
    <td align="center"><img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251991003-37a986bb-470c-442b-8ada-31918f7b2017.png" alt="instance"></td>
    <td align="center"><img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251991217-0d40846f-ac08-48c0-8e4d-18c35fe0999b.png" alt="info"></td>
  </tr>
</table>

<h3>Favorite</h3>

<h4>Friend</h4>

<img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251992424-ba406d0f-787e-4e2d-89bd-4caa0a05d31f.png" alt="friend">

<h4>World</h4>

<img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251992950-8f2c6cdc-dc9a-4a60-b59f-9fa80d071359.png" alt="world">

<h4>Avatar</h4>

<img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251993408-66d11100-15a8-484f-b9fd-82be1516c9be.png" alt="avatar">

<h3>Friend Log</h3>

<img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251993741-e2033095-4ceb-4552-8b79-9285325c1e49.png" alt="friendlog">

<h3>Discord Rich Presence</h3>

<img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251997318-5a71249c-59fc-4ad6-9194-d6b1d4165600.png" alt="discord">

<!-- The other images will be similar to this -->
</div>

## Is VRCX against VRChat's TOS?

**No.**

VRCX is an external tool that uses the VRChat API to provide the features it does.

It does not modify the game in any way, only using the API responsibly to provide the features it does. It is not a mod, or a cheat, or any other form of modification to the game.

To see VRChat's stance on API usage, see the #faq channel in the VRChat Discord.

---

VRCX is not endorsed by VRChat and does not reflect the views or opinions of VRChat or anyone officially involved in producing or managing VRChat properties. VRChat and all associated properties are trademarks or registered trademarks of VRChat Inc. VRChat © VRChat Inc.
