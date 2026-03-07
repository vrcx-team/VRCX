# Webhook Event Registry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 webhook 事件导出升级为“全事件可配置导出”，并在 GUI 中提供按事件粒度的勾选开关与含义说明。

**Architecture:** 新增集中式事件注册表作为唯一事件元数据来源；webhook 发送统一经过“全局开关 + URL + 事件开关”判定；设置页基于注册表自动渲染分组开关；配置以 JSON map 持久化并做增量默认合并。

**Tech Stack:** Vue 3, Pinia, Vitest, i18n JSON, existing webhook service/config repository

---

### Task 1: Build Event Registry + Export Gating (TDD)

**Files:**
- Create: `src/shared/constants/webhookEvents.js`
- Modify: `src/shared/constants/index.js`
- Modify: `src/service/webhookEvent.js`
- Test: `src/service/__tests__/webhookEvent.test.js`

**Step 1: Write the failing tests (registry + event-level gating)**

```js
it('does not send when event is disabled in event map', async () => {
  // mock config enabled/url/token + event map with friend.online:false
  // call emitWebhookEvent('friend.online', { userId: 'usr_1' })
  // expect fetch not called and result false
});

it('sends when event is enabled in event map', async () => {
  // friend.online:true -> expect fetch called once and result true
});

it('handles notification.<type>.received with registry pattern', async () => {
  // notification.group_invite.received true via dynamic matcher
});

it('rejects unregistered events by default', async () => {
  // emit unknown.custom.event -> false
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/service/__tests__/webhookEvent.test.js`
Expected: FAIL with missing registry/dynamic rule behavior.

**Step 3: Write minimal implementation**

```js
// webhookEvents.js
export const WEBHOOK_EVENT_DEFS = [
  // friend.online: 触发于好友上线被检测到
  { key: 'friend.online', category: 'friend', defaultEnabled: true, ... },
  ...
];

export const WEBHOOK_DYNAMIC_EVENT_RULES = [
  {
    key: 'notification.received.dynamic',
    pattern: /^notification\.[a-z0-9_]+\.received$/,
    category: 'notification',
    defaultEnabled: true
  }
];

export function createDefaultWebhookEventEnabledMap() { ... }
export function normalizeWebhookEventEnabledMap(rawMap) { ... }
export function isWebhookEventAllowed(event, enabledMap) { ... }
```

```js
// webhookEvent.js
const EVENT_EXPORT_ENABLED_EVENTS_KEY = 'VRCX_eventExportEnabledEvents';

let cachedConfig = {
  enabled: false,
  webhookUrl: '',
  bearerToken: '',
  enabledEvents: createDefaultWebhookEventEnabledMap()
};

// loadConfig() reads enabledEvents JSON and normalizes
// emitWebhookEvent() checks isWebhookEventAllowed(event, config.enabledEvents)
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/service/__tests__/webhookEvent.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/shared/constants/webhookEvents.js src/shared/constants/index.js src/service/webhookEvent.js src/service/__tests__/webhookEvent.test.js
git commit -m "feat: add webhook event registry and event-level export gating"
```

### Task 2: Extend Notifications Settings Store for Event Map Controls (TDD)

**Files:**
- Modify: `src/stores/settings/notifications.js`
- Test: `src/stores/settings/__tests__/notifications.webhookEvents.test.js`

**Step 1: Write failing tests for store actions**

```js
it('loads and normalizes webhook event map from config', async () => {
  // initNotificationsSettings -> map has all registry keys
});

it('toggles single event and persists JSON map', async () => {
  // setWebhookEventEnabled('friend.online', false)
});

it('supports enable all, disable all, reset defaults', async () => {
  // verify persisted JSON each time
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/settings/__tests__/notifications.webhookEvents.test.js`
Expected: FAIL with missing event-map state/actions.

**Step 3: Write minimal implementation**

```js
const webhookEventEnabledMap = ref(createDefaultWebhookEventEnabledMap());

function setWebhookEventEnabled(eventKey, enabled) { ... }
function setAllWebhookEventsEnabled(enabled) { ... }
function resetWebhookEventEnabledDefaults() { ... }

async function saveWebhookEventExportSettings() {
  await configureWebhookEventExporter({
    enabled,
    webhookUrl,
    bearerToken,
    enabledEvents: webhookEventEnabledMap.value
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/settings/__tests__/notifications.webhookEvents.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/stores/settings/notifications.js src/stores/settings/__tests__/notifications.webhookEvents.test.js
git commit -m "feat: add webhook event map controls in notifications settings store"
```

### Task 3: Render Event Registry Controls in NotificationsTab (TDD)

**Files:**
- Modify: `src/views/Settings/components/Tabs/NotificationsTab.vue`
- Modify: `src/localization/zh-CN.json`
- Modify: `src/localization/en.json`
- Test: `src/views/Settings/components/Tabs/__tests__/NotificationsTab.webhookEvents.test.js`

**Step 1: Write failing UI tests**

```js
it('renders grouped webhook event toggles from registry', async () => {
  // expect friend.online and self.instance_changed rows shown
});

it('clicking event switch calls setWebhookEventEnabled', async () => {
  // simulate toggle
});

it('enable all/disable all/reset buttons call store actions', async () => {
  // click 3 buttons and assert action calls
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/views/Settings/components/Tabs/__tests__/NotificationsTab.webhookEvents.test.js`
Expected: FAIL with missing UI elements/actions.

**Step 3: Write minimal implementation**

```vue
<!-- NotificationsTab.vue -->
<div class="options-container">
  <span class="sub-header">{{ t('...webhook.events.header') }}</span>
  <div class="options-container-item">
    <Button @click="setAllWebhookEventsEnabled(true)">...</Button>
    <Button @click="setAllWebhookEventsEnabled(false)">...</Button>
    <Button @click="resetWebhookEventEnabledDefaults">...</Button>
  </div>
  <div v-for="group in webhookEventGroups" :key="group.key">...
    <simple-switch
      v-for="item in group.items"
      :key="item.key"
      :label="t(item.labelKey)"
      :value="Boolean(webhookEventEnabledMap[item.key])"
      @change="setWebhookEventEnabled(item.key, !webhookEventEnabledMap[item.key])"
    />
    <div class="event-desc">{{ t(item.descriptionKey) }} · {{ item.key }}</div>
  </div>
</div>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/views/Settings/components/Tabs/__tests__/NotificationsTab.webhookEvents.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/views/Settings/components/Tabs/NotificationsTab.vue src/localization/zh-CN.json src/localization/en.json src/views/Settings/components/Tabs/__tests__/NotificationsTab.webhookEvents.test.js
git commit -m "feat: add webhook event selection UI in notifications tab"
```

### Task 4: Add/Refine Notification Event Coverage + Verify End-to-End

**Files:**
- Modify: `src/stores/notification/index.js`
- Test: `src/stores/notification/__tests__/webhookNotificationCoverage.test.js`

**Step 1: Write failing coverage test for notification actions**

```js
it('emits webhook for notification-v2 received/update/hide/respond actions', () => {
  // simulate handlers and assert expected notification.* events emitted
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/notification/__tests__/webhookNotificationCoverage.test.js`
Expected: FAIL due to missing emit calls for key notification actions.

**Step 3: Write minimal implementation**

```js
// notification/index.js
// add helper to build common notification payload
// emit on v2 receive/update/hide/respond with explicit semantic names
// keep existing notification.<type>.received behavior
```

**Step 4: Run targeted + related tests**

Run: `npm test -- src/stores/notification/__tests__/webhookNotificationCoverage.test.js src/service/__tests__/webhookEvent.test.js src/stores/settings/__tests__/notifications.webhookEvents.test.js`
Expected: PASS.

**Step 5: Run full test suite**

Run: `npm test`
Expected: PASS.

**Step 6: Commit**

```bash
git add src/stores/notification/index.js src/stores/notification/__tests__/webhookNotificationCoverage.test.js
git commit -m "feat: expand webhook notification event coverage"
```

### Task 5: Final Verification + Docs Polish

**Files:**
- Modify: `docs/plans/2026-03-07-webhook-event-registry-design.md`

**Step 1: Verify event registry completeness**

Run: `rg -n "emitWebhookEvent\('" src`
Expected: all static events appear in registry; dynamic notification rule documented.

**Step 2: Verify i18n keys exist**

Run: `rg -n "view.settings.notifications.notifications.webhook.events" src/localization/zh-CN.json src/localization/en.json`
Expected: labels/descriptions complete.

**Step 3: Update design doc with implementation notes**

```md
## Implementation Notes
- Event registry file path
- Dynamic notification matching behavior
- Backward compatibility details
```

**Step 4: Commit**

```bash
git add docs/plans/2026-03-07-webhook-event-registry-design.md
git commit -m "docs: record webhook event registry implementation notes"
```
