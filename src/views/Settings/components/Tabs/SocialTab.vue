<template>
    <div class="flex flex-col gap-10 py-2">
        <SettingsGroup :title="t('view.settings.social.interaction.header')">
            <SettingsItem
                :label="t('view.settings.appearance.user_dialog.recent_action_cooldown')"
                :description="t('view.settings.appearance.user_dialog.recent_action_cooldown_description')">
                <Switch :model-value="recentActionCooldownEnabled" @update:modelValue="setRecentActionCooldownEnabled" />
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

        <SettingsGroup>
            <template #description>
                <div class="flex items-center gap-1.5">
                    <span class="text-base font-semibold text-foreground">{{ t('view.settings.general.favorites.header') }}</span>
                    <TooltipWrapper side="top" :content="t('view.settings.general.favorites.header_tooltip')">
                        <Info class="size-3 text-muted-foreground cursor-help" />
                    </TooltipWrapper>
                </div>
            </template>

            <Select
                :model-value="localFavoriteFriendsGroups"
                multiple
                @update:modelValue="setLocalFavoriteFriendsGroups">
                <SelectTrigger>
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
        </SettingsGroup>
    </div>
</template>

<script setup>
    import { Switch } from '@/components/ui/switch';
    import { Info } from 'lucide-vue-next';
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
    import { TooltipWrapper } from '@/components/ui/tooltip';

    const { t } = useI18n();

    const generalSettingsStore = useGeneralSettingsStore();
    const favoriteStore = useFavoriteStore();

    const {
        recentActionCooldownEnabled,
        recentActionCooldownMinutes,
        localFavoriteFriendsGroups
    } = storeToRefs(generalSettingsStore);

    const {
        setRecentActionCooldownEnabled,
        setRecentActionCooldownMinutes,
        setLocalFavoriteFriendsGroups
    } = generalSettingsStore;

    const { favoriteFriendGroups, localFriendFavoriteGroups } = storeToRefs(favoriteStore);
</script>
