<template>
    <!-- Instances (full width, one card per instance) -->
    <template v-if="groupDialog.instances.length">
        <div
            v-for="room in groupDialog.instances"
            :key="room.tag"
            class="rounded-xl bg-muted/40 p-3 mb-2.5 flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
                <Location :location="room.tag" class="text-sm flex-1 min-w-0" />
                <InstanceActionBar
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
                style="max-height: 150px; overflow: auto">
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
    </template>

    <!-- Info cards -->
    <div class="flex flex-col gap-2.5">

                <!-- Description card -->
                <div class="rounded-xl bg-muted/40 p-3">
                    <div class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                        {{ t('dialog.group.info.header') }}
                    </div>
                    <pre
                        class="text-xs font-[inherit]"
                        style="white-space: pre-wrap; max-height: 210px; overflow-y: auto"
                        >{{ groupDialog.ref.description || '—' }}</pre>
                </div>

                <!-- Announcement card -->
                <div class="rounded-xl bg-muted/40 p-3">
                    <div class="flex items-center justify-between mb-2 pb-2 border-b border-border">
                        <span class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {{ t('dialog.group.info.announcement') }}
                        </span>
                        <div
                            v-if="groupDialog.announcement.id && hasGroupPermission(groupDialog.ref, 'group-announcement-manage')"
                            class="flex gap-1">
                            <Button
                                class="h-5 w-5"
                                size="icon-sm"
                                variant="ghost"
                                @click="showGroupPostEditDialog(groupDialog.id, groupDialog.announcement)">
                                <Pencil class="h-3 w-3" />
                            </Button>
                            <Button
                                class="h-5 w-5"
                                size="icon-sm"
                                variant="ghost"
                                @click="confirmDeleteGroupPost(groupDialog.announcement)">
                                <Trash2 class="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    <div v-if="groupDialog.announcement.id">
                        <div v-if="groupDialog.announcement.title" class="text-xs font-medium mb-1">
                            {{ groupDialog.announcement.title }}
                        </div>
                        <div v-if="groupDialog.announcement.imageUrl" class="mb-2">
                            <img
                                v-if="!announcementPhotoError"
                                :src="groupDialog.announcement.imageUrl"
                                class="cursor-pointer rounded-md object-cover"
                                style="width: 60px; height: 60px"
                                @click="showFullscreenImageDialog(groupDialog.announcement.imageUrl)"
                                @error="announcementPhotoError = true"
                                loading="lazy" />
                            <div
                                v-else
                                class="flex items-center justify-center bg-muted rounded-md"
                                style="width: 60px; height: 60px">
                                <Image class="size-5 text-muted-foreground" />
                            </div>
                        </div>
                        <pre class="text-xs font-[inherit]" style="white-space: pre-wrap">{{ groupDialog.announcement.text }}</pre>
                        <div class="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <TooltipWrapper v-if="groupDialog.announcement.roleIds?.length" side="top">
                                <template #content>
                                    <span>{{ t('dialog.group.posts.visibility') }}</span>
                                    <br />
                                    <template v-for="roleId in groupDialog.announcement.roleIds" :key="roleId">
                                        <template v-for="role in groupDialog.ref.roles" :key="roleId + role.id">
                                            <span v-if="role.id === roleId" v-text="role.name" />
                                        </template>
                                        <span
                                            v-if="groupDialog.announcement.roleIds.indexOf(roleId) < groupDialog.announcement.roleIds.length - 1">
                                            ,&nbsp;
                                        </span>
                                    </template>
                                </template>
                                <Eye class="h-3 w-3" />
                            </TooltipWrapper>
                            <DisplayName :userid="groupDialog.announcement.authorId" />
                            <span v-if="groupDialog.announcement.editorId">
                                ({{ t('dialog.group.posts.edited_by') }}
                                <DisplayName :userid="groupDialog.announcement.editorId" />)
                            </span>
                            <TooltipWrapper side="bottom">
                                <template #content>
                                    <span>
                                        {{ t('dialog.group.posts.created_at') }}
                                        {{ formatDateFilter(groupDialog.announcement.createdAt, 'long') }}
                                    </span>
                                    <template
                                        v-if="groupDialog.announcement.updatedAt !== groupDialog.announcement.createdAt">
                                        <br />
                                        <span>
                                            {{ t('dialog.group.posts.edited_at') }}
                                            {{ formatDateFilter(groupDialog.announcement.updatedAt, 'long') }}
                                        </span>
                                    </template>
                                </template>
                                <Timer :epoch="Date.parse(groupDialog.announcement.updatedAt)" />
                            </TooltipWrapper>
                        </div>
                    </div>
                    <pre v-else class="text-xs font-[inherit] text-muted-foreground">—</pre>
                </div>

                <!-- Rules card -->
                <div class="rounded-xl bg-muted/40 p-3">
                    <div class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                        {{ t('dialog.group.info.rules') }}
                    </div>
                    <pre
                        class="text-xs font-[inherit]"
                        style="white-space: pre-wrap; max-height: 210px; overflow-y: auto"
                        >{{ groupDialog.ref.rules || '—' }}</pre>
                </div>

                <!-- Upcoming Events card -->
                <div class="rounded-xl bg-muted/40 p-3">
                    <div class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                        {{ t('dialog.group.info.upcoming_events') }}
                    </div>
                    <div v-if="upcomingCalenderEvents.length" class="flex flex-wrap gap-4 overflow-y-auto max-h-[360px] py-2.5">
                        <GroupCalendarEventCard
                            v-for="value in upcomingCalenderEvents"
                            :key="value.id"
                            :event="value"
                            :is-following="value.userInterest?.isFollowing"
                            @update-following-calendar-data="updateFollowingCalendarData"
                            mode="grid"
                            card-class="group-dialog-grid-card" />
                    </div>
                    <span v-else class="text-xs text-muted-foreground">—</span>
                </div>

                <!-- Past Events card -->
                <div class="rounded-xl bg-muted/40 p-3">
                    <div class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                        {{ t('dialog.group.info.past_events') }}
                    </div>
                    <div v-if="pastCalenderEvents.length" class="flex flex-wrap gap-4 overflow-y-auto max-h-[360px] py-2.5">
                        <GroupCalendarEventCard
                            v-for="value in pastCalenderEvents"
                            :key="value.id"
                            :event="value"
                            :is-following="value.userInterest?.isFollowing"
                            @update-following-calendar-data="updateFollowingCalendarData"
                            mode="grid"
                            card-class="group-dialog-grid-card" />
                    </div>
                    <span v-else class="text-xs text-muted-foreground">—</span>
                </div>

    </div>
</template>

<script setup>
    import { Eye, Image, Pencil, Trash2, User } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { hasGroupPermission } from '../../../shared/utils';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { refreshInstancePlayerCount } from '../../../coordinators/instanceCoordinator';
    import { useGalleryStore, useGroupStore, useLocationStore } from '../../../stores';
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
    const { userImage, userStatusClass } = useUserDisplay();

    const { groupDialog } = storeToRefs(useGroupStore());
    const { lastLocation } = storeToRefs(useLocationStore());
    const { showFullscreenImageDialog } = useGalleryStore();

    const { pastCalenderEvents, upcomingCalenderEvents, updateFollowingCalendarData } =
        useGroupCalendarEvents(groupDialog);

    const announcementPhotoError = ref(false);

    watch(
        () => groupDialog.value.id,
        () => {
            announcementPhotoError.value = false;
        }
    );


</script>
