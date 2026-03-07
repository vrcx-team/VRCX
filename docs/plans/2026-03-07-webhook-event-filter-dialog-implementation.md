# Webhook Event Filter Dialog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把 webhook 事件勾选列表迁移到独立弹窗，保持 webhook 其他配置仍在 NotificationsTab。

**Architecture:** 新增 `WebhookEventFiltersDialog` 组件承载事件分组和开关，NotificationsTab 仅提供入口按钮与弹窗状态管理。

**Tech Stack:** Vue 3, Pinia, existing shadcn dialog components, Vitest

---

### Task 1: Update tests first
- Modify: `src/views/Settings/components/Tabs/__tests__/NotificationsTab.webhookEvents.test.js`
- Create: `src/views/Settings/dialogs/__tests__/WebhookEventFiltersDialog.test.js`
- Run: `npm test -- src/views/Settings/components/Tabs/__tests__/NotificationsTab.webhookEvents.test.js src/views/Settings/dialogs/__tests__/WebhookEventFiltersDialog.test.js`

### Task 2: Implement dialog + integrate tab
- Create: `src/views/Settings/dialogs/WebhookEventFiltersDialog.vue`
- Modify: `src/views/Settings/components/Tabs/NotificationsTab.vue`
- Run same targeted tests.

### Task 3: Verify full suite
- Run: `npm test`
- Commit all related changes.
