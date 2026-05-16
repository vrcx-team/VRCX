<template>
    <div class="flex-1 min-h-0 min-w-0 flex flex-row">
        <DialogHeader class="sr-only">
            <DialogTitle>{{ groupDialog.ref?.name || t('dialog.group.info.header') }}</DialogTitle>
            <DialogDescription>
                {{ groupDialog.ref?.description || groupDialog.ref?.name || t('dialog.group.info.header') }}
            </DialogDescription>
        </DialogHeader>

        <!-- Left: Summary card -->
        <div class="flex-none w-70 pr-4 overflow-y-auto">
            <div class="rounded-xl bg-muted/40 overflow-hidden flex flex-col">
                <!-- Hero: banner with icon overlay -->
                <div class="relative overflow-hidden" style="height: 168px">
                    <img
                        v-if="!groupDialog.loading && !bannerError && groupDialog.ref.bannerUrl"
                        class="w-full h-full object-cover cursor-pointer"
                        :src="groupDialog.ref.bannerUrl"
                        @click="showFullscreenImageDialog(groupDialog.ref.bannerUrl)"
                        @error="bannerError = true"
                        loading="lazy" />
                    <div v-else class="w-full h-full flex items-center justify-center bg-muted">
                        <Image class="size-8 text-muted-foreground" />
                    </div>
                    <div
                        v-if="!groupDialog.loading && groupDialog.ref.iconUrl && !imageError"
                        class="absolute bottom-2 left-2 overflow-hidden rounded-lg"
                        style="width: 64px; height: 64px; border: 2px solid hsl(var(--background))">
                        <img
                            class="w-full h-full object-cover cursor-pointer"
                            :src="groupDialog.ref.iconUrl"
                            @click.stop="showFullscreenImageDialog(groupDialog.ref.iconUrl)"
                            @error="imageError = true"
                            loading="lazy" />
                    </div>
                </div>

                <!-- Card content -->
                <div class="flex flex-col gap-2 p-3">
                    <!-- Name row + buttons -->
                    <div class="flex items-center gap-1 min-w-0">
                        <span v-if="groupDialog.ref.ownerId === currentUser.id" class="flex-none">👑</span>
                        <span
                            class="font-bold truncate cursor-pointer flex-1 min-w-0"
                            v-text="groupDialog.ref.name"
                            @click="copyToClipboard(groupDialog.ref.name)"></span>
                        <div class="flex-none flex items-center gap-1">
                            <template v-if="groupDialog.inGroup && groupDialog.ref?.myMember">
                                <TooltipWrapper
                                    v-if="groupDialog.ref.myMember?.isRepresenting"
                                    side="top"
                                    :content="t('dialog.group.actions.unrepresent_tooltip')">
                                    <Button
                                        class="rounded-lg size-7.5!"
                                        variant="secondary"
                                        size="icon-lg"
                                        @click="clearGroupRepresentation(groupDialog.id)">
                                        <BookmarkCheck />
                                    </Button>
                                </TooltipWrapper>
                                <TooltipWrapper
                                    v-else
                                    side="top"
                                    :content="t('dialog.group.actions.represent_tooltip')">
                                    <span>
                                        <Button
                                            class="rounded-lg size-7.5!"
                                            variant="outline"
                                            size="icon-lg"
                                            :disabled="groupDialog.ref.privacy === 'private'"
                                            @click="setGroupRepresentation(groupDialog.id)">
                                            <Bookmark />
                                        </Button>
                                    </span>
                                </TooltipWrapper>
                            </template>
                            <template v-else-if="groupDialog.ref.myMember?.membershipStatus === 'requested'">
                                <TooltipWrapper
                                    side="top"
                                    :content="t('dialog.group.actions.cancel_join_request_tooltip')">
                                    <span>
                                        <Button
                                            class="rounded-lg size-7.5!"
                                            variant="outline"
                                            size="icon-lg"
                                            @click="cancelGroupRequest(groupDialog.id)">
                                            <X />
                                        </Button>
                                    </span>
                                </TooltipWrapper>
                            </template>
                            <template v-else-if="groupDialog.ref.myMember?.membershipStatus === 'invited'">
                                <TooltipWrapper
                                    side="top"
                                    :content="t('dialog.group.actions.pending_request_tooltip')">
                                    <span>
                                        <Button
                                            class="rounded-lg size-7.5!"
                                            variant="outline"
                                            size="icon-lg"
                                            @click="joinGroup(groupDialog.id)">
                                            <Check />
                                        </Button>
                                    </span>
                                </TooltipWrapper>
                            </template>
                            <template v-else>
                                <TooltipWrapper
                                    v-if="groupDialog.ref.joinState === 'request'"
                                    side="top"
                                    :content="t('dialog.group.actions.request_join_tooltip')">
                                    <Button
                                        class="rounded-lg size-7.5!"
                                        variant="outline"
                                        size="icon-lg"
                                        @click="joinGroup(groupDialog.id)">
                                        <MessageSquare />
                                    </Button>
                                </TooltipWrapper>
                                <TooltipWrapper
                                    v-if="groupDialog.ref.joinState === 'invite'"
                                    side="top"
                                    :content="t('dialog.group.actions.invite_required_tooltip')">
                                    <span>
                                        <Button
                                            class="rounded-lg size-7.5!"
                                            variant="outline"
                                            size="icon-lg"
                                            disabled>
                                            <MessageSquare />
                                        </Button>
                                    </span>
                                </TooltipWrapper>
                                <TooltipWrapper
                                    v-if="groupDialog.ref.joinState === 'open'"
                                    side="top"
                                    :content="t('dialog.group.actions.join_group_tooltip')">
                                    <Button
                                        class="rounded-lg size-7.5!"
                                        variant="outline"
                                        size="icon-lg"
                                        @click="joinGroup(groupDialog.id)">
                                        <Check />
                                    </Button>
                                </TooltipWrapper>
                            </template>
                            <DropdownMenu>
                                <DropdownMenuTrigger as-child>
                                    <Button
                                        class="rounded-lg size-7.5!"
                                        :variant="groupDialog.ref.membershipStatus === 'userblocked' ? 'destructive' : 'outline'"
                                        size="icon-lg">
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem @click="groupDialogCommand('Refresh')">
                                        <RefreshCw class="size-4" />
                                        {{ t('dialog.group.actions.refresh') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="groupDialogCommand('Share')">
                                        <Share2 class="size-4" />
                                        {{ t('dialog.group.actions.share') }}
                                    </DropdownMenuItem>
                                    <template v-if="groupDialog.inGroup">
                                        <template v-if="groupDialog.ref.myMember">
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                v-if="groupDialog.ref.myMember.isSubscribedToAnnouncements"
                                                @click="groupDialogCommand('Unsubscribe To Announcements')">
                                                <BellOff class="size-4" />
                                                {{ t('dialog.group.actions.unsubscribe') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                v-else
                                                @click="groupDialogCommand('Subscribe To Announcements')">
                                                <Bell class="size-4" />
                                                {{ t('dialog.group.actions.subscribe') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                v-if="hasGroupPermission(groupDialog.ref, 'group-invites-manage')"
                                                @click="groupDialogCommand('Invite To Group')">
                                                <MessageSquare class="size-4" />
                                                {{ t('dialog.group.actions.invite_to_group') }}
                                            </DropdownMenuItem>
                                            <template
                                                v-if="hasGroupPermission(groupDialog.ref, 'group-announcement-manage')">
                                                <DropdownMenuItem @click="groupDialogCommand('Create Post')">
                                                    <Ticket class="size-4" />
                                                    {{ t('dialog.group.actions.create_post') }}
                                                </DropdownMenuItem>
                                            </template>
                                            <DropdownMenuItem
                                                :disabled="!hasGroupModerationPermission(groupDialog.ref)"
                                                @click="groupDialogCommand('Moderation Tools')">
                                                <Settings class="size-4" />
                                                {{ t('dialog.group.actions.moderation_tools') }}
                                            </DropdownMenuItem>
                                            <template
                                                v-if="groupDialog.ref.myMember && groupDialog.ref.privacy === 'default'">
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    @click="groupDialogCommand('Visibility Everyone')">
                                                    <Eye class="size-4" />
                                                    <Check
                                                        v-if="groupDialog.ref.myMember.visibility === 'visible'"
                                                        class="size-4" />
                                                    {{ t('dialog.group.actions.visibility_everyone') }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    @click="groupDialogCommand('Visibility Friends')">
                                                    <Eye class="size-4" />
                                                    <Check
                                                        v-if="groupDialog.ref.myMember.visibility === 'friends'"
                                                        class="size-4" />
                                                    {{ t('dialog.group.actions.visibility_friends') }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    @click="groupDialogCommand('Visibility Hidden')">
                                                    <Eye class="size-4" />
                                                    <Check
                                                        v-if="groupDialog.ref.myMember.visibility === 'hidden'"
                                                        class="size-4" />
                                                    {{ t('dialog.group.actions.visibility_hidden') }}
                                                </DropdownMenuItem>
                                            </template>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                @click="groupDialogCommand('Leave Group')">
                                                <Trash2 class="size-4" />
                                                {{ t('dialog.group.actions.leave') }}
                                            </DropdownMenuItem>
                                        </template>
                                    </template>
                                    <template v-else>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            v-if="groupDialog.ref.membershipStatus === 'userblocked'"
                                            variant="destructive"
                                            @click="groupDialogCommand('Unblock Group')">
                                            <CheckCircle class="size-4" />
                                            {{ t('dialog.group.actions.unblock') }}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-else @click="groupDialogCommand('Block Group')">
                                            <XCircle class="size-4" />
                                            {{ t('dialog.group.actions.block') }}
                                        </DropdownMenuItem>
                                    </template>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <!-- Discriminator -->
                    <span class="x-grey font-mono text-xs truncate block">
                        {{ groupDialog.ref.shortCode }}.{{ groupDialog.ref.discriminator }}
                    </span>

                    <!-- Owner -->
                    <span
                        class="x-grey font-mono text-xs truncate block cursor-pointer"
                        @click="showUserDialog(groupDialog.ref.ownerId)"
                        v-text="groupDialog.ownerDisplayName"></span>

                    <!-- Languages -->
                    <div v-if="groupDialog.ref.$languages?.length" class="flex flex-wrap gap-1.5">
                        <TooltipWrapper
                            v-for="item in groupDialog.ref.$languages"
                            :key="item.key"
                            side="top">
                            <template #content>
                                <span>{{ item.value }} ({{ item.key }})</span>
                            </template>
                            <span
                                class="flags"
                                :class="languageClass(item.key)"
                                style="display: inline-block"></span>
                        </TooltipWrapper>
                    </div>

                    <!-- Tags -->
                    <div class="flex flex-wrap gap-1">
                        <Badge v-if="groupDialog.ref.isVerified" variant="outline">
                            {{ t('dialog.group.tags.verified') }}
                        </Badge>
                        <Badge v-if="groupDialog.ref.privacy === 'private'" variant="outline">
                            {{ t('dialog.group.tags.private') }}
                        </Badge>
                        <Badge v-if="groupDialog.ref.privacy === 'default'" variant="outline">
                            {{ t('dialog.group.tags.public') }}
                        </Badge>
                        <Badge v-if="groupDialog.ref.joinState === 'open'" variant="outline">
                            {{ t('dialog.group.tags.open') }}
                        </Badge>
                        <Badge v-else-if="groupDialog.ref.joinState === 'request'" variant="outline">
                            {{ t('dialog.group.tags.request') }}
                        </Badge>
                        <Badge v-else-if="groupDialog.ref.joinState === 'invite'" variant="outline">
                            {{ t('dialog.group.tags.invite') }}
                        </Badge>
                        <Badge v-else-if="groupDialog.ref.joinState === 'closed'" variant="outline">
                            {{ t('dialog.group.tags.closed') }}
                        </Badge>
                        <Badge v-if="groupDialog.inGroup" variant="outline">
                            {{ t('dialog.group.tags.joined') }}
                        </Badge>
                        <Badge v-if="groupDialog.ref.myMember?.bannedAt" variant="outline">
                            {{ t('dialog.group.tags.banned') }}
                        </Badge>
                        <template v-if="groupDialog.inGroup && groupDialog.ref.myMember">
                            <Badge
                                v-if="groupDialog.ref.myMember.visibility === 'visible'"
                                variant="outline">
                                {{ t('dialog.group.tags.visible') }}
                            </Badge>
                            <Badge
                                v-else-if="groupDialog.ref.myMember.visibility === 'friends'"
                                variant="outline">
                                {{ t('dialog.group.tags.friends') }}
                            </Badge>
                            <Badge
                                v-else-if="groupDialog.ref.myMember.visibility === 'hidden'"
                                variant="outline">
                                {{ t('dialog.group.tags.hidden') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.ref.myMember.isSubscribedToAnnouncements"
                                variant="outline">
                                {{ t('dialog.group.tags.subscribed') }}
                            </Badge>
                        </template>
                    </div>

                    <div class="border-t border-border"></div>

                    <!-- ID + URL -->
                    <div class="flex flex-col gap-1.5">
                        <div class="flex items-center gap-1 text-xs">
                            <span class="text-muted-foreground shrink-0">{{ t('dialog.group.info.id') }}</span>
                            <span class="flex-1 truncate font-mono text-[10px] text-muted-foreground">{{ groupDialog.id }}</span>
                            <TooltipWrapper side="top" :content="t('dialog.group.info.id_tooltip')">
                                <Button
                                    class="h-4 w-4 flex-none rounded-full"
                                    size="icon-sm"
                                    variant="ghost"
                                    @click.stop="copyToClipboard(groupDialog.id)">
                                    <Copy class="h-2.5 w-2.5" />
                                </Button>
                            </TooltipWrapper>
                        </div>
                        <div class="flex items-center gap-1 text-xs">
                            <span class="text-muted-foreground shrink-0">URL</span>
                            <span class="flex-1 truncate text-[10px] text-muted-foreground">{{ groupDialog.ref.$url }}</span>
                            <TooltipWrapper side="top" :content="t('dialog.group.info.url_tooltip')">
                                <Button
                                    class="h-4 w-4 flex-none rounded-full"
                                    size="icon-sm"
                                    variant="ghost"
                                    @click.stop="copyToClipboard(groupDialog.ref.$url)">
                                    <Copy class="h-2.5 w-2.5" />
                                </Button>
                            </TooltipWrapper>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats card -->
            <div class="rounded-xl bg-muted/40 p-3 mt-2.5">
                <div class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                    {{ t('dialog.group.info.header') }}
                </div>
                <div class="flex flex-col gap-1.5">
                    <div class="flex justify-between items-start gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.group.info.members') }}</span>
                        <span class="text-right text-muted-foreground">
                            {{ groupDialog.ref.memberCount }} ({{ groupDialog.ref.onlineMemberCount }})
                        </span>
                    </div>
                    <div class="flex justify-between items-start gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.group.info.created_at') }}</span>
                        <span class="text-right text-muted-foreground">
                            {{ formatDateFilter(groupDialog.ref.createdAt, 'long') }}
                        </span>
                    </div>
                    <div
                        class="flex justify-between items-start gap-2 text-xs cursor-pointer hover:text-foreground"
                        @click="showPreviousInstancesListDialog(groupDialog.ref)">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.group.info.last_visited') }}</span>
                        <span class="text-right text-muted-foreground">
                            {{ formatDateFilter(groupDialog.lastVisit, 'long') }}
                        </span>
                    </div>
                    <div v-if="groupDialog.ref.links?.length" class="flex justify-between items-start gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.group.info.links') }}</span>
                        <div class="flex gap-1">
                            <template v-for="(link, index) in groupDialog.ref.links" :key="index">
                                <TooltipWrapper v-if="link">
                                    <template #content>
                                        <span v-text="link" />
                                    </template>
                                    <img
                                        :src="getFaviconUrl(link)"
                                        style="width: 16px; height: 16px; vertical-align: middle; cursor: pointer"
                                        @click.stop="openExternalLink(link)"
                                        loading="lazy" />
                                </TooltipWrapper>
                            </template>
                        </div>
                    </div>
                    <template v-if="groupDialog.ref.membershipStatus === 'member' && groupDialog.ref.myMember">
                        <div class="border-t border-border my-0.5"></div>
                        <div class="flex justify-between items-start gap-2 text-xs">
                            <span class="text-muted-foreground shrink-0">{{ t('dialog.group.info.joined_at') }}</span>
                            <span class="text-right text-muted-foreground">
                                {{ formatDateFilter(groupDialog.ref.myMember.joinedAt, 'long') }}
                            </span>
                        </div>
                        <div class="flex justify-between items-start gap-2 text-xs">
                            <span class="text-muted-foreground shrink-0">{{ t('dialog.group.info.roles') }}</span>
                            <span v-if="groupDialog.memberRoles.length === 0" class="text-right text-muted-foreground">—</span>
                            <span v-else class="text-right text-muted-foreground">
                                <template v-for="(role, rIndex) in groupDialog.memberRoles" :key="rIndex">
                                    <TooltipWrapper side="top">
                                        <template #content>
                                            <span>{{ t('dialog.group.info.role') }} {{ role.name }}</span>
                                            <br />
                                            <span>{{ t('dialog.group.info.role_description') }} {{ role.description }}</span>
                                            <br />
                                            <span v-if="role.updatedAt">
                                                {{ t('dialog.group.info.role_updated_at') }}
                                                {{ formatDateFilter(role.updatedAt, 'long') }}
                                            </span>
                                            <span v-else>
                                                {{ t('dialog.group.info.role_created_at') }}
                                                {{ formatDateFilter(role.createdAt, 'long') }}
                                            </span>
                                            <br />
                                            <span>{{ t('dialog.group.info.role_permissions') }}</span>
                                            <br />
                                            <template v-for="(permission, pIndex) in role.permissions" :key="pIndex">
                                                <span>{{ permission }}</span>
                                                <br />
                                            </template>
                                        </template>
                                        <span>{{ role.name }}{{ rIndex < groupDialog.memberRoles.length - 1 ? ', ' : '' }}</span>
                                    </TooltipWrapper>
                                </template>
                            </span>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- Right: Tabs -->
        <div class="flex-1 min-w-0 flex flex-col min-h-0 pl-4">
            <TabsUnderline
                v-model="groupDialog.activeTab"
                :items="groupDialogTabs"
                :unmount-on-hide="false"
                fill
                @update:modelValue="groupDialogTabClick">
                <template #Info>
                    <GroupDialogInfoTab
                        :show-group-post-edit-dialog="showGroupPostEditDialog"
                        :confirm-delete-group-post="confirmDeleteGroupPost" />
                </template>
                <template #Posts>
                    <GroupDialogPostsTab
                        :show-group-post-edit-dialog="showGroupPostEditDialog"
                        :confirm-delete-group-post="confirmDeleteGroupPost" />
                </template>
                <template #Members>
                    <GroupDialogMembersTab ref="membersTabRef" />
                </template>
                <template #Photos>
                    <GroupDialogPhotosTab ref="photosTabRef" />
                </template>
                <template #JSON>
                    <DialogJsonTab
                        :tree-data="treeData"
                        :tree-data-key="treeData?.group?.id"
                        :dialog-id="groupDialog.id"
                        :dialog-ref="groupDialog.ref"
                        @refresh="refreshGroupDialogTreeData()" />
                </template>
            </TabsUnderline>
        </div>
        <GroupPostEditDialog :dialog-data="groupPostEditDialog" :selected-gallery-file="selectedGalleryFile" />
    </div>
</template>

<script setup>
    import {
        Bell,
        BellOff,
        Bookmark,
        BookmarkCheck,
        Check,
        CheckCircle,
        Copy,
        Eye,
        Image,
        MessageSquare,
        MoreHorizontal,
        RefreshCw,
        Settings,
        Share2,
        Ticket,
        Trash2,
        X,
        XCircle
    } from 'lucide-vue-next';
    import { computed, reactive, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
    import {
        copyToClipboard,
        formatDateFilter,
        getFaviconUrl,
        hasGroupModerationPermission,
        hasGroupPermission,
        languageClass,
        openExternalLink,
        removeFromArray
    } from '../../../shared/utils';
    import { useGalleryStore, useGroupStore, useInstanceStore, useModalStore, useUserStore } from '../../../stores';
    import {
        getGroupDialogGroup,
        showGroupDialog,
        leaveGroupPrompt,
        setGroupVisibility,
        setGroupSubscription
    } from '../../../coordinators/groupCoordinator';
    import { groupRequest, queryRequest } from '../../../api';
    import { queryKeys, refetchActiveEntityQuery } from '../../../queries';
    import { Badge } from '../../ui/badge';
    import { formatJsonVars } from '../../../shared/utils/base/ui';

    import DialogJsonTab from '../DialogJsonTab.vue';
    import GroupDialogInfoTab from './GroupDialogInfoTab.vue';
    import { useGroupDialogCommands } from './useGroupDialogCommands';
    import GroupDialogMembersTab from './GroupDialogMembersTab.vue';
    import GroupDialogPhotosTab from './GroupDialogPhotosTab.vue';
    import GroupDialogPostsTab from './GroupDialogPostsTab.vue';
    import GroupPostEditDialog from './GroupPostEditDialog.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    const { t } = useI18n();
    const groupDialogTabs = computed(() => [
        { value: 'Info', label: t('dialog.group.info.header') },
        { value: 'Posts', label: t('dialog.group.posts.header') },
        { value: 'Members', label: t('dialog.group.members.header') },
        { value: 'Photos', label: t('dialog.group.gallery.header') },
        { value: 'JSON', label: t('dialog.group.json.header') }
    ]);

    const modalStore = useModalStore();

    const { currentUser } = storeToRefs(useUserStore());
    const { groupDialog, inviteGroupDialog } = storeToRefs(useGroupStore());
    const { updateGroupPostSearch, showGroupMemberModerationDialog } = useGroupStore();

    const { showFullscreenImageDialog } = useGalleryStore();
    const instanceStore = useInstanceStore();

    function showPreviousInstancesListDialog(groupRef) {
        instanceStore.showPreviousInstancesListDialog('group', groupRef);
    }

    const { groupDialogCommand } = useGroupDialogCommands(groupDialog, {
        t,
        modalStore,
        currentUser,
        showGroupDialog,
        leaveGroupPrompt,
        setGroupVisibility,
        setGroupSubscription,
        showGroupMemberModerationDialog,
        showInviteGroupDialog: (groupId, userId) => {
            if (groupId) {
                inviteGroupDialog.value.groupId = groupId;
            }
            if (userId) {
                inviteGroupDialog.value.userId = userId;
            }
            inviteGroupDialog.value.visible = true;
        },
        showGroupPostEditDialog,
        groupRequest
    });

    const groupDialogTabCurrentName = ref('0');
    const treeData = ref({});
    const imageError = ref(false);
    const bannerError = ref(false);

    watch(
        () => groupDialog.value.id,
        () => {
            imageError.value = false;
            bannerError.value = false;
        }
    );
    const membersTabRef = ref(null);
    const photosTabRef = ref(null);

    const selectedGalleryFile = ref({
        selectedFileId: '',
        selectedImageUrl: ''
    });
    const groupPostEditDialog = reactive({
        visible: false,
        groupRef: {},
        title: '',
        text: '',
        sendNotification: true,
        visibility: 'group',
        roleIds: [],
        postId: '',
        groupId: ''
    });

    watch(
        () => groupDialog.value.isGetGroupDialogGroupLoading,
        (val) => {
            if (val) {
                loadLastActiveTab();
            }
        }
    );

    function setGroupRepresentation(groupId) {
        handleGroupRepresentationChange(groupId, true);
    }

    function clearGroupRepresentation(groupId) {
        handleGroupRepresentationChange(groupId, false);
    }

    function handleGroupRepresentationChange(groupId, isSet) {
        groupRequest
            .setGroupRepresentation(groupId, {
                isRepresenting: isSet
            })
            .then((args) => {
                if (groupDialog.value.visible && groupDialog.value.id === args.groupId) {
                    updateGroupDialogData({
                        ...groupDialog.value,
                        ref: { ...groupDialog.value.ref, isRepresenting: args.params.isRepresenting }
                    });
                    getGroupDialogGroup(groupId);
                }
                refetchActiveEntityQuery(queryKeys.representedGroup(currentUser.value.id));
            });
    }

    function cancelGroupRequest(id) {
        groupRequest
            .cancelGroupRequest({
                groupId: id
            })
            .then(() => {
                if (groupDialog.value.visible && groupDialog.value.id === id) {
                    getGroupDialogGroup(id);
                }
            });
    }

    function confirmDeleteGroupPost(post) {
        modalStore
            .confirm({
                description: t('confirm.delete_post'),
                title: t('confirm.title'),
                destructive: true
            })
            .then(({ ok }) => {
                if (!ok) return;
                groupRequest
                    .deleteGroupPost({
                        groupId: post.groupId,
                        postId: post.id
                    })
                    .then((args) => {
                        const D = groupDialog.value;
                        if (D.id !== args.params.groupId) {
                            return;
                        }

                        const postId = args.params.postId;
                        for (const item of D.posts) {
                            if (item.id === postId) {
                                removeFromArray(D.posts, item);
                                break;
                            }
                        }
                        if (postId === D.announcement.id) {
                            if (D.posts.length > 0) {
                                D.announcement = D.posts[0];
                            } else {
                                D.announcement = {};
                            }
                        }
                        updateGroupPostSearch();
                    });
            })
            .catch(() => {});
    }

    function joinGroup(id) {
        if (!id) {
            return null;
        }
        return groupRequest
            .joinGroup({
                groupId: id
            })
            .then((args) => {
                if (groupDialog.value.visible && groupDialog.value.id === id) {
                    updateGroupDialogData({
                        ...groupDialog.value,
                        inGroup: args.json.membershipStatus === 'member'
                    });
                    getGroupDialogGroup(id);
                }
                if (args.json.membershipStatus === 'member') {
                    toast.success(t('message.group.joined'));
                } else if (args.json.membershipStatus === 'requested') {
                    toast.success(t('message.group.join_request_sent'));
                }
                return args;
            });
    }

    function handleGroupDialogTab(tabName) {
        groupDialog.value.lastActiveTab = tabName;
        if (tabName === 'Members') {
            membersTabRef.value?.getGroupDialogGroupMembers();
        } else if (tabName === 'Photos') {
            photosTabRef.value?.getGroupGalleries();
        } else if (tabName === 'JSON') {
            refreshGroupDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        handleGroupDialogTab(groupDialog.value.lastActiveTab);
    }

    function groupDialogTabClick(tabName) {
        if (tabName === groupDialogTabCurrentName.value) {
            if (tabName === 'JSON') {
                refreshGroupDialogTreeData();
            }
            return;
        }
        handleGroupDialogTab(tabName);
        groupDialogTabCurrentName.value = tabName;
    }

    function showGroupPostEditDialog(groupId, post) {
        const D = groupPostEditDialog;
        D.sendNotification = true;
        D.groupRef = {};
        D.title = '';
        D.text = '';
        D.visibility = 'group';
        D.roleIds = [];
        D.postId = '';
        D.groupId = groupId;
        selectedGalleryFile.value = {
            selectedFileId: '',
            selectedImageUrl: ''
        };

        if (post) {
            D.title = post.title;
            D.text = post.text;
            D.visibility = post.visibility;
            D.roleIds = post.roleIds;
            D.postId = post.id;
            selectedGalleryFile.value = {
                selectedFileId: post.imageId,
                selectedImageUrl: post.imageUrl
            };
        }
        queryRequest.fetch('group.dialog', { groupId }).then((args) => {
            D.groupRef = args.ref;
        });
        D.visible = true;
    }

    function refreshGroupDialogTreeData() {
        const D = groupDialog.value;
        treeData.value = {
            group: formatJsonVars(D.ref),
            posts: D.posts,
            instances: D.instances,
            members: D.members,
            galleries: D.galleries
        };
    }

    function updateGroupDialogData(obj) {
        groupDialog.value = {
            ...groupDialog.value,
            ...obj
        };
    }
</script>
