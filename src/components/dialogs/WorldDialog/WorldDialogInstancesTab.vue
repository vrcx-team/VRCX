<template>
    <div>
        <div class="flex items-center text-sm">
            <User />
            {{ t('dialog.world.instances.public_count', { count: worldDialog.ref.publicOccupants }) }}
            <User style="margin-left: 8px" />
            {{
                t('dialog.world.instances.private_count', {
                    count: worldDialog.ref.privateOccupants
                })
            }}
            <Check style="margin-left: 8px" />
            {{
                t('dialog.world.instances.capacity_count', {
                    count: worldDialog.ref.recommendedCapacity,
                    max: worldDialog.ref.capacity
                })
            }}
        </div>
        <div v-for="room in worldDialog.rooms" :key="room.id">
            <template v-if="isAgeGatedInstancesVisible || !(room.ageGate || room.location?.includes('~ageGate'))">
                <div style="margin: 6px 0">
                    <div class="flex items-center">
                        <LocationWorld
                            class="text-sm"
                            :locationobject="room.$location"
                            :currentuserid="currentUser.id"
                            :worlddialogshortname="worldDialog.$location.shortName" />
                        <InstanceActionBar
                            class="ml-1 text-sm"
                            :location="room.$location.tag"
                            :launch-location="room.tag"
                            :instance-location="room.tag"
                            :shortname="room.$location.shortName"
                            :currentlocation="lastLocation.location"
                            :instance="room.ref"
                            :friendcount="room.friendCount"
                            :refresh-tooltip="t('dialog.world.instances.refresh_instance_info')"
                            :show-history="!!instanceJoinHistory.get(room.$location.tag)"
                            :history-tooltip="t('dialog.previous_instances.info')"
                            :on-refresh="() => refreshInstancePlayerCount(room.tag)"
                            :on-history="() => showPreviousInstancesInfoDialog(room.location)" />
                    </div>
                    <div
                        v-if="room.$location.userId || room.users.length"
                        class="flex flex-wrap items-start"
                        style="margin: 8px 0; max-height: unset">
                        <div
                            v-if="room.$location.userId"
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                            @click="showUserDialog(room.$location.userId)">
                            <template v-if="room.$location.user">
                                <div
                                    class="relative inline-block flex-none size-9 mr-2.5"
                                    :class="userStatusClass(room.$location.user)">
                                    <Avatar class="size-9">
                                        <AvatarImage :src="userImage(room.$location.user, true)" class="object-cover" />
                                        <AvatarFallback>
                                            <User class="size-4 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div class="flex-1 overflow-hidden">
                                    <span
                                        class="block truncate font-medium leading-[18px]"
                                        :style="{ color: room.$location.user.$userColour }"
                                        v-text="room.$location.user.displayName" />
                                    <span class="block truncate text-xs">
                                        {{ t('dialog.world.instances.instance_creator') }}
                                    </span>
                                </div>
                            </template>
                            <span v-else v-text="room.$location.userId" />
                        </div>
                        <div
                            v-for="user in room.users"
                            :key="user.id"
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                            @click="showUserDialog(user.id)">
                            <div class="relative inline-block flex-none size-9 mr-2.5" :class="userStatusClass(user)">
                                <Avatar class="size-9">
                                    <AvatarImage :src="userImage(user, true)" class="object-cover" />
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
        </div>
    </div>
</template>

<script setup>
    import { Check, User } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { refreshInstancePlayerCount } from '../../../coordinators/instanceCoordinator';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import {
        useAppearanceSettingsStore,
        useInstanceStore,
        useLocationStore,
        useUserStore,
        useWorldStore
    } from '../../../stores';

    import InstanceActionBar from '../../InstanceActionBar.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    const { t } = useI18n();
    const { userImage, userStatusClass } = useUserDisplay();

    const { isAgeGatedInstancesVisible } = storeToRefs(useAppearanceSettingsStore());

    const { currentUser } = storeToRefs(useUserStore());
    const { worldDialog } = storeToRefs(useWorldStore());
    const { lastLocation } = storeToRefs(useLocationStore());
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { instanceJoinHistory } = storeToRefs(useInstanceStore());
</script>
