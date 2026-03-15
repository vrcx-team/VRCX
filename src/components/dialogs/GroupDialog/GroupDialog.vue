<template>
    <div class="w-223">
        <DialogHeader class="sr-only">
            <DialogTitle>{{ groupDialog.ref?.name || t('dialog.group.info.header') }}</DialogTitle>
            <DialogDescription>
                {{ groupDialog.ref?.description || groupDialog.ref?.name || t('dialog.group.info.header') }}
            </DialogDescription>
        </DialogHeader>
        <div>
            <div style="display: flex">
                <div style="flex: none; width: 120px; height: 120px">
                    <img
                        v-if="!groupDialog.loading && !imageError"
                        :src="groupDialog.ref.iconUrl"
                        style="width: 120px; height: 120px; border-radius: var(--radius-xl)"
                        class="cursor-pointer"
                        @click="showFullscreenImageDialog(groupDialog.ref.iconUrl)"
                        @error="imageError = true"
                        loading="lazy" />
                    <div
                        v-else-if="!groupDialog.loading"
                        class="flex items-center justify-center bg-muted"
                        style="width: 120px; height: 120px; border-radius: var(--radius-xl)">
                        <Image class="size-8 text-muted-foreground" />
                    </div>
                </div>
                <div class="ml-4" style="flex: 1; display: flex; align-items: flex-start">
                    <div class="group-header" style="flex: 1">
                        <span class="mr-1.5" v-if="groupDialog.ref.ownerId === currentUser.id">👑</span>
                        <span
                            class="font-bold mr-1.5"
                            style="cursor: pointer"
                            v-text="groupDialog.ref.name"
                            @click="copyToClipboard(groupDialog.ref.name)"></span>
                        <span class="group-discriminator x-grey mr-1.5 font-mono text-xs">
                            {{ groupDialog.ref.shortCode }}.{{ groupDialog.ref.discriminator }}
                        </span>
                        <TooltipWrapper v-for="item in groupDialog.ref.$languages" :key="item.key" side="top">
                            <template #content>
                                <span>{{ item.value }} ({{ item.key }})</span>
                            </template>
                            <span
                                class="flags"
                                :class="languageClass(item.key)"
                                style="display: inline-block; margin-right: 6px"></span>
                        </TooltipWrapper>
                        <div style="margin-top: 6px">
                            <span
                                class="cursor-pointer x-grey font-mono"
                                @click="showUserDialog(groupDialog.ref.ownerId)"
                                v-text="groupDialog.ownerDisplayName"></span>
                        </div>
                        <div class="group-tags">
                            <Badge
                                v-if="groupDialog.ref.isVerified"
                                variant="outline"
                                style="margin-right: 6px; margin-top: 6px">
                                {{ t('dialog.group.tags.verified') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.ref.privacy === 'private'"
                                variant="outline"
                                style="margin-right: 6px; margin-top: 6px">
                                {{ t('dialog.group.tags.private') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.ref.privacy === 'default'"
                                variant="outline"
                                style="margin-right: 6px; margin-top: 6px">
                                {{ t('dialog.group.tags.public') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.ref.joinState === 'open'"
                                variant="outline"
                                style="margin-right: 6px; margin-top: 6px">
                                {{ t('dialog.group.tags.open') }}
                            </Badge>
                            <Badge
                                v-else-if="groupDialog.ref.joinState === 'request'"
                                variant="outline"
                                style="margin-right: 6px; margin-top: 6px">
                                {{ t('dialog.group.tags.request') }}
                            </Badge>
                            <Badge
                                v-else-if="groupDialog.ref.joinState === 'invite'"
                                variant="outline"
                                style="margin-right: 6px; margin-top: 6px">
                                {{ t('dialog.group.tags.invite') }}
                            </Badge>
                            <Badge
                                v-else-if="groupDialog.ref.joinState === 'closed'"
                                variant="outline"
                                style="margin-right: 6px; margin-top: 6px">
                                {{ t('dialog.group.tags.closed') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.inGroup"
                                variant="outline"
                                style="margin-right: 6px; margin-top: 6px">
                                {{ t('dialog.group.tags.joined') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.ref.myMember && groupDialog.ref.myMember.bannedAt"
                                variant="outline"
                                style="margin-right: 6px; margin-top: 6px">
                                {{ t('dialog.group.tags.banned') }}
                            </Badge>
                            <template v-if="groupDialog.inGroup && groupDialog.ref.myMember">
                                <Badge
                                    v-if="groupDialog.ref.myMember.visibility === 'visible'"
                                    variant="outline"
                                    style="margin-right: 6px; margin-top: 6px">
                                    {{ t('dialog.group.tags.visible') }}
                                </Badge>
                                <Badge
                                    v-else-if="groupDialog.ref.myMember.visibility === 'friends'"
                                    variant="outline"
                                    style="margin-right: 6px; margin-top: 6px">
                                    {{ t('dialog.group.tags.friends') }}
                                </Badge>
                                <Badge
                                    v-else-if="groupDialog.ref.myMember.visibility === 'hidden'"
                                    variant="outline"
                                    style="margin-right: 6px; margin-top: 6px">
                                    {{ t('dialog.group.tags.hidden') }}
                                </Badge>
                                <Badge
                                    v-if="groupDialog.ref.myMember.isSubscribedToAnnouncements"
                                    variant="outline"
                                    style="margin-right: 6px; margin-top: 6px">
                                    {{ t('dialog.group.tags.subscribed') }}
                                </Badge>
                            </template>
                        </div>
                        <div style="margin-top: 6px">
                            <pre
                                v-show="groupDialog.ref.name !== groupDialog.ref.description"
                                class="text-xs font-[inherit]"
                                style="white-space: pre-wrap; max-height: 40vh; overflow-y: auto"
                                v-text="groupDialog.ref.description"></pre>
                        </div>
                    </div>
                    <div class="ml-2 mt-12">
                        <template v-if="groupDialog.inGroup && groupDialog.ref?.myMember">
                            <TooltipWrapper
                                v-if="groupDialog.ref.myMember?.isRepresenting"
                                side="top"
                                :content="t('dialog.group.actions.unrepresent_tooltip')">
                                <Button
                                    class="rounded-full mr-2"
                                    variant="secondary"
                                    size="icon-lg"
                                    style="margin-left: 6px"
                                    @click="clearGroupRepresentation(groupDialog.id)">
                                    <BookmarkCheck />
                                </Button>
                            </TooltipWrapper>
                            <TooltipWrapper v-else side="top" :content="t('dialog.group.actions.represent_tooltip')">
                                <span>
                                    <Button
                                        class="rounded-full mr-2"
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
                            <TooltipWrapper side="top" :content="t('dialog.group.actions.cancel_join_request_tooltip')">
                                <span>
                                    <Button
                                        class="rounded-full mr-2"
                                        variant="outline"
                                        size="icon-lg"
                                        @click="cancelGroupRequest(groupDialog.id)">
                                        <X />
                                    </Button>
                                </span>
                            </TooltipWrapper>
                        </template>
                        <template v-else-if="groupDialog.ref.myMember?.membershipStatus === 'invited'">
                            <TooltipWrapper side="top" :content="t('dialog.group.actions.pending_request_tooltip')">
                                <span>
                                    <Button
                                        class="rounded-full mr-2"
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
                                    class="rounded-full mr-2"
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
                                    <Button class="rounded-full mr-2" variant="outline" size="icon-lg" disabled>
                                        <MessageSquare />
                                    </Button>
                                </span>
                            </TooltipWrapper>
                            <TooltipWrapper
                                v-if="groupDialog.ref.joinState === 'open'"
                                side="top"
                                :content="t('dialog.group.actions.join_group_tooltip')">
                                <Button
                                    class="rounded-full mr-2"
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
                                    class="rounded-full"
                                    :variant="
                                        groupDialog.ref.membershipStatus === 'userblocked' ? 'destructive' : 'outline'
                                    "
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
                                            <DropdownMenuItem @click="groupDialogCommand('Visibility Everyone')">
                                                <Eye class="size-4" />
                                                <Check
                                                    v-if="groupDialog.ref.myMember.visibility === 'visible'"
                                                    class="size-4" />
                                                {{ t('dialog.group.actions.visibility_everyone') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="groupDialogCommand('Visibility Friends')">
                                                <Eye class="size-4" />
                                                <Check
                                                    v-if="groupDialog.ref.myMember.visibility === 'friends'"
                                                    class="size-4" />
                                                {{ t('dialog.group.actions.visibility_friends') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="groupDialogCommand('Visibility Hidden')">
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
            </div>
            <TabsUnderline
                v-model="groupDialog.activeTab"
                :items="groupDialogTabs"
                :unmount-on-hide="false"
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
        hasGroupModerationPermission,
        hasGroupPermission,
        languageClass,
        removeFromArray
    } from '../../../shared/utils';
    import { useGalleryStore, useGroupStore, useModalStore, useUserStore } from '../../../stores';
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

    watch(
        () => groupDialog.value.id,
        () => {
            imageError.value = false;
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

    /**
     *
     * @param groupId
     */
    function setGroupRepresentation(groupId) {
        handleGroupRepresentationChange(groupId, true);
    }
    /**
     *
     * @param groupId
     */
    function clearGroupRepresentation(groupId) {
        handleGroupRepresentationChange(groupId, false);
    }

    /**
     *
     */

    /**
     *
     * @param groupId
     * @param isSet
     */
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

    /**
     *
     * @param id
     */
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
    /**
     *
     * @param post
     */
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
                        // remove existing post
                        for (const item of D.posts) {
                            if (item.id === postId) {
                                removeFromArray(D.posts, item);
                                break;
                            }
                        }
                        // remove/update announcement
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

    /**
     *
     * @param gallery
     */

    /**
     *
     * @param id
     */
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
                    // groupDialog.value.inGroup = json.membershipStatus === 'member';
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

    /**
     *
     * @param tabName
     */
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

    /**
     *
     */
    function loadLastActiveTab() {
        handleGroupDialogTab(groupDialog.value.lastActiveTab);
    }

    /**
     *
     * @param tabName
     */
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

    /**
     *
     * @param groupId
     * @param post
     */
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

    /**
     *
     */
    /**
     *
     */
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

    /**
     *
     * @param obj
     */
    function updateGroupDialogData(obj) {
        groupDialog.value = {
            ...groupDialog.value,
            ...obj
        };
    }
</script>
