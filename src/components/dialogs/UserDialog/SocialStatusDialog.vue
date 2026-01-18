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

            <DialogFooter>
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
    import { Check, History } from 'lucide-vue-next';
    import { InputGroupButton, InputGroupField } from '@/components/ui/input-group';
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useUserStore } from '../../../stores';
    import { userRequest } from '../../../api';

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
