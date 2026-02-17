<template>
    <Sheet v-model:open="isNotificationCenterOpen">
        <SheetContent side="right" class="flex flex-col p-0 sm:max-w-md px-1" @open-auto-focus.prevent>
            <SheetHeader class="border-b px-4 pt-4 pb-3">
                <div class="flex items-center pr-6">
                    <SheetTitle>{{ t('side_panel.notification_center.title') }}</SheetTitle>
                </div>
            </SheetHeader>
            <Tabs v-model="activeTab" class="flex min-h-0 flex-1 flex-col">
                <TabsList class="mr-4 ml-2 mt-2 grid w-auto grid-cols-3">
                    <TabsTrigger value="friend">
                        {{ t('side_panel.notification_center.tab_friend') }}
                        <span v-if="activeCount.friend" class="ml-1 text-xs text-muted-foreground">
                            ({{ activeCount.friend }})
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="group">
                        {{ t('side_panel.notification_center.tab_group') }}
                        <span v-if="activeCount.group" class="ml-1 text-xs text-muted-foreground">
                            ({{ activeCount.group }})
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="other">
                        {{ t('side_panel.notification_center.tab_other') }}
                        <span v-if="activeCount.other" class="ml-1 text-xs text-muted-foreground">
                            ({{ activeCount.other }})
                        </span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="friend" class="mt-0 min-h-0 flex-1 overflow-hidden">
                    <NotificationList
                        :notifications="friendNotifications"
                        :unseen-ids="unseenNotifications"
                        @show-invite-response="showSendInviteResponseDialog"
                        @show-invite-request-response="showSendInviteRequestResponseDialog"
                        @navigate-to-table="navigateToTable" />
                </TabsContent>
                <TabsContent value="group" class="mt-0 min-h-0 flex-1 overflow-hidden">
                    <NotificationList
                        :notifications="groupNotifications"
                        :unseen-ids="unseenNotifications"
                        @show-invite-response="showSendInviteResponseDialog"
                        @show-invite-request-response="showSendInviteRequestResponseDialog"
                        @navigate-to-table="navigateToTable" />
                </TabsContent>
                <TabsContent value="other" class="mt-0 min-h-0 flex-1 overflow-hidden">
                    <NotificationList
                        :notifications="otherNotifications"
                        :unseen-ids="unseenNotifications"
                        @show-invite-response="showSendInviteResponseDialog"
                        @show-invite-request-response="showSendInviteRequestResponseDialog"
                        @navigate-to-table="navigateToTable" />
                </TabsContent>
            </Tabs>
        </SheetContent>
    </Sheet>
    <SendInviteResponseDialog
        v-model:send-invite-response-dialog="sendInviteResponseDialog"
        v-model:sendInviteResponseDialogVisible="sendInviteResponseDialogVisible" />
    <SendInviteRequestResponseDialog
        v-model:send-invite-response-dialog="sendInviteResponseDialog"
        v-model:sendInviteRequestResponseDialogVisible="sendInviteRequestResponseDialogVisible" />
</template>

<script setup>
    import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { computed, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import { useGalleryStore, useInviteStore, useNotificationStore } from '../../../stores';

    import NotificationList from './NotificationList.vue';
    import SendInviteRequestResponseDialog from '../../Notifications/dialogs/SendInviteRequestResponseDialog.vue';
    import SendInviteResponseDialog from '../../Notifications/dialogs/SendInviteResponseDialog.vue';

    const { t } = useI18n();
    const router = useRouter();
    const { refreshInviteMessageTableData } = useInviteStore();
    const { clearInviteImageUpload } = useGalleryStore();

    const {
        isNotificationCenterOpen,
        friendNotifications,
        groupNotifications,
        otherNotifications,
        unseenNotifications
    } = storeToRefs(useNotificationStore());

    const activeTab = ref('friend');

    const activeCount = computed(() => ({
        friend: friendNotifications.value.filter((n) => !n.$isExpired).length,
        group: groupNotifications.value.filter((n) => !n.$isExpired).length,
        other: otherNotifications.value.filter((n) => !n.$isExpired).length
    }));

    // Dialog state
    const sendInviteResponseDialog = ref({
        messageSlot: {},
        invite: {}
    });
    const sendInviteResponseDialogVisible = ref(false);
    const sendInviteRequestResponseDialogVisible = ref(false);

    function navigateToTable() {
        isNotificationCenterOpen.value = false;
        router.push({ name: 'notification' });
    }

    function showSendInviteResponseDialog(invite) {
        sendInviteResponseDialog.value.invite = invite;
        sendInviteResponseDialog.value.messageSlot = {};
        refreshInviteMessageTableData('response');
        clearInviteImageUpload();
        sendInviteResponseDialogVisible.value = true;
    }

    function showSendInviteRequestResponseDialog(invite) {
        sendInviteResponseDialog.value.invite = invite;
        sendInviteResponseDialog.value.messageSlot = {};
        refreshInviteMessageTableData('requestResponse');
        clearInviteImageUpload();
        sendInviteRequestResponseDialogVisible.value = true;
    }
</script>
