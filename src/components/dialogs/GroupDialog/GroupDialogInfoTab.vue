<template>
    <div>
        <img
            v-if="!groupDialog.loading && !bannerError"
            :src="groupDialog.ref.bannerUrl"
            class="cursor-pointer"
            style="flex: none; width: 100%; aspect-ratio: 6/1; object-fit: cover; border-radius: var(--radius-md)"
            @click="showFullscreenImageDialog(groupDialog.ref.bannerUrl)"
            @error="bannerError = true"
            loading="lazy" />
        <div
            v-else-if="!groupDialog.loading"
            class="flex items-center justify-center bg-muted"
            style="width: 100%; aspect-ratio: 6/1; border-radius: var(--radius-md)">
            <Image class="size-8 text-muted-foreground" />
        </div>
    </div>
    <div class="flex flex-wrap items-start px-2.5" style="max-height: none">
        <span v-if="groupDialog.instances.length" class="text-xs font-bold" style="margin: 6px">
            {{ t('dialog.group.info.instances') }}
        </span>
        <div v-for="room in groupDialog.instances" :key="room.tag" style="width: 100%">
            <div style="margin: 6px 0" class="flex items-center">
                <Location :location="room.tag" class="text-sm" />
                <InstanceActionBar
                    class="ml-1"
                    :location="room.tag"
                    :currentlocation="lastLocation.location"
                    :instance="room.ref"
                    :friendcount="room.friendCount"
                    refresh-tooltip="Refresh player count"
                    :on-refresh="() => refreshInstancePlayerCount(room.tag)" />
            </div>
            <div
                v-if="room.users.length"
                class="flex flex-wrap items-start"
                style="margin: 8px 0; padding: 0; max-height: unset">
                <div
                    v-for="user in room.users"
                    :key="user.id"
                    class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                    @click="showUserDialog(user.id)">
                    <div class="relative inline-block flex-none size-9 mr-2.5" :class="userStatusClass(user)">
                        <Avatar class="size-9">
                            <AvatarImage :src="userImage(user)" class="object-cover" />
                            <AvatarFallback>
                                <User class="size-4 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <span
                            class="block truncate font-medium leading-[18px]"
                            :style="{ color: user.$userColour }"
                            v-text="user.displayName" />
                        <span v-if="user.location === 'traveling'" class="block truncate text-xs">
                            <Spinner class="inline-block mr-1" />
                            <Timer :epoch="user.$travelingToTime" />
                        </span>
                        <span v-else class="block truncate text-xs">
                            <Timer :epoch="user.$location_at" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.group.info.announcement') }}</span>
                <span style="display: block" v-text="groupDialog.announcement.title" />
                <div v-if="groupDialog.announcement.imageUrl" style="display: inline-block; margin-right: 6px">
                    <img
                        v-if="!announcementPhotoError"
                        :src="groupDialog.announcement.imageUrl"
                        class="cursor-pointer"
                        style="
                            flex: none;
                            width: 60px;
                            height: 60px;
                            border-radius: var(--radius-md);
                            object-fit: cover;
                        "
                        @click="showFullscreenImageDialog(groupDialog.announcement.imageUrl)"
                        @error="announcementPhotoError = true"
                        loading="lazy" />
                    <div
                        v-else
                        class="flex items-center justify-center bg-muted"
                        style="width: 60px; height: 60px; border-radius: var(--radius-md)">
                        <Image class="size-5 text-muted-foreground" />
                    </div>
                </div>
                <pre
                    class="text-xs font-[inherit]"
                    style="display: inline-block; vertical-align: top; white-space: pre-wrap; margin: 0"
                    >{{ groupDialog.announcement.text || '-' }}</pre
                >
                <br />
                <div v-if="groupDialog.announcement.id" class="text-xs" style="float: right; margin-left: 6px">
                    <TooltipWrapper v-if="groupDialog.announcement.roleIds.length" side="top">
                        <template #content>
                            <span>{{ t('dialog.group.posts.visibility') }}</span>
                            <br />
                            <template v-for="roleId in groupDialog.announcement.roleIds" :key="roleId">
                                <template v-for="role in groupDialog.ref.roles" :key="roleId + role.id"
                                    ><span v-if="role.id === roleId" v-text="role.name"
                                /></template>
                                <span
                                    v-if="
                                        groupDialog.announcement.roleIds.indexOf(roleId) <
                                        groupDialog.announcement.roleIds.length - 1
                                    ">
                                    ,&nbsp;
                                </span>
                            </template>
                        </template>
                        <Eye style="margin-right: 6px" />
                    </TooltipWrapper>
                    <DisplayName :userid="groupDialog.announcement.authorId" style="margin-right: 6px" />
                    <span v-if="groupDialog.announcement.editorId" style="margin-right: 6px">
                        ({{ t('dialog.group.posts.edited_by') }}
                        <DisplayName :userid="groupDialog.announcement.editorId" />)
                    </span>
                    <TooltipWrapper side="bottom">
                        <template #content>
                            <span
                                >{{ t('dialog.group.posts.created_at') }}
                                {{ formatDateFilter(groupDialog.announcement.createdAt, 'long') }}</span
                            >
                            <template v-if="groupDialog.announcement.updatedAt !== groupDialog.announcement.createdAt">
                                <br />
                                <span
                                    >{{ t('dialog.group.posts.edited_at') }}
                                    {{ formatDateFilter(groupDialog.announcement.updatedAt, 'long') }}</span
                                >
                            </template>
                        </template>
                        <Timer :epoch="Date.parse(groupDialog.announcement.updatedAt)" />
                    </TooltipWrapper>
                    <template v-if="hasGroupPermission(groupDialog.ref, 'group-announcement-manage')">
                        <TooltipWrapper side="top" :content="t('dialog.group.posts.edit_tooltip')">
                            <Button
                                size="sm"
                                variant="ghost"
                                style="margin-left: 6px; padding: 0"
                                @click="showGroupPostEditDialog(groupDialog.id, groupDialog.announcement)"></Button>
                        </TooltipWrapper>
                        <TooltipWrapper side="top" :content="t('dialog.group.posts.delete_tooltip')">
                            <Button
                                size="sm"
                                variant="ghost"
                                style="margin-left: 6px; padding: 0"
                                @click="confirmDeleteGroupPost(groupDialog.announcement)"></Button>
                        </TooltipWrapper>
                    </template>
                </div>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.group.info.rules') }}</span>
                <pre class="text-xs font-[inherit] whitespace-pre-wrap mr-2 my-0 ml-0">{{
                    groupDialog.ref.rules || '-'
                }}</pre>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1" style="overflow: visible">
                <span class="block truncate font-medium leading-[18px]">{{
                    t('dialog.group.info.upcoming_events')
                }}</span>
                <template v-if="upcomingCalenderEvents.length > 0">
                    <br />
                    <div class="grid-view flex flex-wrap gap-4 overflow-y-auto max-h-[360px] py-2.5">
                        <GroupCalendarEventCard
                            v-for="value in upcomingCalenderEvents"
                            :key="value.id"
                            :event="value"
                            :is-following="value.userInterest?.isFollowing"
                            @update-following-calendar-data="updateFollowingCalendarData"
                            mode="grid"
                            card-class="group-dialog-grid-card" />
                    </div>
                </template>
                <span v-else class="block truncate text-xs">-</span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1" style="overflow: visible">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.group.info.past_events') }}</span>
                <template v-if="pastCalenderEvents.length > 0">
                    <br />
                    <div class="grid-view flex flex-wrap gap-4 overflow-y-auto max-h-[360px] py-2.5">
                        <GroupCalendarEventCard
                            v-for="value in pastCalenderEvents"
                            :key="value.id"
                            :event="value"
                            :is-following="value.userInterest?.isFollowing"
                            @update-following-calendar-data="updateFollowingCalendarData"
                            mode="grid"
                            card-class="group-dialog-grid-card" />
                    </div>
                </template>
                <span v-else class="block truncate text-xs">-</span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.group.info.members') }}</span>
                <div class="block truncate text-xs">
                    {{ groupDialog.ref.memberCount }} ({{ groupDialog.ref.onlineMemberCount }})
                </div>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.group.info.created_at') }}</span>
                <span class="block truncate text-xs">{{ formatDateFilter(groupDialog.ref.createdAt, 'long') }}</span>
            </div>
        </div>
        <div
            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
            @click="showPreviousInstancesListDialog(groupDialog.ref)">
            <div class="flex-1 overflow-hidden">
                <div
                    class="block truncate font-medium leading-[18px]"
                    style="display: flex; justify-content: space-between; align-items: center">
                    <span>
                        {{ t('dialog.group.info.last_visited') }}
                    </span>
                    <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                        <MoreHorizontal style="margin-right: 16px" />
                    </TooltipWrapper>
                </div>
                <span class="block truncate text-xs">{{ formatDateFilter(groupDialog.lastVisit, 'long') }}</span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.group.info.links') }}</span>
                <div
                    v-if="groupDialog.ref.links && groupDialog.ref.links.length > 0"
                    style="margin-top: 6px"
                    class="flex">
                    <template v-for="(link, index) in groupDialog.ref.links" :key="index">
                        <TooltipWrapper v-if="link">
                            <template #content>
                                <span v-text="link" />
                            </template>
                            <img
                                :src="getFaviconUrl(link)"
                                style="
                                    width: 16px;
                                    height: 16px;
                                    vertical-align: middle;
                                    margin-right: 6px;
                                    cursor: pointer;
                                "
                                @click.stop="openExternalLink(link)"
                                loading="lazy" />
                        </TooltipWrapper>
                    </template>
                </div>
                <div v-else class="block truncate text-xs">-</div>
            </div>
        </div>
        <div class="inline-flex justify-between w-full">
            <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-1/2">
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">{{ t('dialog.group.info.url') }}</span>
                    <span class="block truncate text-xs"
                        >{{ groupDialog.ref.$url }}
                        <TooltipWrapper side="top" :content="t('dialog.group.info.url_tooltip')">
                            <Button
                                class="rounded-full ml-1 text-xs"
                                size="icon-sm"
                                variant="ghost"
                                @click="copyToClipboard(groupDialog.ref.$url)"
                                ><Copy class="h-4 w-4" />
                            </Button> </TooltipWrapper
                    ></span>
                </div>
            </div>
            <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-1/2">
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">{{ t('dialog.group.info.id') }}</span>
                    <span class="block truncate text-xs"
                        >{{ groupDialog.id }}
                        <TooltipWrapper side="top" :content="t('dialog.group.info.id_tooltip')">
                            <Button
                                class="rounded-full ml-1 text-xs"
                                size="icon-sm"
                                variant="ghost"
                                @click="copyToClipboard(groupDialog.id)"
                                ><Copy class="h-4 w-4" />
                            </Button> </TooltipWrapper
                    ></span>
                </div>
            </div>
        </div>
        <div
            v-if="groupDialog.ref.membershipStatus === 'member'"
            class="border-t border-border"
            style="width: 100%; margin-top: 8px">
            <div style="width: 100%; display: flex; margin-top: 8px">
                <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                    <div class="flex-1 overflow-hidden">
                        <span class="block truncate font-medium leading-[18px]">{{
                            t('dialog.group.info.joined_at')
                        }}</span>
                        <span class="block truncate text-xs">{{
                            formatDateFilter(groupDialog.ref.myMember.joinedAt, 'long')
                        }}</span>
                    </div>
                </div>
                <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                    <div class="flex-1 overflow-hidden">
                        <span class="block truncate font-medium leading-[18px]">{{
                            t('dialog.group.info.roles')
                        }}</span>
                        <span v-if="groupDialog.memberRoles.length === 0" class="block truncate text-xs"> - </span>
                        <span v-else class="block truncate text-xs">
                            <template v-for="(role, rIndex) in groupDialog.memberRoles" :key="rIndex">
                                <TooltipWrapper side="top">
                                    <template #content>
                                        <span>{{ t('dialog.group.info.role') }} {{ role.name }}</span>
                                        <br />
                                        <span
                                            >{{ t('dialog.group.info.role_description') }} {{ role.description }}</span
                                        >
                                        <br />
                                        <span v-if="role.updatedAt"
                                            >{{ t('dialog.group.info.role_updated_at') }}
                                            {{ formatDateFilter(role.updatedAt, 'long') }}</span
                                        >
                                        <span v-else
                                            >{{ t('dialog.group.info.role_created_at') }}
                                            {{ formatDateFilter(role.createdAt, 'long') }}</span
                                        >
                                        <br />
                                        <span>{{ t('dialog.group.info.role_permissions') }}</span>
                                        <br />
                                        <template v-for="(permission, pIndex) in role.permissions" :key="pIndex">
                                            <span>{{ permission }}</span>
                                            <br />
                                        </template>
                                    </template>
                                    <span
                                        >{{ role.name
                                        }}{{ rIndex < groupDialog.memberRoles.length - 1 ? ', ' : '' }}</span
                                    >
                                </TooltipWrapper>
                            </template>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { Copy, Eye, Image, MoreHorizontal, User } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        copyToClipboard,
        formatDateFilter,
        getFaviconUrl,
        hasGroupPermission,
        openExternalLink,
        userImage,
        userStatusClass
    } from '../../../shared/utils';
    import { refreshInstancePlayerCount } from '../../../coordinators/instanceCoordinator';
    import { useGalleryStore, useGroupStore, useInstanceStore, useLocationStore } from '../../../stores';
    import { useGroupCalendarEvents } from './useGroupCalendarEvents';

    import GroupCalendarEventCard from '../../../views/Tools/components/GroupCalendarEventCard.vue';
    import InstanceActionBar from '../../InstanceActionBar.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    defineProps({
        showGroupPostEditDialog: {
            type: Function,
            required: true
        },
        confirmDeleteGroupPost: {
            type: Function,
            required: true
        }
    });

    const { t } = useI18n();

    const { groupDialog } = storeToRefs(useGroupStore());
    const { lastLocation } = storeToRefs(useLocationStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const instanceStore = useInstanceStore();

    const { pastCalenderEvents, upcomingCalenderEvents, updateFollowingCalendarData } = useGroupCalendarEvents(groupDialog);

    const bannerError = ref(false);
    const announcementPhotoError = ref(false);

    watch(
        () => groupDialog.value.id,
        () => {
            bannerError.value = false;
            announcementPhotoError.value = false;
        }
    );

    /**
     *
     * @param groupRef
     */
    function showPreviousInstancesListDialog(groupRef) {
        instanceStore.showPreviousInstancesListDialog('group', groupRef);
    }
</script>
