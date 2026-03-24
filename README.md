<div align="center">

# <img src="https://raw.githubusercontent.com/vrcx-team/VRCX/master/images/VRCX.ico" width="64" height="64"> VRCX-jirai

[![GitHub Workflow Status](https://github.com/FuLuTang/VRCX-jirai/actions/workflows/github_actions.yml/badge.svg)](https://github.com/FuLuTang/VRCX-jirai/actions/workflows/github_actions.yml)

**专为地雷人打造的视奸神器**

</div>

这是 [VRCX](https://github.com/vrcx-team/VRCX) 的个人分支。原版 VRCX 已经很好用了，但作为一名合格的地雷人，光知道朋友在不在线怎么够？你还需要知道 TA 和谁在一起、去了哪里、待了多久——于是就有了这个版本。

可以从 [Releases](https://github.com/FuLuTang/VRCX-jirai/releases/latest) 页面下载最新安装包（`VRCX_Setup.exe`）直接安装。如需从源码构建，请参考下方"从源码构建"说明。

# 核心特色：视奸

<div align="left">

本分支最核心的功能就一个字：**奸**。

- :mag_right: **双人关系**（重点推荐）
    - 从好友列表中选择两个人，查看这两人曾经在同一个房间里共存过的所有记录。
    - 显示共存总时长、共同出现的次数，以及每次共存的具体时间、地点和持续时长。
    - 换句话说：你想知道 A 和 B 到底有多熟吗？数据会告诉你答案。
    - ⚠️ 查询优先基于 `OnPlayerLeft` 日志（精确实例共存）；另外也会结合好友的 GPS/上下线历史推断一部分“你没进过但两人可能共存过”的实例记录。

</div>

# 其他新增功能

<div align="left">

- :fire: **热门世界**（HotWorlds）
    - 统计你在一段时间内（7 天 / 30 天 / 90 天）去得最多的世界，顺便反省一下自己的 VRC 人生。
- :busts_in_silhouette: **共同好友**（MutualFriends）
    - 查看你与某位好友之间有哪些共同好友。
- :chart_with_upwards_trend: **房间活动分析**（InstanceActivity）
    - 可视化展示你进出各房间的活动记录，支持查看单个房间的详细进出历史。

</div>

# 从源码构建

请参考上游仓库的 [Building from source](https://github.com/vrcx-team/VRCX/wiki/Building-from-source) 说明进行构建。

---

<div align="center">

# <img src="https://raw.githubusercontent.com/vrcx-team/VRCX/master/images/VRCX.ico" width="64" height="64"> </img> VRCX（原版说明）

[![GitHub release](https://img.shields.io/github/release/vrcx-team/VRCX.svg)](https://github.com/vrcx-team/VRCX/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/vrcx-team/VRCX/total?color=6451f1)](https://github.com/vrcx-team/VRCX/releases/latest)
[![GitHub Workflow Status](https://github.com/vrcx-team/VRCX/actions/workflows/github_actions.yml/badge.svg)](https://github.com/vrcx-team/VRCX/actions/workflows/github_actions.yml)
[![VRCX Discord Invite](https://img.shields.io/discord/854071236363550763?color=%237289DA&logo=discord&logoColor=white&label=discord)](https://vrcx.app/discord)

| **English** | [Français](./README/README.fr.md) | [日本語](./README/README.jp.md) | [简体中文](./README/README.zh_CN.md) | [Italiano](./README/README.it.md) | [Русский](./README/README.ru_RU.md) | [Español](./README/README.es.md) | [Polski](./README/README.pl.md) | [ภาษาไทย](./README/README.th.md)

VRCX is an assistant/companion application for VRChat that provides information about and helps you accomplish various things related to VRChat in a more convenient fashion than relying on the plain VRChat client (desktop or VR), or website alone. It also includes some other neat features outlined below.

# Getting Started

<div align="center">

Download and install the latest installer (`VRCX_Setup.exe`) from [here](https://github.com/vrcx-team/VRCX/releases/latest).

For macOS and Linux check [here](https://github.com/vrcx-team/VRCX/wiki/Running-VRCX-on-Linux) for more info.

Beta/nightly build available [here](https://vrcx.app/github/nightly) or in-app `Settings -> General -> Change build`.

# Features

<div align="left">

- :family: Friend, world, and avatar list management
    - Manage your friends list, world/group/avatar lists outside of VRChat.
    - Monitor the activity of your friends and track their online status, locations, and avatars.
    - Track friendship history including add dates, time spent together, and name changes.
    - Save notes and memos to help remember how you met.
- :bar_chart: Customizable Dashboard with widgets
    - Build personalized multi-panel layouts with Feed, GameLog, and Instance widgets.
    - Create multiple dashboards, each with configurable event filters and column visibility.
- :mag: Powerful search across all entities
    - Search for users, worlds, avatars, and groups, or paste IDs and URLs for direct access.
    - Quick Search provides instant client-side fuzzy search across your friends, avatars, worlds, and groups.
- :chart_with_upwards_trend: Activity Heatmap
    - Visualize a user's online activity patterns with a day-of-week × hour-of-day heatmap, including peak stats.
- :camera: Store world data in the pictures you take in-game, so you can remember that one world you took those cool pictures in like... 6 months ago!
- :bell: Monitor/respond to notifications
    - You can send/receive invites and friend requests from VRCX as well as see the instance info of invites that you receive.
- :scroll: See stats/players for your current instance
- :tv: See the links to videos that are playing in the world you're in, as well as various other logged data.
- :performing_arts: Social Status Presets
    - Save and quickly apply status + status description combinations from the sidebar or user dialog.
- :rotating_light: VRChat Server Status
    - A status bar indicator and login page alert inform you of VRChat server issues and outages in real time.
- :bar_chart: Improved Discord Rich Presence
    - Display detailed instance information in Discord, including world thumbnail, name, player count, and a join button for public lobbies.
- :crystal_ball: VR Overlay with configurable live feed of all supported events/notifications
- :outbox_tray: Upload and manage avatar/world images and details without Unity
- :electric_plug: Automatically launch apps when you start VRChat
- :skull: Automatically restart and join last instance when VRC crashes
- :left_right_arrow: Export/import data
    - Export friends list, avatar list, Discord names, notes, and favorite groups. Import favorite groups and group moderation bans.

## Miscellaneous

- Want a new look for VRCX? Check out [Themes](https://github.com/vrcx-team/VRCX/wiki/Themes)
- See [Building from source](https://github.com/vrcx-team/VRCX/wiki/Building-from-source) for instructions on how to build VRCX from source.
- For a guide on how to run VRCX on Linux, see [here](https://github.com/vrcx-team/VRCX/wiki/Running-VRCX-on-Linux)
- Interested in contributing? See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

## Is VRCX against VRChat's TOS?

**No.**

VRCX is an external tool that uses the VRChat API to provide the features it does.

It does not modify the game in any way, only using the API responsibly to provide the features it does. It is not a mod, or a cheat, or any other form of modification to the game.

To see VRChat's stance on API usage, see the #faq channel in the VRChat Discord.

---

VRCX is not endorsed by VRChat and does not reflect the views or opinions of VRChat or anyone officially involved in producing or managing VRChat properties. VRChat and all associated properties are trademarks or registered trademarks of VRChat Inc. VRChat © VRChat Inc.
