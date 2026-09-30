<template>
    <div class="flex flex-col gap-10 py-2">
        <SettingsGroup :title="t('view.settings.notifications.notifications.header')">
            <SettingsItem :label="t('view.settings.notifications.notifications.notification_filter')">
                <Button size="sm" variant="outline" @click="showNotyFeedFiltersDialog">{{
                    t('view.settings.notifications.notifications.notification_filter')
                }}</Button>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.notifications.notifications.test_notification')">
                <Button size="sm" variant="outline" @click="testNotification"
                    ><Play />{{ t('view.settings.notifications.notifications.test_notification') }}</Button
                >
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.notifications.notifications.desktop_notifications.header')">
            <SettingsItem :label="t('view.settings.notifications.notifications.desktop_notifications.when_to_display')">
                <Select :model-value="desktopToast" @update:model-value="setDesktopToast">
                    <SelectTrigger size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Never">{{
                            t('view.settings.notifications.notifications.conditions.never')
                        }}</SelectItem>
                        <SelectItem value="Desktop Mode">{{
                            t('view.settings.notifications.notifications.conditions.desktop')
                        }}</SelectItem>
                        <SelectItem value="Inside VR">{{
                            t('view.settings.notifications.notifications.conditions.inside_vr')
                        }}</SelectItem>
                        <SelectItem value="Outside VR">{{
                            t('view.settings.notifications.notifications.conditions.outside_vr')
                        }}</SelectItem>
                        <SelectItem value="Game Running">{{
                            t('view.settings.notifications.notifications.conditions.inside_vrchat')
                        }}</SelectItem>
                        <SelectItem value="Game Closed">{{
                            t('view.settings.notifications.notifications.conditions.outside_vrchat')
                        }}</SelectItem>
                        <SelectItem value="Always">{{
                            t('view.settings.notifications.notifications.conditions.always')
                        }}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem
                :label="
                    t('view.settings.notifications.notifications.desktop_notifications.desktop_notification_while_afk')
                "
                toggle>
                <Switch
                    :model-value="afkDesktopToast"
                    :ariaLabel="
                        t(
                            'view.settings.notifications.notifications.desktop_notifications.desktop_notification_while_afk'
                        )
                    "
                    @update:modelValue="setAfkDesktopToast" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.notifications.notifications.text_to_speech.header')">
            <SettingsItem :label="t('view.settings.notifications.notifications.text_to_speech.when_to_play')">
                <Select :model-value="notificationTTS" @update:model-value="saveNotificationTTS">
                    <SelectTrigger size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Never">{{
                            t('view.settings.notifications.notifications.conditions.never')
                        }}</SelectItem>
                        <SelectItem value="Inside VR">{{
                            t('view.settings.notifications.notifications.conditions.inside_vr')
                        }}</SelectItem>
                        <SelectItem value="Game Running">{{
                            t('view.settings.notifications.notifications.conditions.inside_vrchat')
                        }}</SelectItem>
                        <SelectItem value="Game Closed">{{
                            t('view.settings.notifications.notifications.conditions.outside_vrchat')
                        }}</SelectItem>
                        <SelectItem value="Always">{{
                            t('view.settings.notifications.notifications.conditions.always')
                        }}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.notifications.notifications.text_to_speech.tts_voice')">
                <Select
                    :model-value="ttsVoiceIndex"
                    :disabled="notificationTTS === 'Never'"
                    @update:modelValue="(v) => (ttsVoiceIndex = v)">
                    <SelectTrigger size="sm">
                        <SelectValue :placeholder="getTTSVoiceName()" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="(voice, index) in TTSvoices" :key="index" :value="index">
                                {{ voice.name }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.notifications.notifications.text_to_speech.use_memo_nicknames')"
                toggle>
                <Switch
                    :model-value="notificationTTSNickName"
                    :disabled="notificationTTS === 'Never'"
                    :ariaLabel="t('view.settings.notifications.notifications.text_to_speech.use_memo_nicknames')"
                    @update:modelValue="setNotificationTTSNickName" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.notifications.notifications.text_to_speech.tts_test_placeholder')"
                toggle>
                <Switch
                    :model-value="isTestTTSVisible"
                    :ariaLabel="t('view.settings.notifications.notifications.text_to_speech.tts_test_placeholder')"
                    @update:modelValue="isTestTTSVisible = !isTestTTSVisible" />
            </SettingsItem>

            <div v-if="isTestTTSVisible" class="flex items-center gap-2 mt-1">
                <InputGroupTextareaField
                    v-model="notificationTTSTest"
                    :placeholder="t('view.settings.notifications.notifications.text_to_speech.tts_test_placeholder')"
                    :rows="1"
                    class="w-44"
                    input-class="resize-none min-h-0" />
                <Button size="sm" variant="outline" @click="testNotificationTTS">{{
                    t('view.settings.notifications.notifications.text_to_speech.play')
                }}</Button>
            </div>
        </SettingsGroup>

        <FeedFiltersDialog v-model:feedFiltersDialogMode="feedFiltersDialogMode" />
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Switch } from '@/components/ui/switch';
    import { computed, onMounted, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { Play } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useNotificationStore, useNotificationsSettingsStore } from '@/stores';

    import FeedFiltersDialog from '../../dialogs/FeedFiltersDialog.vue';
    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

    const notificationsSettingsStore = useNotificationsSettingsStore();

    const {
        desktopToast,
        afkDesktopToast,
        notificationTTS,
        notificationTTSNickName,
        isTestTTSVisible,
        notificationTTSTest,
        TTSvoices
    } = storeToRefs(notificationsSettingsStore);

    const {
        setDesktopToast,
        setAfkDesktopToast,
        setNotificationTTSNickName,
        getTTSVoiceName,
        changeTTSVoice,
        saveNotificationTTS,
        testNotificationTTS
    } = notificationsSettingsStore;

    const { testNotification, markAllAsSeen } = useNotificationStore();

    const feedFiltersDialogMode = ref('');

    const ttsVoiceIndex = computed({
        get: () => {
            const currentName = getTTSVoiceName();
            const idx = TTSvoices.value.findIndex((v) => v?.name === currentName);
            return idx >= 0 ? idx : null;
        },
        set: (value) => {
            if (typeof value === 'number') {
                changeTTSVoice(value);
            }
        }
    });

    onMounted(() => {
        markAllAsSeen();
    });

    function showNotyFeedFiltersDialog() {
        feedFiltersDialogMode.value = 'noty';
    }
</script>
