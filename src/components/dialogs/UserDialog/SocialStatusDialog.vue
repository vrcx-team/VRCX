<template>
    <Dialog v-model:open="socialStatusDialog.visible">
        <DialogContent class="x-dialog sm:-w-20">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.social_status.header') }}</DialogTitle>
            </DialogHeader>

            <div class="pt-6 pb-4 px-16">
                <div class="flex items-center gap-2">
                    <InputGroupField
                        v-model="socialStatusDialog.statusDescription"
                        :placeholder="t('dialog.social_status.status_placeholder')"
                        :maxlength="32"
                        clearable>
                    </InputGroupField>
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <InputGroupButton variant="outline" size="icon-lg">
                                <History class="text-lg" />
                            </InputGroupButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem v-if="!historyItems.length" disabled>
                                {{ t('dialog.social_status.history') }}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                v-for="item in historyItems"
                                :key="item.no ?? item.status"
                                @click="setSocialStatusFromHistory(item)">
                                {{ item.status }}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div class="mt-6 flex flex-col gap-2" role="radiogroup">
                    <Item
                        v-for="option in statusOptions"
                        :key="option.value"
                        variant="outline"
                        size="sm"
                        role="radio"
                        tabindex="0"
                        :aria-checked="socialStatusDialog.status === option.value"
                        class="cursor-pointer hover:bg-accent"
                        @click="handleSocialStatusChange(option.value)"
                        @keydown.enter.prevent="handleSocialStatusChange(option.value)"
                        @keydown.space.prevent="handleSocialStatusChange(option.value)">
                        <ItemMedia>
                            <i class="x-user-status" :class="option.statusClass"></i>
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle>{{ option.label }}</ItemTitle>
                        </ItemContent>
                        <ItemActions>
                            <Check v-if="socialStatusDialog.status === option.value" class="text-base text-primary" />
                        </ItemActions>
                    </Item>
                </div>
            </div>

            <div v-if="presets.length" class="pb-4 px-16">
                <span class="text-xs text-muted-foreground mb-2 block">
                    {{ t('dialog.social_status.presets') }}
                </span>
                <div class="flex flex-wrap gap-1.5">
                    <div
                        v-for="(preset, index) in presets"
                        :key="index"
                        class="group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border bg-background text-xs cursor-pointer hover:bg-accent transition-colors max-w-[200px]"
                        @click="applyPreset(preset)">
                        <i class="x-user-status flex-none" :class="getStatusClass(preset.status)"></i>
                        <span class="truncate">{{ preset.statusDescription || getStatusLabel(preset.status) }}</span>
                        <button
                            class="flex-none size-4 inline-flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
                            @click.stop="handleDeletePreset(index)">
                            <X class="size-3" />
                        </button>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" :disabled="socialStatusDialog.loading" @click="handleSavePreset">
                    <Bookmark class="size-4" />
                    {{ t('dialog.social_status.save_preset') }}
                </Button>
                <Button :disabled="socialStatusDialog.loading" @click="saveSocialStatus">
                    {{ t('dialog.social_status.update') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { Bookmark, Check, History, X } from 'lucide-vue-next';
    import { InputGroupButton, InputGroupField } from '@/components/ui/input-group';
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useUserStore } from '../../../stores';
    import { userRequest } from '../../../api';
    import { useStatusPresets } from './composables/useStatusPresets';

    const { t } = useI18n();
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        socialStatusDialog: {
            type: Object,
            required: true
        },
        socialStatusHistoryTable: {
            type: Object,
            required: true
        }
    });

    const historyItems = computed(() => props.socialStatusHistoryTable?.data ?? []);

    const { presets, addPreset, removePreset, getStatusClass, MAX_PRESETS } = useStatusPresets();

    function getStatusLabel(status) {
        const option = statusOptions.value.find((o) => o.value === status);
        return option?.label || status;
    }

    function applyPreset(preset) {
        const D = props.socialStatusDialog;
        D.status = preset.status;
        D.statusDescription = preset.statusDescription;
    }

    async function handleSavePreset() {
        const D = props.socialStatusDialog;
        const result = await addPreset(D.status, D.statusDescription);
        if (result === 'ok') {
            toast.success(t('dialog.social_status.preset_saved'));
        } else if (result === 'exists') {
            toast.info(t('dialog.social_status.preset_exists'));
        } else if (result === 'limit') {
            toast.warning(t('dialog.social_status.preset_limit', { max: MAX_PRESETS }));
        }
    }

    async function handleDeletePreset(index) {
        await removePreset(index);
    }

    const statusOptions = computed(() => {
        const options = [
            {
                value: 'join me',
                statusClass: 'joinme',
                label: t('dialog.user.status.join_me')
            },
            {
                value: 'active',
                statusClass: 'online',
                label: t('dialog.user.status.online')
            },
            {
                value: 'ask me',
                statusClass: 'askme',
                label: t('dialog.user.status.ask_me')
            },
            {
                value: 'busy',
                statusClass: 'busy',
                label: t('dialog.user.status.busy')
            }
        ];
        if (currentUser.value?.$isModerator) {
            options.push({
                value: 'offline',
                statusClass: 'offline',
                label: t('dialog.user.status.offline')
            });
        }
        return options;
    });

    function handleSocialStatusChange(value) {
        props.socialStatusDialog.status = String(value);
    }

    function setSocialStatusFromHistory(val) {
        if (val === null) {
            return;
        }
        const D = props.socialStatusDialog;
        D.statusDescription = val.status;
    }

    function saveSocialStatus() {
        const D = props.socialStatusDialog;
        if (D.loading) {
            return;
        }
        D.loading = true;
        userRequest
            .saveCurrentUser({
                status: D.status,
                statusDescription: D.statusDescription
            })
            .finally(() => {
                D.loading = false;
            })
            .then((args) => {
                D.visible = false;
                toast.success('Status updated');
                return args;
            });
    }
</script>
