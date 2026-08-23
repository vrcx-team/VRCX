<template>
    <Dialog :open="dialogData.visible" @update:open="handleOpenChange">
        <DialogContent class="sm:max-w-112.5">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.group.transfer.header') }}</DialogTitle>
                <DialogDescription>
                    {{ t('dialog.group.transfer.description', { groupName: dialogData.groupName }) }}
                </DialogDescription>
            </DialogHeader>

            <div class="flex min-h-0 flex-col gap-3">
                <InputGroupField
                    v-model="searchText"
                    clearable
                    :disabled="submitting || checkingMember"
                    :placeholder="t('dialog.group.transfer.search_placeholder')"
                    @input="handleSearchInput" />

                <div v-if="searching" class="flex h-24 items-center justify-center">
                    <Spinner />
                </div>
                <div
                    v-else-if="searchText.length > 0 && searchText.length < MIN_SEARCH_LENGTH"
                    class="py-6 text-center text-sm text-muted-foreground">
                    {{ t('dialog.group.transfer.search_minimum', { count: MIN_SEARCH_LENGTH }) }}
                </div>
                <div
                    v-else-if="searchText.length >= MIN_SEARCH_LENGTH && searchResults.length === 0"
                    class="py-6 text-center text-sm text-muted-foreground">
                    {{ t('dialog.group.transfer.no_results') }}
                </div>
                <div v-else-if="searchResults.length > 0" class="max-h-64 overflow-y-auto">
                    <button
                        v-for="member in searchResults"
                        :key="member.userId"
                        type="button"
                        class="flex w-full items-center rounded-md p-2 text-left hover:bg-accent"
                        :class="{ 'bg-accent': selectedMember?.userId === member.userId }"
                        :aria-pressed="selectedMember?.userId === member.userId"
                        :disabled="submitting || checkingMember"
                        data-testid="transfer-member"
                        @click="selectMember(member)">
                        <Avatar class="mr-3 size-10">
                            <AvatarImage :src="userImage(member.user)" class="object-cover" />
                            <AvatarFallback>
                                <User class="size-4 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                        <span class="min-w-0 flex-1 truncate font-medium">
                            {{ member.user?.displayName || member.userId }}
                        </span>
                        <Check v-if="selectedMember?.userId === member.userId" class="ml-2 size-4" />
                    </button>
                </div>
            </div>

            <DialogFooter>
                <Button variant="secondary" :disabled="submitting" @click="closeDialog">
                    {{ t('dialog.group.transfer.cancel') }}
                </Button>
                <Button
                    variant="destructive"
                    :loading="submitting"
                    :disabled="submitting || !selectedMember"
                    data-testid="transfer-submit"
                    @click="confirmTransfer">
                    {{ t('dialog.group.transfer.submit') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { Check, User } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';
    import { toast } from 'vue-sonner';

    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import { InputGroupField } from '@/components/ui/input-group';
    import { Spinner } from '@/components/ui/spinner';
    import { groupRequest } from '@/api';
    import { showGroupDialog } from '@/coordinators/groupCoordinator';
    import { useUserDisplay } from '@/composables/useUserDisplay';
    import { useModalStore } from '@/stores';
    import { debounce } from '@/shared/utils';

    const MIN_SEARCH_LENGTH = 3;
    const TRANSFER_REQUIREMENT_LABELS = {
        groupNotMonetized: 'dialog.group.transfer.requirements.group_not_monetized',
        hasVRCPlus: 'dialog.group.transfer.requirements.has_vrc_plus',
        hasVerifiedEmail: 'dialog.group.transfer.requirements.has_verified_email',
        targetCanOwnMoreGroups: 'dialog.group.transfer.requirements.can_own_more_groups',
        targetIsGroupMember: 'dialog.group.transfer.requirements.is_group_member'
    };

    const props = defineProps({
        dialogData: {
            type: Object,
            required: true
        }
    });
    const emit = defineEmits(['close']);

    const { t } = useI18n();
    const modalStore = useModalStore();
    const { userImage } = useUserDisplay();

    const searchText = ref('');
    const searchResults = ref([]);
    const selectedMember = ref(null);
    const searching = ref(false);
    const checkingMember = ref(false);
    const submitting = ref(false);
    let searchRequestId = 0;
    let memberCheckRequestId = 0;

    const searchGroupMembersDebounced = debounce(searchGroupMembers, 200);

    watch(
        () => props.dialogData.visible,
        () => {
            resetDialog();
        }
    );

    function resetDialog() {
        searchRequestId += 1;
        memberCheckRequestId += 1;
        searchText.value = '';
        searchResults.value = [];
        selectedMember.value = null;
        searching.value = false;
        checkingMember.value = false;
        submitting.value = false;
    }

    function handleSearchInput() {
        memberCheckRequestId += 1;
        selectedMember.value = null;
        checkingMember.value = false;
        searchResults.value = [];
        searchRequestId += 1;

        if (searchText.value.length < MIN_SEARCH_LENGTH) {
            searching.value = false;
            return;
        }

        searching.value = true;
        searchGroupMembersDebounced(searchText.value, searchRequestId);
    }

    async function searchGroupMembers(query, requestId) {
        if (requestId !== searchRequestId) {
            return;
        }

        try {
            const args = await groupRequest.getGroupMembersSearch({
                groupId: props.dialogData.groupId,
                query,
                n: 100,
                offset: 0
            });

            if (requestId !== searchRequestId || query !== searchText.value) {
                return;
            }

            searchResults.value = args.json.results.filter((member) => member.userId !== props.dialogData.ownerId);
        } finally {
            if (requestId === searchRequestId) {
                searching.value = false;
            }
        }
    }

    async function selectMember(member) {
        if (checkingMember.value || submitting.value) {
            return;
        }

        const requestId = ++memberCheckRequestId;
        selectedMember.value = null;
        checkingMember.value = true;

        try {
            const { json } = await groupRequest.checkTransferGroup({
                groupId: props.dialogData.groupId,
                transferTargetId: member.userId
            });

            if (requestId !== memberCheckRequestId) {
                return;
            }

            const failedRequirements = Object.entries(json.requirements)
                .filter(([, requirementMet]) => !requirementMet)
                .map(([requirement]) => t(TRANSFER_REQUIREMENT_LABELS[requirement]));

            if (failedRequirements.length > 0) {
                await modalStore.alert({
                    title: t('dialog.group.transfer.requirements_title'),
                    description: t('dialog.group.transfer.requirements_description', {
                        displayName: member.user?.displayName || member.userId,
                        requirements: failedRequirements.join('; ')
                    })
                });
                return;
            }

            selectedMember.value = member;
        } finally {
            if (requestId === memberCheckRequestId) {
                checkingMember.value = false;
            }
        }
    }

    async function confirmTransfer() {
        const member = selectedMember.value;
        if (!member || submitting.value) {
            return;
        }

        const displayName = member.user?.displayName || member.userId;
        submitting.value = true;
        try {
            const { ok } = await modalStore.confirm({
                title: t('dialog.group.transfer.confirm_title'),
                description: t('dialog.group.transfer.confirm_description', {
                    displayName,
                    groupName: props.dialogData.groupName
                }),
                destructive: true
            });
            if (!ok) {
                return;
            }

            await groupRequest.transferGroup({
                groupId: props.dialogData.groupId,
                transferTargetId: member.userId
            });
            toast.success(t('message.group.transfer_requested'));
            emit('close');
            showGroupDialog(props.dialogData.groupId, { forceRefresh: true });
        } finally {
            submitting.value = false;
        }
    }

    function closeDialog() {
        if (!submitting.value) {
            emit('close');
        }
    }

    function handleOpenChange(open) {
        if (!open) {
            closeDialog();
        }
    }
</script>
