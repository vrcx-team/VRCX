# Webhook Event Filter Dialog Design

**Date:** 2026-03-07

## Goal
将 webhook 事件勾选列表从 `NotificationsTab` 页内迁移到独立弹窗，交互风格参考通知筛选器。

## Scope
- 仅迁移“事件勾选列表”到弹窗。
- 保留页内：总开关、URL、Bearer Token、测试事件与发送测试。

## Design
- 新增 `WebhookEventFiltersDialog.vue`：
  - 分组展示 webhook 事件开关。
  - 支持全选/全不选/恢复默认。
  - 支持关闭动作。
- `NotificationsTab.vue`：
  - 删除页内事件列表 UI。
  - 增加“Webhook 事件筛选”按钮。
  - 增加 `v-model:isWebhookEventFiltersDialogVisible` 控制弹窗显示。

## Data Flow
- 对话框直接调用 `useNotificationsSettingsStore`：
  - `webhookEventEnabledMap`
  - `setWebhookEventEnabled`
  - `setAllWebhookEventsEnabled`
  - `resetWebhookEventEnabledDefaults`

## Testing
- 新增对话框单测：渲染、单项切换、批量动作、关闭。
- 更新 NotificationsTab 测试：按钮存在、能打开弹窗、页内不渲染事件列表。
