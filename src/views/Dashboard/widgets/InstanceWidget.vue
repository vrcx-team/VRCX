<template>
    <div class="flex h-full min-h-0 flex-col">
        <WidgetHeader :title="t('dashboard.widget.instance')" icon="ri-group-3-line" route-name="player-list">
            <DropdownMenu v-if="configUpdater">
                <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon-sm">
                        <Settings class="size-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                    <DropdownMenuCheckboxItem
                        v-for="col in ALL_COLUMNS"
                        :key="col"
                        :model-value="isColumnVisible(col)"
                        :disabled="col === 'displayName'"
                        @select.prevent
                        @update:modelValue="toggleColumn(col)">
                        {{ t(`table.playerList.${col}`) }}
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </WidgetHeader>

        <template v-if="hasPlayers">
            <!-- Info bar -->
            <div class="flex items-center gap-2 border-b px-2.5 py-1.5 text-[12px] text-muted-foreground">
                <span class="truncate font-medium text-foreground">{{ worldName }}</span>
                <span v-if="locationInfo" class="shrink-0">· {{ locationInfo }}</span>
                <span class="shrink-0">· {{ playerCount }} {{ t('dashboard.widget.instance_players') }}</span>
            </div>

            <!-- Player table -->
            <div class="min-h-0 flex-1 overflow-y-auto">
                <Table class="is-compact-table">
                    <TableBody>
                        <TableRow
                            v-for="player in playersData"
                            :key="player.ref?.id || player.displayName"
                            class="cursor-pointer"
                            @click="openUser(player)">
                            <TableCell v-if="isColumnVisible('icon')" class="w-12 text-center text-[11px]">
                                <span v-if="player.isMaster">👑</span>
                                <span v-else-if="player.isModerator">⚔️</span>
                                <span v-if="player.isFriend">💚</span>
                                <span v-if="player.isBlocked" class="text-destructive">⛔</span>
                                <span v-if="player.isMuted" class="text-muted-foreground">🔇</span>
                                <IdCard
                                    v-if="player.ageVerified"
                                    class="inline-block h-3.5 w-3.5 x-tag-age-verification" />
                            </TableCell>

                            <TableCell class="truncate font-medium" :class="player.ref?.$trustClass">
                                {{ player.displayName }}
                            </TableCell>

                            <TableCell
                                v-if="isColumnVisible('rank')"
                                class="w-24 truncate text-[11px]"
                                :class="player.ref?.$trustClass">
                                {{ player.ref?.$trustLevel || '' }}
                            </TableCell>

                            <TableCell v-if="isColumnVisible('platform')" class="w-10 text-center">
                                <Monitor
                                    v-if="player.ref?.$platform === 'standalonewindows'"
                                    class="inline-block h-3 w-3 x-tag-platform-pc" />
                                <Smartphone
                                    v-else-if="player.ref?.$platform === 'android'"
                                    class="inline-block h-3 w-3 x-tag-platform-quest" />
                                <Apple
                                    v-else-if="player.ref?.$platform === 'ios'"
                                    class="inline-block h-3 w-3 x-tag-platform-ios" />
                            </TableCell>

                            <TableCell v-if="isColumnVisible('language')" class="w-14 text-center">
                                <span
                                    v-for="lang in (player.ref?.$languages || []).slice(0, 2)"
                                    :key="lang.key"
                                    :class="['flags', 'inline-block', 'mr-0.5', languageClass(lang.key)]">
                                </span>
                            </TableCell>

                            <TableCell v-if="isColumnVisible('status')" class="w-10 text-center">
                                <i
                                    class="x-user-status"
                                    :class="player.ref?.status ? statusClass(player.ref.status) : ''"></i>
                            </TableCell>

                            <TableCell
                                v-if="isColumnVisible('timer')"
                                class="w-20 text-right text-[11px] tabular-nums text-muted-foreground">
                                <Timer v-if="player.timer" :epoch="player.timer" />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </template>
        <div v-else class="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            {{ t('dashboard.widget.instance_not_in_game') }}
        </div>
    </div>
</template>

<script setup>
    import { computed, onActivated, onMounted } from 'vue';
    import { Apple, IdCard, Monitor, Settings, Smartphone } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useInstanceStore, useLocationStore } from '@/stores';
    import { languageClass, statusClass } from '@/shared/utils/user';
    import { showUserDialog, lookupUser } from '@/coordinators/userCoordinator';
    import { displayLocation } from '@/shared/utils/locationParser';

    import { Button } from '@/components/ui/button';
    import {
        DropdownMenu,
        DropdownMenuCheckboxItem,
        DropdownMenuContent,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import Timer from '@/components/Timer.vue';
    import WidgetHeader from './WidgetHeader.vue';
    import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';

    const ALL_COLUMNS = ['icon', 'displayName', 'rank', 'timer', 'platform', 'language', 'status'];
    const DEFAULT_COLUMNS = ['icon', 'displayName', 'timer'];

    const props = defineProps({
        config: {
            type: Object,
            default: () => ({})
        },
        configUpdater: {
            type: Function,
            default: null
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

    function toggleColumn(col) {
        if (!props.configUpdater || col === 'displayName') return;
        const currentColumns = props.config.columns || DEFAULT_COLUMNS;
        let columns;
        if (currentColumns.includes(col)) {
            columns = currentColumns.filter((c) => c !== col);
        } else {
            columns = [...currentColumns, col];
        }
        props.configUpdater({ ...props.config, columns });
    }

    const hasPlayers = computed(() => {
        return lastLocation.value.playerList && lastLocation.value.playerList.size > 0;
    });

    const playersData = computed(() => {
        return currentInstanceUsersData.value || [];
    });

    const worldName = computed(() => {
        const loc = lastLocation.value;
        return loc.name || t('dashboard.widget.unknown_world');
    });

    const locationInfo = computed(() => {
        const loc = lastLocation.value;
        return loc.location ? displayLocation(loc.location, worldName.value) : '';
    });

    const playerCount = computed(() => {
        return lastLocation.value.playerList?.size || 0;
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
