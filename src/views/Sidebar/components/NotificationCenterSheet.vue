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
                        <span v-if="unseenFriendNotifications.length" class="ml-1 text-xs text-muted-foreground">
                            ({{ unseenFriendNotifications.length }})
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="group">
                        {{ t('side_panel.notification_center.tab_group') }}
                        <span v-if="unseenGroupNotifications.length" class="ml-1 text-xs text-muted-foreground">
                            ({{ unseenGroupNotifications.length }})
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="other">
                        {{ t('side_panel.notification_center.tab_other') }}
                        <span v-if="unseenOtherNotifications.length" class="ml-1 text-xs text-muted-foreground">
                            ({{ unseenOtherNotifications.length }})
                        </span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="friend" class="mt-0 min-h-0 flex-1 overflow-hidden">
                    <NotificationList
                        :notifications="unseenFriendNotifications"
                        @show-invite-response="showSendInviteResponseDialog"
                        @show-invite-request-response="showSendInviteRequestResponseDialog"
                        @navigate-to-table="navigateToTable" />
                </TabsContent>
                <TabsContent value="group" class="mt-0 min-h-0 flex-1 overflow-hidden">
                    <NotificationList
                        :notifications="unseenGroupNotifications"
                        @show-invite-response="showSendInviteResponseDialog"
                        @show-invite-request-response="showSendInviteRequestResponseDialog"
                        @navigate-to-table="navigateToTable" />
                </TabsContent>
                <TabsContent value="other" class="mt-0 min-h-0 flex-1 overflow-hidden">
                    <NotificationList
                        :notifications="unseenOtherNotifications"
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
    import { ref } from 'vue';
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

    const { isNotificationCenterOpen, unseenFriendNotifications, unseenGroupNotifications, unseenOtherNotifications } =
        storeToRefs(useNotificationStore());

    const activeTab = ref('friend');

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
