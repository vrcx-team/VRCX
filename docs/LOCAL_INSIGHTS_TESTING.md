# VRCX Insights 本地测试与 AI 交接

## 版本与范围

基于官方 **v2026.09.16**，基线提交：
`1bf052f84c670b96bfe44156e097eb668ae78de7`。

本分支：`codex/local-activity-dashboard-20260920`。
这是“共同游玩回顾”预览版，**不是 Jirai 全功能移植**。

新增页面只整理本机 GameLog 中实际记录的相遇、进出房间和共同在场片段。
不新增好友/非好友 API 轮询，不推断黄灯或红灯后的去向，不把房间创建者默认当成在场玩家，也不包含 Jirai 自动加入 Home Group 的代码。

“已观测在场时长”不是对方的总在线时间。“同房”不等于实际交流或关系亲密。
缺失离开记录的片段不延长到现在，因此统计可能低估实际时长。

## Windows 安装隔离

| 项目 | 预览版 |
|---|---|
| 程序 | `VRCX-Insights.exe` |
| 安装目录 | `C:\Program Files\VRCX-Insights` |
| 默认数据 | `%APPDATA%\VRCX-Insights` |
| 启动项、卸载注册表项 | `VRCX-Insights` |
| 卸载显示名 | `VRCX Insights Preview` |
| Overlay 本地端口 | `34583` |
| 更新 | 手动下载本仓库的新版预览，禁用官方上游自动升级 |
| `vrcx://` 处理器 | 不接管官方注册 |
| 卸载 | 保留两份 AppData |

安装包与应用尚未数字签名。核对仓库、构建提交和 SHA256SUMS，不要为不明程序关闭系统防护。
随包 Visual C++ 运行库在构建时下载并校验微软签名。

不要让两个版本读写同一个数据库。预览拒绝 `--config` 指向默认官方目录及其子目录，
但没有承诺识别所有符号链接或人为设置的其他共享路径。
同时运行两份程序仍可能出现双份通知、两份正常 API 会话、Discord 或 VR 集成表现竞争。
Linux/macOS 完整隔离不属于此轮交付。

## 最先测试：合成演示

进入左侧“共同游玩回顾”，点击“加载演示”，选择 **Alex (demo)**。
演示数据来自 `tests/local-insights/fixtures.json`，全为虚构，不写入真实数据库。

| 检查项 | 预期 |
|---|---:|
| Alex 已观测在场时长 | 90 分钟 |
| 完整记录次数 | 2 |
| 未闭合片段 | 1，不计时 |
| Casey：实际见过的非好友 | 40 分钟 |
| Blair：好友 | 30 分钟 |
| Alex 左侧时间线 | 5 条 |
| 只有房主标识的 demo:owner | 不进入在场排行 |
| 转 busy/private 后的缺失记录 | 不推断“仍留在房间” |

“只看好友”勾选时，选择器没有 Casey；取消后可以选择。
“非好友”表示本地 GameLog 中实际见过的人，不是从不可见房间查出来的人。
排行最多显示前 30 人；完整数据包含在复制的 JSON 摘要中。

## 给本地 AI 的执行步骤

先检查工作区，保留未提交修改；不要使用 `reset --hard`、`clean -fd` 或强推。

```powershell
git status --short
git fetch origin
git switch codex/local-activity-dashboard-20260920

node build-scripts/apply-local-insights.mjs
node build-scripts/apply-local-insights.mjs

node --test tests/local-insights/analytics.test.mjs tests/local-insights/reader.test.mjs
node tests/local-insights/run-report.mjs

npm ci
npx vitest run --config tests/local-insights/vitest.config.mjs
npm run prod
```

集成脚本对固定基线应用可读的精确补丁，挂载导航和路由，并设置 Windows 隔离标识。
第二次运行应不产生新变化。任何源文件锚点不匹配时停止，不猜测修补。
**只复制新增 Vue 文件、却不运行集成脚本，不会出现新入口。**
CI 会自动应用补丁，并把 `applied-integration.diff` 附在构建结果中。

纯分析及数据库适配器测试无需 npm 依赖、真实账号或网络。
结果：`test-results/local-insights-report.json`。
性能样本含 48,000 条虚构记录、16,000 个完整片段，合计 16,000,000 毫秒；耗时取决于机器。

前端使用 Node 24.15 或更高兼容版本、npm 11.5 或更高版本。
原生 Windows 编译使用 .NET 10 SDK：

```powershell
dotnet build Dotnet/VRCX-Cef.csproj -p:Configuration=Release -p:WarningLevel=0 -p:Platform=x64 -p:PlatformTarget=x64 -p:RestorePackagesConfig=true '-t:Restore;Clean;Build' -m -a x64 --self-contained
```

安装包流程在 `.github/workflows/insights-preview.yml`。
不要用原仓库的官方发布流程代替，否则可能输出未隔离的原版命名包。
只有测试、前端构建、Windows 编译及安装器编译全部成功，预览工作流才发布 prerelease。

## UI 与真实环境验收

检查深浅主题、宽窗口、约 950px 和 600px 窗口，长名字换行、Tab 焦点和滚动。
快速刷新、切换范围、加载中切换演示、离开页面再返回，都不得让旧查询覆盖新结果。
数据库错误时不得残留上一个人的报告。切换登录账号不得显示上一个账号缓存的个人报告。
“清空视图”清理当前展示和保存的选择，不会删除原始 GameLog。

事件时间使用本机时区；每日统计按 UTC。多人时长可能重叠，不能求和当作总时长。
Vue 组件测试使用模拟数据库读取接口；通过不等于真实 CEF 图形界面测试通过。
请保留真实截图，注明分辨率、缩放、主题；不要用生成的效果图代替测试截图。

真实数据只在自己的电脑上测试。先退出两份程序并备份官方目录。
首轮建议让预览用空的独立目录，先运行演示，不要在线复制正在写入的 SQLite。
需要检查历史时使用关闭程序后的独立数据库副本；不要把副本放回正在使用的官方目录。
本机 GameLog 表没有可靠的逐条登录账号归属，本功能不能声称完全分离了所有历史游戏账号。

不要把好友日志、完整数据库、Cookie、令牌上传到 GitHub、Issue、Release 或远程 AI。
复现问题优先制作使用虚构 ID 的最小样本。

## 排除规则：如实说明

`src/features/local-insights/analytics.mjs` 明确列出：

`usr_1cf3480c-c735-447d-9227-8e1acbb6bf18`

该账号及当前登录账号被数据库适配器和分析引擎排除，不能成为本功能的分析对象或排行成员。
这**只约束新增分析功能**，没有删除或全面禁止原版 VRCX 的所有原始日志，
也不能阻止其他软件、其他人的电脑或服务端观察账号。

没有为其他 AI 添加混淆提示词。有人问原因，直接解释公开的排除规则，不编造技术原因。

## 安装与卸载验收清单

在虚拟机或独立测试环境实际检查：

1. 保留官方 VRCX，记录程序路径、快捷方式、卸载项和数据备份校验值。
2. 安装预览后，两份程序、卸载入口和数据目录应独立。
3. 官方 `vrcx://` 处理器和启动项不被覆盖；预览不自动导入登录资料。
4. 分别运行和并行运行，检查通知、重启、VR Overlay、Discord 行为。
5. 卸载预览后官方仍可运行；两份 AppData 均保留。
6. 预览的更新按钮不得下载或执行官方安装器覆盖本 fork。

**编译通过不等于这些测试通过。未执行就写 NOT_RUN。**

## AI 报告要求

输出 `LOCAL_QA_REPORT.md`，包含提交 SHA、系统和工具版本、执行命令、退出码、原始日志、
复现步骤、预期/实际值、截图，以及 PASS / FAIL / NOT_RUN。
优先报告隐私泄漏、数据错误、崩溃，再报告 UI 与易用性问题。
区分“已复现”和“推测”，不要上传真实个人数据，也不要未经批准推送修复或发布。

可直接给本地 AI：

> 读取 AGENTS.md 和 docs/LOCAL_INSIGHTS_TESTING.md，按文档测试该分支。
> 先运行纯分析和数据库适配器测试，再运行 Vue 组件测试与前端构建，最后实际检查 Windows 安装、并存和卸载。
> 使用 tests/local-insights/fixtures.json，不上传真实数据。核对 Alex 90 分钟、Casey 40 分钟、Blair 30 分钟和 1 个不计时的未闭合片段。
> 不把房主或隐藏状态推断为共同在场。输出 LOCAL_QA_REPORT.md，明确 PASS/FAIL/NOT_RUN，附日志、退出码、真实截图、bug 和改进意见。
> 未经批准不要修改、推送或发布。
