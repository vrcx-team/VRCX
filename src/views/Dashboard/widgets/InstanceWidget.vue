<template>
    <div class="flex h-full min-h-0 flex-col">
        <WidgetHeader
            :title="headerTitle"
            icon="ri-group-3-line"
            route-name="player-list" />

        <div class="min-h-0 flex-1 overflow-y-auto" v-if="hasPlayers">
            <div
                v-for="player in playersData"
                :key="player.ref?.id || player.displayName"
                class="flex cursor-pointer items-center gap-1.5 border-b border-border/30 px-2.5 py-0.75 text-[13px] leading-snug hover:bg-accent/50"
                @click="openUser(player)">
                <span v-if="isColumnVisible('icon')" class="shrink-0 min-w-5 text-[11px]">
                    <span v-if="player.isMaster">👑</span>
                    <span v-else-if="player.isModerator">⚔️</span>
                    <span v-if="player.isFriend">💚</span>
                    <span v-if="player.isBlocked" class="text-destructive">⛔</span>
                    <span v-if="player.isMuted" class="text-muted-foreground">🔇</span>
                </span>

                <span class="flex-1 truncate font-medium" :class="player.ref?.$trustClass">
                    {{ player.displayName }}
                </span>

                <span v-if="isColumnVisible('rank')" class="shrink-0 max-w-20 truncate text-[11px]" :class="player.ref?.$trustClass">
                    {{ player.ref?.$trustLevel || '' }}
                </span>

                <span v-if="isColumnVisible('platform')" class="flex shrink-0 items-center">
                    <Monitor v-if="player.ref?.$platform === 'standalonewindows'" class="h-3 w-3 x-tag-platform-pc" />
                    <Smartphone v-else-if="player.ref?.$platform === 'android'" class="h-3 w-3 x-tag-platform-quest" />
                    <Apple v-else-if="player.ref?.$platform === 'ios'" class="h-3 w-3 x-tag-platform-ios" />
                </span>

                <span v-if="isColumnVisible('language')" class="flex shrink-0 items-center">
                    <span
                        v-for="lang in (player.ref?.$languages || []).slice(0, 2)"
                        :key="lang.key"
                        :class="['flags', 'inline-block', 'mr-0.5', languageClass(lang.key)]">
                    </span>
                </span>

                <span v-if="isColumnVisible('status')" class="shrink-0">
                    <i class="x-user-status shrink-0" :class="player.ref?.status ? statusClass(player.ref.status) : ''"></i>
                </span>

                <span v-if="isColumnVisible('timer')" class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    <Timer v-if="player.timer" :epoch="player.timer" />
                </span>
            </div>
        </div>
        <div v-else class="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            {{ t('dashboard.widget.instance_not_in_game') }}
        </div>
    </div>
</template>

<script setup>
    import { computed, onActivated, onMounted } from 'vue';
    import { Apple, Monitor, Smartphone } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useInstanceStore, useLocationStore } from '@/stores';
    import { languageClass, statusClass } from '@/shared/utils/user';
    import { showUserDialog, lookupUser } from '@/coordinators/userCoordinator';
    import { displayLocation } from '@/shared/utils/locationParser';

    import Timer from '@/components/Timer.vue';
    import WidgetHeader from './WidgetHeader.vue';

    const ALL_COLUMNS = ['icon', 'displayName', 'rank', 'timer', 'platform', 'language', 'status'];
    const DEFAULT_COLUMNS = ['icon', 'displayName', 'rank', 'timer'];

    const props = defineProps({
        config: {
            type: Object,
            default: () => ({})
        }
    });

    const { t } = useI18n();
    const instanceStore = useInstanceStore();
    const { currentInstanceUsersData, currentInstanceWorld } = storeToRefs(instanceStore);
    const { lastLocation } = storeToRefs(useLocationStore());

    const activeColumns = computed(() => {
        if (props.config.columns && Array.isArray(props.config.columns) && props.config.columns.length > 0) {
            return props.config.columns;
        }
        return DEFAULT_COLUMNS;
    });

    function isColumnVisible(col) {
        return activeColumns.value.includes(col);
    }

    const hasPlayers = computed(() => {
        return lastLocation.value.playerList && lastLocation.value.playerList.size > 0;
    });

    const playersData = computed(() => {
        return currentInstanceUsersData.value || [];
    });

    const headerTitle = computed(() => {
        if (!hasPlayers.value) {
            return t('dashboard.widget.instance');
        }
        const loc = lastLocation.value;
        const worldName = loc.name || t('dashboard.widget.unknown_world');
        const playerCount = loc.playerList?.size || 0;
        const locationInfo = loc.location ? displayLocation(loc.location, worldName) : '';
        if (locationInfo) {
            return `${worldName} · ${locationInfo} · ${playerCount}`;
        }
        return `${worldName} · ${playerCount}`;
    });

    function openUser(player) {
        const ref = player?.ref;
        if (ref?.id) {
            showUserDialog(ref.id);
        } else if (ref) {
            lookupUser(ref);
        }
    }

    onMounted(() => {
        instanceStore.getCurrentInstanceUserList();
    });

    onActivated(() => {
        instanceStore.getCurrentInstanceUserList();
    });

    defineExpose({ ALL_COLUMNS, DEFAULT_COLUMNS });
</script>
