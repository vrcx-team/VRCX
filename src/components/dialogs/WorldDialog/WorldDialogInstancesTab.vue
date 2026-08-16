<template>
    <div>
        <div class="my-2 rounded-xl bg-(--profile-card) p-3">
            <div class="flex justify-between items-start">
                <div
                    class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                    {{ t('dialog.world.instances.header') }}
                </div>
                <div class="flex gap-1 items-center text-muted-foreground text-[12px]">
                    <span class="inline-flex items-center gap-1 leading-none">
                        <Globe2 class="size-3" />
                        {{ t('dialog.world.instances.public_count', { count: worldDialog.ref.publicOccupants }) }}
                    </span>
                    <span class="ml-2 inline-flex items-center gap-1 leading-none">
                        <LockKeyhole class="size-3" />
                        {{
                            t('dialog.world.instances.private_count', {
                                count: worldDialog.ref.privateOccupants
                            })
                        }}
                    </span>
                </div>
            </div>
            <div v-for="room in worldDialog.rooms" :key="room.id">
                <template v-if="isAgeGatedInstancesVisible || !(room.ageGate || room.location?.includes('~ageGate'))">
                    <div style="margin: 6px 0">
                        <div class="flex flex-wrap gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
                            <LocationWorld
                                class="text-sm"
                                :locationobject="room.$location"
                                :currentuserid="currentUser.id"
                                :worlddialogshortname="worldDialog.$location.shortName" />
                            <InstanceActionBar
                                class="text-sm"
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
                                            <AvatarImage
                                                :src="userImage(room.$location.user, true)"
                                                class="object-cover" />
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
                                <div
                                    class="relative inline-block flex-none size-9 mr-2.5"
                                    :class="userStatusClass(user)">
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
        <div
            v-if="worldDialog.ref.description && worldDialog.ref.name !== worldDialog.ref.description"
            class="my-2 text-xs rounded-xl bg-(--profile-card) p-3">
            <div class="flex justify-between pb-2 border-b border-border">
                <div class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {{ t('dialog.world.info.description') }}
                </div>
                <Button
                    v-if="translationApi"
                    class="w-3 h-3 text-xs text-muted-foreground px-2"
                    size="icon-sm"
                    variant="ghost"
                    @click="translateDescription">
                    <Spinner v-if="isTranslating" class="size-1" />
                    <Languages v-else class="h-3 w-3" />
                </Button>
            </div>
            <div class="flex items-start">
                <span class="flex-1 break-words py-2">
                    {{ translatedDescription || worldDialog.ref.description }}
                </span>
            </div>
        </div>
        <div class="my-2 text-xs rounded-xl bg-(--profile-card) p-3">
            <div
                class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                {{ t('dialog.world.info.memo') }}
            </div>
            <InputGroupTextareaField
                v-model="memo"
                class="text-xs"
                :rows="1"
                :autosize="true"
                :placeholder="t('dialog.world.info.memo_placeholder')"
                input-class="resize-none min-h-0"
                @change="onWorldMemoChange" />
        </div>
    </div>
</template>

<script setup>
    import { Globe2, Languages, LockKeyhole, User } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { refreshInstancePlayerCount } from '../../../coordinators/instanceCoordinator';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useInstanceStore,
        useLocationStore,
        useUserStore,
        useWorldStore
    } from '../../../stores';

    import InstanceActionBar from '../../InstanceActionBar.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';
    import { useWorldMemo } from './useWorldDialogInfo';

    const { t } = useI18n();
    const { userImage, userStatusClass } = useUserDisplay();

    const { isAgeGatedInstancesVisible } = storeToRefs(useAppearanceSettingsStore());

    const { bioLanguage, translationApi } = storeToRefs(useAdvancedSettingsStore());
    const { translateText } = useAdvancedSettingsStore();
    const { currentUser } = storeToRefs(useUserStore());
    const { worldDialog } = storeToRefs(useWorldStore());
    const { memo, onWorldMemoChange } = useWorldMemo(worldDialog);
    const { lastLocation } = storeToRefs(useLocationStore());
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { instanceJoinHistory } = storeToRefs(useInstanceStore());

    const translatedDescription = ref('');
    const isTranslating = ref(false);

    async function translateDescription() {
        if (isTranslating.value) return;

        const description = worldDialog.value.ref.description;
        if (!description) return;

        if (translatedDescription.value) {
            translatedDescription.value = '';
            return;
        }

        isTranslating.value = true;
        try {
            const translated = await translateText(description, bioLanguage.value);
            if (!translated) {
                throw new Error('No translation returned');
            }

            translatedDescription.value = translated;
        } catch (error) {
            console.error('Translation failed:', error);
        } finally {
            isTranslating.value = false;
        }
    }

    watch(
        () => [worldDialog.value.id, worldDialog.value.ref?.description],
        () => {
            translatedDescription.value = '';
        }
    );
</script>
