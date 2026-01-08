<template>
    <el-dialog
        class="x-dialog"
        v-model="socialStatusDialog.visible"
        :title="t('dialog.social_status.header')"
        append-to-body
        width="400px">
        <div v-loading="socialStatusDialog.loading">
            <Select :model-value="socialStatusDialog.status" @update:modelValue="handleSocialStatusChange">
                <SelectTrigger size="sm" style="margin-top: 10px; width: 100%">
                    <span class="flex items-center gap-2">
                        <i v-if="socialStatusDialog.status === 'join me'" class="x-user-status joinme"></i>
                        <i v-else-if="socialStatusDialog.status === 'active'" class="x-user-status online"></i>
                        <i v-else-if="socialStatusDialog.status === 'ask me'" class="x-user-status askme"></i>
                        <i v-else-if="socialStatusDialog.status === 'busy'" class="x-user-status busy"></i>
                        <i v-else-if="socialStatusDialog.status === 'offline'" class="x-user-status offline"></i>
                        <SelectValue :placeholder="t('dialog.social_status.status_placeholder')" />
                    </span>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="join me" :text-value="t('dialog.user.status.join_me')">
                            <i class="x-user-status joinme"></i> {{ t('dialog.user.status.join_me') }}
                        </SelectItem>
                        <SelectItem value="active" :text-value="t('dialog.user.status.online')">
                            <i class="x-user-status online"></i> {{ t('dialog.user.status.online') }}
                        </SelectItem>
                        <SelectItem value="ask me" :text-value="t('dialog.user.status.ask_me')">
                            <i class="x-user-status askme"></i> {{ t('dialog.user.status.ask_me') }}
                        </SelectItem>
                        <SelectItem value="busy" :text-value="t('dialog.user.status.busy')">
                            <i class="x-user-status busy"></i> {{ t('dialog.user.status.busy') }}
                        </SelectItem>
                        <SelectItem
                            v-if="currentUser.$isModerator"
                            value="offline"
                            :text-value="t('dialog.user.status.offline')">
                            <i class="x-user-status offline"></i> {{ t('dialog.user.status.offline') }}
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            <el-input
                v-model="socialStatusDialog.statusDescription"
                :placeholder="t('dialog.social_status.status_placeholder')"
                maxlength="32"
                show-word-limit
                clearable
                style="margin-top: 10px"></el-input>
            <Collapsible v-model:open="isOpen" class="mt-3 flex w-full flex-col gap-2">
                <div class="flex items-center justify-between gap-4 px-4">
                    <h4 class="text-sm font-semibold">{{ t('dialog.social_status.history') }}</h4>
                    <CollapsibleTrigger as-child>
                        <Button variant="ghost" size="icon" class="size-8">
                            <ChevronsUpDown />
                            <span class="sr-only">Toggle</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <div
                    v-if="!isOpen && latestHistoryItem"
                    class="cursor-pointer rounded-md border w-full px-4 py-2 font-mono text-sm"
                    @click="setSocialStatusFromHistory(latestHistoryItem)">
                    {{ latestHistoryItem.status }}
                </div>
                <CollapsibleContent class="flex flex-col gap-2">
                    <div
                        v-for="item in historyItems"
                        :key="item.no ?? item.status"
                        class="cursor-pointer rounded-md border w-full px-4 py-2 font-mono text-sm"
                        @click="setSocialStatusFromHistory(item)">
                        {{ item.status }}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>

        <template #footer>
            <el-button type="primary" :disabled="socialStatusDialog.loading" @click="saveSocialStatus">
                {{ t('dialog.social_status.update') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { ChevronsUpDown } from 'lucide-vue-next';
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

    const isOpen = ref(false);
    const historyItems = computed(() => props.socialStatusHistoryTable?.data ?? []);
    const latestHistoryItem = computed(() => historyItems.value[0] ?? null);

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
