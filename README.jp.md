<div align="center">

# <img src="https://raw.githubusercontent.com/vrcx-team/VRCX/master/VRCX.ico" width="64" height="64"> </img> VRCX

[![GitHub release](https://img.shields.io/github/release/vrcx-team/VRCX.svg)](https://github.com/vrcx-team/VRCX/releases/latest)
[![GitHub Workflow Status](https://github.com/vrcx-team/VRCX/actions/workflows/github_actions.yml/badge.svg)](https://github.com/vrcx-team/VRCX/actions/workflows/github_actions.yml)
[![VRCX Discord Invite](https://img.shields.io/discord/854071236363550763?color=%237289DA&logo=discord&logoColor=white)](https://vrcx.pypy.moe/discord)

| [English](./README.md) | **日本語** | [简体中文](./README.zh_CN.md)

VRCX は VRChat のアシスタント/コンパニオンアプリケーションで、VRChat クライアント (デスクトップ & VR) や Web サイト以上に様々な情報を提供し、より便利に VRChat をプレイできるようにします。

# インストール方法

<div align="center">

[こちら](https://github.com/vrcx-team/VRCX/releases/latest)から最新のインストーラー (`VRCX_Setup.exe`) をダウンロードして実行してください。

# 機能

<div align="left">

- :family: フレンド、ワールド、アバターの管理
  - VRChat に入らずともフレンドやワールド、グループ、アバターリストを管理することができます。
  - フレンドのワールド/アバターのアクティビティを見たり、オンラインステータスを確認したりできます。
  - いつフレンドになったのか、最後に会ったのはいつなのか、記録しておきましょう！
  - 一緒に過ごした時間や回数も確認できます。
- :electric_plug: VRChat 起動時に一緒にアプリを起動
  - VRChat の起動時に他のアプリを同時起動できるよう設定できます。
  - 例えば、VRChat を起動したら同時に OSC アプリやボイスチェンジャーを起動するようにできます。
- :floppy_disk: ワールドの永続化
  - 対応ワールドでは、設定やセーブデータ、インベントリなどのデータを保存することができます。
  - **注意**: この機能を使うには、VRChat の設定で「Allow Untrusted URLs」を有効化しておく必要があります。
  - 開発者向け: [Wiki Page - World Persistence (PWI)](<https://github.com/vrcx-team/VRCX/wiki/World-Persistence-(PWI)>)
- :mag: アバター、ユーザー、ワールド、グループの検索
- :clipboard: 無制限！ローカル保存のワールドお気に入りリスト
- :camera: ゲーム内で撮った写真にワールドデータを保存することで、綺麗な写真を撮ったあのワールドをいつでも思い出せます... たとえ半年前の写真であってもね！
- :bell: 通知の監視 & 対応
  - VRCX から Invite やフレンドリクエストを送受信したり、受け取った Invite のインスタンス情報を確認することができます。
- :scroll: 現在のインスタンスの情報やプレイヤーリストを確認可能
- :tv: 今いるワールドで再生されている動画やその URL、その他様々なログを確認可能
- :bar_chart: Discord Rich Presence の強化
  - 現在のインスタンス情報などを Discord に表示することができます。
  - ワールドサムネイル、ワールド名、インスタンス ID、プレイヤー数が表示され、設定や Private インスタンスかどうかで表示内容が変わります。  
    また、Public インスタンスでは参加ボタンを追加することもできます！
- :crystal_ball: 対応するすべてのイベント/通知のライブフィードを表示/設定可能な VR オーバーレイ

## その他

- VRCX の変わった姿を見たい？[テーマ](https://github.com/vrcx-team/VRCX/wiki/Themes)をチェック！
- VRCX をソースからビルドするには[こちらのガイド](https://github.com/vrcx-team/VRCX/wiki/Building-from-source)をご覧ください。
- VRCX を Linux で動かすには[こちらのガイド](https://github.com/vrcx-team/VRCX/wiki/Running-VRCX-on-Linux)をご覧ください。

# Screenshots

<div align="center">

<h3>ログイン</h3>

<table>
  <tr>
    <td align="center"><img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098150151471759430/image.png" alt="login"></td>
    <td align="center"><img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098150435002527794/image.png" alt="2fa"></td>
  </tr>
</table>

<h3>フィード</h3>

<img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098151111963181066/image.png" alt="feed">

<h3>ゲームログ</h3>

<img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098151427148370010/image.png" alt="gamelog">

<h3>ユーザー情報</h3>

<h4>自分</h4>

<img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098151750277537792/image.png" alt="me">

<h4>フレンド</h4>

<img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098152156294565949/image.png" alt="friend">

<h3>ワールド</h3>

<table>
  <tr>
    <td align="center"><img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098153504834588782/image.png" alt="instance"></td>
    <td align="center"><img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098153774377336883/image.png" alt="info"></td>
  </tr>
</table>

<h3>お気に入り</h3>

<h4>フレンド</h4>

<img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098157650761490452/image.png" alt="friend">

<h4>ワールド</h4>

<img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098158554944376832/image.png" alt="world">

<h4>アバター</h4>

<img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098158789254983691/image.png" alt="avatar">

<h3>フレンドログ</h3>

<img src="https://cdn.discordapp.com/attachments/1098123459634139167/1098159999936643113/image.png" alt="friendlog">

<h3>Discord Rich Presence</h3>

<img src="https://github-production-user-asset-6210df.s3.amazonaws.com/82102170/251997318-5a71249c-59fc-4ad6-9194-d6b1d4165600.png" alt="discord">

<!-- The other images will be similar to this -->
</div>

## これは VRChat の利用規約に違反しますか？

**いいえ。**

VRCX は VRChat API を使用して機能を提供する外部ツールです。

このツールは API を責任を持って使用して機能を提供しているだけであり、Mod やチートなどのようにゲームを改変するものではありません。

API 使用に関する VRChat の声明は VRChat 公式 Discord サーバーの #faq チャンネルを参照してください。

---

VRCX は VRChat によって承認されておらず、VRChat または VRChat の開発もしくは管理に公式に関与する者の見解や意見が反映されたものではありません。VRChat および関連するすべての財産は VRChat 株式会社の商標または登録商標です。
