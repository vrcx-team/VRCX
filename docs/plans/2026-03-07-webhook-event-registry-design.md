# Webhook Event Registry Design

**Date:** 2026-03-07

## Goal
将现有 webhook 事件导出扩展为“全事件可配置导出”，并在 GUI 中提供按事件粒度的手动开关，覆盖通知与非通知事件。

## Scope
- 全量纳入事件级控制：
  - `app.*`
  - `vrchat.*`
  - `self.*`
  - `friend.*`
  - `favorite.*`
  - `instance.*`
  - `notification.*`
- 保留现有 webhook 全局开关、URL、Bearer Token 与测试发送能力。

## Architecture
1. 新增集中式事件注册表（registry）
- 每个事件包含：
  - 事件 key（如 `friend.online`）
  - 分组（GUI 分类）
  - 文案 key（label/description）
  - 默认开关（defaultEnabled）
- 在代码中为每个事件增加语义注释，说明触发条件与业务含义。

2. 导出层统一过滤
- `emitWebhookEvent(event, payload)` 在发送前统一检查：
  - 全局开关是否开启
  - URL 是否配置
  - 事件级开关是否启用
- 未注册事件默认不发送并记录警告（安全默认）。

3. 配置持久化
- 新增配置键（JSON map）：`VRCX_eventExportEnabledEvents`
- 结构示例：
  - `{ "friend.online": true, "friend.offline": false }`
- 读取时做增量合并：旧配置缺项时补 default，不覆盖已设置项。

4. GUI 扩展
- 在设置页 Notifications -> Webhook 区块下新增“事件导出项”。
- 按分组展示事件列表与逐项开关。
- 每项显示：标题、事件 key、含义说明。
- 增加快捷操作：全选、全不选、恢复默认。

## Data Flow
业务模块触发 `emitWebhookEvent` -> 导出层读取缓存配置 -> 通过规则判定后发送标准 envelope JSON。

## Error Handling
- 配置读取/解析失败：回退默认并告警。
- 发送失败：仅 warn，不阻塞主业务流程。
- URL 缺失或总开关关闭：返回 `false`，不发请求。

## Testing Strategy
- `webhookEvent` 单元测试：
  - 全局关闭 / URL 缺失 / 事件关闭时不发送
  - 事件开启且配置完整时发送
  - 动态 `notification.<type>.received` 按规则可控
  - 未注册事件默认拒绝
- settings store 测试：事件 map 持久化与默认合并正确。
- NotificationsTab 组件测试：分组渲染与开关交互正确。

## Acceptance
- 用户可在 GUI 逐项控制 webhook 事件导出。
- “通知类 + 非通知类”均可控制。
- 代码中可直接看到每个事件含义注释。
- 未勾选事件不会外发，已勾选事件按既有 envelope 发送。
