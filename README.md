# VRCX

[![GitHub Workflow Status](https://github.com/pypy-vrc/VRCX/actions/workflows/github_actions.yml/badge.svg)](https://github.com/pypy-vrc/VRCX/actions/workflows/github_actions.yml)
[![VRCX Discord Invite](https://img.shields.io/discord/854071236363550763?color=%237289DA&logo=discord&logoColor=white)](https://vrcx.pypy.moe/discord)

VRCX is an assistant application for VRChat that provides information about and managing friendship. This application uses the unofficial VRChat API (VRCSDK).

VRCX isn't endorsed by VRChat and doesn't reflect the views or opinions of VRChat or anyone officially involved in producing or managing VRChat. VRChat is trademark of VRChat Inc. VRChat © VRChat Inc.

pypy & Natsumi are not responsible for any problems caused by VRCX. ***Use at your own risk!***


## How to install VRCX

* Download latest release setup from [here](https://github.com/pypy-vrc/VRCX/releases/latest).
* Run `VRCX_Setup.exe`.

## Is VRCX against VRChat ToS?

**TL;DR:** no.

*VRChat's official stance on usage of the API, as listed in their Discord #faq channel.*
![vrchat api](https://user-images.githubusercontent.com/11171153/114227156-b559c400-99c8-11eb-9df6-ee6615b8118e.png)

Screenshots
=
### Login
![login](https://user-images.githubusercontent.com/82102170/178106023-6ae98d45-0cc8-4174-baf9-4e6188082853.png)
![2fa](https://user-images.githubusercontent.com/82102170/178106050-975072a4-766a-4b00-8ebb-2ba829f1506b.png)

### Feed
![01feed](https://user-images.githubusercontent.com/82102170/178106390-644e34b1-76cd-4f44-811a-ed05c7ff60b8.png)
### GameLog
![02gamelog](https://user-images.githubusercontent.com/82102170/178106694-29ff1659-7050-43a1-ae54-b9e1171145ac.png)
### UserInfo
![03search](https://user-images.githubusercontent.com/82102170/178106833-68d5584e-3cf6-4ffb-9ef1-19c359915e82.png)
![note](https://user-images.githubusercontent.com/82102170/178106941-36960e75-e0ac-489a-975e-bf47824911a4.png)
### World
![09w1](https://user-images.githubusercontent.com/82102170/178107058-7eb833d0-7a37-4780-a654-5e002e3cc95f.png)
![09w2](https://user-images.githubusercontent.com/82102170/178107085-0815d23b-fb3c-4434-b57a-cce9ac524e00.png)
### Favorite
![04favavatar](https://user-images.githubusercontent.com/82102170/178107292-ec8691e8-657b-4266-9780-7027437483af.png)
![04favworld](https://user-images.githubusercontent.com/82102170/178107326-63b9d1bc-93e1-47d1-bb32-e77244ca961b.png)
![04favuser](https://user-images.githubusercontent.com/82102170/178107414-f2371c29-89d7-4155-9053-7cebf3ad2bd6.png)
### FriendsLog
![05fr](https://user-images.githubusercontent.com/82102170/178107611-191b272f-1640-401c-b553-bc0cf7a8cfa0.png)
### Moderation
![06mo](https://user-images.githubusercontent.com/82102170/178107715-59d1d35f-595e-4cc0-8c1d-4142f9d49635.png)
### Notification
![07no](https://user-images.githubusercontent.com/82102170/178107869-f8292dce-6d3f-4d5a-89f5-f4bc11ac943d.png)
### PlayerList
![10playerlist](https://user-images.githubusercontent.com/82102170/178107947-dc153a6e-c553-48f9-bc86-45b45a7de86e.png)
### Settings
![08op1](https://user-images.githubusercontent.com/82102170/178108340-9da1fd80-71e6-4c69-b210-f28f3f259fe1.png)
![08op2](https://user-images.githubusercontent.com/82102170/178108364-32f79f72-005c-45da-b8f1-20dd77443a6a.png)
![08op3](https://user-images.githubusercontent.com/82102170/178108373-930c36ea-78e7-4f32-ab85-59f934fb3297.png)
![08op4](https://user-images.githubusercontent.com/82102170/178108383-2165fef6-293d-44a9-8f39-7e007939f7e4.png)
![08op5](https://user-images.githubusercontent.com/82102170/178108402-d921c47e-b581-4b9b-8b6f-fa553d4d34de.png)
![08op6](https://user-images.githubusercontent.com/82102170/178109408-42d5106d-b68f-4201-918b-6aaf648e19a3.png)

### Join
![join](https://user-images.githubusercontent.com/82102170/178108718-a75d2371-c46f-45e4-aa75-558b10211f46.png)
### NewInstance
![newin](https://user-images.githubusercontent.com/82102170/178108739-858033d4-435c-4b13-be60-b3111e57f72a.png)
### Discord Rich Presence
![dis](https://user-images.githubusercontent.com/82102170/178109155-7888e67a-c02d-4732-aebb-4fceb162984d.png)

### VR Overlay
![overlay1](https://user-images.githubusercontent.com/82102170/178281800-af4c69da-a0f5-43d8-9515-e960e1a16b39.png)
![overlay2](https://user-images.githubusercontent.com/82102170/178281884-ea1df88c-f16c-4c83-825c-c285f49b1ff1.png)


## How to run VRCX on Linux

* [Guide](https://github.com/RinLovesYou/VRChat-Linux/wiki/VRCX) made by [RinLovesYou](https://github.com/RinLovesYou)

## How to build VRCX from source

* Get source code
    * Download latest source code [zip](https://github.com/pypy-vrc/VRCX/archive/master.zip) or clone repo with `git clone`.

* Build .NET
    * Install [Visual Studio](https://visualstudio.microsoft.com/) if it's not already installed.
    * In Visual Studio "Open Project/Solution" and browse to the [Solution file](https://docs.microsoft.com/en-us/visualstudio/extensibility/internals/solution-dot-sln-file) provided inside the downloaded source code.
    * Set [Configuration](https://docs.microsoft.com/en-us/visualstudio/ide/understanding-build-configurations?view=vs-2019) to `Release` and Platform to `x64`
    * Restore [NuGet](https://docs.microsoft.com/en-us/nuget/consume-packages/package-restore#restore-packages-automatically-using-visual-studio) packages.
    * [Build](https://docs.microsoft.com/en-us/visualstudio/ide/building-and-cleaning-projects-and-solutions-in-visual-studio) Solution.

* Build Node.js
    * Download and install [Node.js](https://nodejs.org/en/download/).
    * Run `build-node.js.cmd`.
    * Run `make-junction.cmd`.

* Create release zip
    * Run `make-zip.cmd` for [Bandizip](https://www.bandisoft.com/bandizip) or `make-zip-7z.cmd` for [7-Zip](https://www.7-zip.org).
