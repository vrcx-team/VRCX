<template>
    <div class="flex flex-col gap-10 py-2">
        <SettingsGroup :title="t('view.settings.social.interaction.header')">
            <SettingsItem
                :label="t('view.settings.appearance.user_dialog.recent_action_cooldown')"
                :description="t('view.settings.appearance.user_dialog.recent_action_cooldown_description')">
                <Switch
                    :model-value="recentActionCooldownEnabled"
                    @update:modelValue="setRecentActionCooldownEnabled" />
            </SettingsItem>

            <SettingsItem
                v-if="recentActionCooldownEnabled"
                :label="t('view.settings.appearance.user_dialog.recent_action_cooldown_minutes')">
                <NumberField
                    :model-value="recentActionCooldownMinutes"
                    :min="1"
                    :max="1440"
                    :step="1"
                    :format-options="{ maximumFractionDigits: 0 }"
                    class="w-32"
                    @update:modelValue="setRecentActionCooldownMinutes">
                    <NumberFieldContent>
                        <NumberFieldDecrement />
                        <NumberFieldInput />
                        <NumberFieldIncrement />
                    </NumberFieldContent>
                </NumberField>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.social.favorites.header')">
            <SettingsItem
                :label="t('view.settings.general.favorites.header')"
                :description="t('view.settings.general.favorites.header_tooltip')">
                <Select
                    :model-value="localFavoriteFriendsGroups"
                    multiple
                    @update:modelValue="setLocalFavoriteFriendsGroups">
                    <SelectTrigger class="w-48">
                        <SelectValue :placeholder="t('view.settings.general.favorites.group_placeholder')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="group in favoriteFriendGroups" :key="group.key" :value="group.key">
                                {{ group.displayName }}
                            </SelectItem>
                        </SelectGroup>
                        <template v-if="localFriendFavoriteGroups.length">
                            <SelectSeparator />
                            <SelectGroup>
                                <SelectItem
                                    v-for="group in localFriendFavoriteGroups"
                                    :key="'local:' + group"
                                    :value="'local:' + group">
                                    {{ group }}
                                </SelectItem>
                            </SelectGroup>
                        </template>
                    </SelectContent>
                </Select>
            </SettingsItem>
        </SettingsGroup>
    </div>
</template>

<script setup>
    import { Switch } from '@/components/ui/switch';

    import {
        NumberField,
        NumberFieldContent,
        NumberFieldDecrement,
        NumberFieldIncrement,
        NumberFieldInput
    } from '@/components/ui/number-field';
    import {
        Select,
        SelectContent,
        SelectGroup,
        SelectItem,
        SelectSeparator,
        SelectTrigger,
        SelectValue
    } from '@/components/ui/select';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useGeneralSettingsStore } from '@/stores';

    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

    const generalSettingsStore = useGeneralSettingsStore();
    const favoriteStore = useFavoriteStore();

    const { recentActionCooldownEnabled, recentActionCooldownMinutes, localFavoriteFriendsGroups } =
        storeToRefs(generalSettingsStore);

    const { setRecentActionCooldownEnabled, setRecentActionCooldownMinutes, setLocalFavoriteFriendsGroups } =
        generalSettingsStore;

    const { favoriteFriendGroups, localFriendFavoriteGroups } = storeToRefs(favoriteStore);
</script>
