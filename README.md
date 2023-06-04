<div align="center">

# <img src="https://raw.githubusercontent.com/vrcx-team/VRCX/master/VRCX.ico" width="64" height="64"> </img> VRCX 
[![GitHub release](https://img.shields.io/github/release/vrcx-team/VRCX.svg)](https://github.com/vrcx-team/VRCX/releases/latest)
[![GitHub Workflow Status](https://github.com/vrcx-team/VRCX/actions/workflows/github_actions.yml/badge.svg)](https://github.com/vrcx-team/VRCX/actions/workflows/github_actions.yml) 
[![VRCX Discord Invite](https://img.shields.io/discord/854071236363550763?color=%237289DA&logo=discord&logoColor=white)](https://vrcx.pypy.moe/discord)

| **English** | [日本語](./README.jp.md) |

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
- :electric_plug: Automatically launch apps when you start VRChat
  - You can configure VRCX to launch other apps when you start VRChat.
  - For example, you could have VRCX launch an OSC app or a voice changer app when VRChat opens up.
- :floppy_disk: World Persistence
  - For worlds that support the feature, VRCX can save world settings, save states, inventories, and other data!
  - **Note**: To use this feature, you must have "Allow Untrusted URLs" enabled in your VRChat settings.
  - For Developers: [Wiki Page - World Persistence (PWI)](https://github.com/vrcx-team/VRCX/wiki/World-Persistence-(PWI))
- :mag: Search for avatars, users, worlds, and groups
- :clipboard: Build a local, unrestricted world favorites list
- :camera: Store world data in the pictures you take in-game, so you can remember that one world you took those cool pictures in like... 6 months ago!
- :bell: Monitor/respond to notifications
  - You can send/receive invites and friend requests from VRCX as well as see the instance info of invites that you receive.
- :scroll: See stats/players for your current instance
- :tv: See the links to videos and that are playing in the world you're in, as well as various other logged data.
- :bar_chart: Improved Discord Rich Presence
  - You can optionally display more information about your current instance in Discord.
  - This includes the world thumbnail, name, instance ID, and player count, depending on your settings and whether the lobby is private. You can also add a join button for public lobbies!
- :crystal_ball: VR Overlay with configurable live feed of all supported events/notifications

## Miscellanous

- Want a new look for VRCX? Check out [Themes](https://github.com/vrcx-team/VRCX/wiki/Themes)
- See [Building from source](https://github.com/vrcx-team/VRCX/wiki/Building-from-source) for instructions on how to build VRCX from source.
- For a guide on how to run VRCX on linux, see [here](https://github.com/vrcx-team/VRCX/wiki/Running-VRCX-on-Linux)

# Screenshots

<div align="center">

<h3>Login</h3>

<table>
  <tr>
    <td align="center"><img src="https://user-images.githubusercontent.com/82102170/224703139-9cb24dda-3839-4f75-a665-cca69f9e08ea.png" alt="login"></td>
    <td align="center"><img src="https://user-images.githubusercontent.com/82102170/224703275-103e78fd-e917-428d-b901-6817d6b59b29.png" alt="2fa"></td>
  </tr>
</table>

<h3>Feed</h3>

<img src="https://user-images.githubusercontent.com/82102170/224714129-772d7418-034a-4fe3-aa2e-22ea71154d9a.png" alt="feed">

<h3>GameLog</h3>

<img src="https://user-images.githubusercontent.com/82102170/224714186-75cbf46d-f7b2-4a16-bcc5-2ec06d7f4b0d.png" alt="gamelog">

<h3>UserInfo</h3>

<h4>Me</h4>

<img src="https://user-images.githubusercontent.com/82102170/224704240-b10aba50-29b9-4ef4-b35a-958107a32cd6.png" alt="me">

<h4>Friend</h4>

<img src="https://user-images.githubusercontent.com/82102170/224714608-ac49621f-c28f-4266-8af8-715f4b9f2367.png" alt="friend">

<h3>World</h3>

<table>
  <tr>
    <td align="center"><img src="https://user-images.githubusercontent.com/82102170/224715566-67782a5e-f948-402b-b78d-1b2dd5e2382f.png" alt="instance"></td>
    <td align="center"><img src="https://user-images.githubusercontent.com/82102170/224715824-c0c4220e-4f20-4799-8419-f8138de35b7a.png" alt="info"></td>
  </tr>
</table>

<h3>Favorite</h3>

<h4>Friend</h4>

<img src="https://user-images.githubusercontent.com/82102170/224716414-5c6720bd-6d38-4e2d-9353-6bfaee47700e.png" alt="friend">

<h4>World</h4>

<img src="https://user-images.githubusercontent.com/82102170/224716652-ca54f3d1-449b-43f9-81f3-7bd0833c7d9d.png" alt="world">

<h4>Avatar</h4>

<img src="https://user-images.githubusercontent.com/82102170/224717146-37681b38-61ef-4302-8104-212c2161dc12.png" alt="avatar">

<h3>Friend Log</h3>

<img src="https://user-images.githubusercontent.com/82102170/224717793-dbbccdfd-4f89-4597-b38e-8070549b2cf8.png" alt="friendlog">

<h3>Discord Rich Presence</h3>

<img src="https://user-images.githubusercontent.com/82102170/224725991-3fc81a3d-ca15-4dcb-a057-d713803bd666.png" alt="discord">

<!-- The other images will be similar to this -->
</div>

## Is VRCX against VRChat's TOS?

**No.**

VRCX is an external tool that uses the VRChat API to provide the features it does. 

It does not modify the game in any way, only using the API responsibly to provide the features it does. It is not a mod, or a cheat, or any other form of modification to the game.

To see VRChat's stance on API usage, see the #faq channel in the VRChat Discord.

---

VRCX is not endorsed by VRChat and does not reflect the views or opinions of VRChat or anyone officially involved in producing or managing VRChat properties. VRChat and all associated properties are trademarks or registered trademarks of VRChat Inc. VRChat © VRChat Inc.

