<template>
    <Dialog v-model:open="newInstanceDialog.visible">
        <DialogContent class="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.new_instance.header') }}</DialogTitle>
                <DialogDescription class="sr-only">{{ t('dialog.new_instance.header') }}</DialogDescription>
            </DialogHeader>
            <TabsUnderline
                v-model="newInstanceDialog.selectedTab"
                :items="newInstanceTabs"
                :unmount-on-hide="false"
                @update:modelValue="newInstanceTabClick">
                <template #Normal>
                    <FieldGroup class="gap-4">
                        <Field>
                            <FieldLabel>{{ t('dialog.new_instance.access_type') }}</FieldLabel>
                            <FieldContent>
                                <ToggleGroup
                                    type="single"
                                    required
                                    variant="outline"
                                    size="sm"
                                    :model-value="newInstanceDialog.accessType"
                                    @update:model-value="
                                        (value) => {
                                            newInstanceDialog.accessType = value;
                                            buildInstance();
                                        }
                                    ">
                                    <ToggleGroupItem value="public">{{
                                        t('dialog.new_instance.access_type_public')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="group">{{
                                        t('dialog.new_instance.access_type_group')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="friends+">{{
                                        t('dialog.new_instance.access_type_friend_plus')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="friends">{{
                                        t('dialog.new_instance.access_type_friend')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="invite+">{{
                                        t('dialog.new_instance.access_type_invite_plus')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="invite">{{
                                        t('dialog.new_instance.access_type_invite')
                                    }}</ToggleGroupItem>
                                </ToggleGroup>
                            </FieldContent>
                        </Field>
                        <Field v-if="newInstanceDialog.accessType === 'group'">
                            <FieldLabel>{{ t('dialog.new_instance.group_access_type') }}</FieldLabel>
                            <FieldContent>
                                <ToggleGroup
                                    type="single"
                                    required
                                    variant="outline"
                                    size="sm"
                                    :model-value="newInstanceDialog.groupAccessType"
                                    @update:model-value="
                                        (value) => {
                                            newInstanceDialog.groupAccessType = value;
                                            buildInstance();
                                        }
                                    ">
                                    <ToggleGroupItem
                                        value="members"
                                        :disabled="
                                            !hasGroupPermission(
                                                newInstanceDialog.groupRef,
                                                'group-instance-open-create'
                                            )
                                        "
                                        >{{ t('dialog.new_instance.group_access_type_members') }}</ToggleGroupItem
                                    >
                                    <ToggleGroupItem
                                        value="plus"
                                        :disabled="
                                            !hasGroupPermission(
                                                newInstanceDialog.groupRef,
                                                'group-instance-plus-create'
                                            )
                                        "
                                        >{{ t('dialog.new_instance.group_access_type_plus') }}</ToggleGroupItem
                                    >
                                    <ToggleGroupItem
                                        value="public"
                                        :disabled="
                                            !hasGroupPermission(
                                                newInstanceDialog.groupRef,
                                                'group-instance-public-create'
                                            ) || newInstanceDialog.groupRef.privacy === 'private'
                                        "
                                        >{{ t('dialog.new_instance.group_access_type_public') }}</ToggleGroupItem
                                    >
                                </ToggleGroup>
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.new_instance.region') }}</FieldLabel>
                            <FieldContent>
                                <ToggleGroup
                                    type="single"
                                    required
                                    variant="outline"
                                    size="sm"
                                    :model-value="newInstanceDialog.region"
                                    @update:model-value="
                                        (value) => {
                                            newInstanceDialog.region = value;
                                            buildInstance();
                                        }
                                    ">
                                    <ToggleGroupItem value="US West">{{
                                        t('dialog.new_instance.region_usw')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="US East">{{
                                        t('dialog.new_instance.region_use')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="Europe">{{
                                        t('dialog.new_instance.region_eu')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="Japan">{{
                                        t('dialog.new_instance.region_jp')
                                    }}</ToggleGroupItem>
                                </ToggleGroup>
                            </FieldContent>
                        </Field>
                        <Field v-if="newInstanceDialog.accessType === 'group'">
                            <FieldLabel>{{ t('dialog.new_instance.queueEnabled') }}</FieldLabel>
                            <FieldContent>
                                <Checkbox v-model="newInstanceDialog.queueEnabled" @update:modelValue="buildInstance" />
                            </FieldContent>
                        </Field>
                        <Field v-if="newInstanceDialog.accessType === 'group'">
                            <FieldLabel>{{ t('dialog.new_instance.ageGate') }}</FieldLabel>
                            <FieldContent>
                                <Checkbox
                                    v-model="newInstanceDialog.ageGate"
                                    :disabled="
                                        !hasGroupPermission(
                                            newInstanceDialog.groupRef,
                                            'group-instance-age-gated-create'
                                        )
                                    "
                                    @update:modelValue="buildInstance" />
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.new_instance.display_name') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupField
                                    :disabled="!isLocalUserVrcPlusSupporter"
                                    v-model="newInstanceDialog.displayName"
                                    size="sm"
                                    @click="$event.target.tagName === 'INPUT' && $event.target.select()"
                                    @change="buildInstance" />
                            </FieldContent>
                        </Field>
                        <Field v-if="newInstanceDialog.accessType === 'group'">
                            <FieldLabel>{{ t('dialog.new_instance.group_id') }}</FieldLabel>
                            <FieldContent>
                                <VirtualCombobox
                                    v-model="newInstanceDialog.groupId"
                                    :groups="normalGroupPickerGroups"
                                    :placeholder="t('dialog.new_instance.group_placeholder')"
                                    :search-placeholder="t('dialog.new_instance.group_placeholder')"
                                    :clearable="true"
                                    :close-on-select="true"
                                    :deselect-on-reselect="true"
                                    @change="buildInstance">
                                    <template #item="{ item, selected }">
                                        <div class="flex w-full items-center p-1.5 text-[13px]">
                                            <div class="relative inline-block flex-none size-9 mr-2.5">
                                                <img
                                                    class="size-full rounded-full object-cover"
                                                    :src="item.iconUrl"
                                                    loading="lazy" />
                                            </div>
                                            <div class="flex-1 overflow-hidden">
                                                <span
                                                    class="block truncate font-medium leading-[18px]"
                                                    v-text="item.label"></span>
                                            </div>
                                            <CheckIcon
                                                :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                                        </div>
                                    </template>
                                </VirtualCombobox>
                            </FieldContent>
                        </Field>
                        <Field
                            v-if="
                                newInstanceDialog.accessType === 'group' &&
                                newInstanceDialog.groupAccessType === 'members'
                            "
                            class="items-start">
                            <FieldLabel>{{ t('dialog.new_instance.roles') }}</FieldLabel>
                            <FieldContent>
                                <Select
                                    multiple
                                    :model-value="
                                        Array.isArray(newInstanceDialog.roleIds) ? newInstanceDialog.roleIds : []
                                    "
                                    @update:modelValue="handleRoleIdsChange">
                                    <SelectTrigger size="sm" class="w-full">
                                        <SelectValue>
                                            <span class="truncate">
                                                {{ selectedRoleSummary || t('dialog.new_instance.role_placeholder') }}
                                            </span>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem
                                                v-for="role in newInstanceDialog.selectedGroupRoles"
                                                :key="role.id"
                                                :value="role.id">
                                                {{ role.name }}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>
                        <template v-if="newInstanceDialog.instanceCreated">
                            <Field>
                                <FieldLabel>{{ t('dialog.new_instance.location') }}</FieldLabel>
                                <FieldContent>
                                    <InputGroupField
                                        v-model="newInstanceDialog.location"
                                        size="sm"
                                        readonly
                                        @click="$event.target.tagName === 'INPUT' && $event.target.select()" />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel>{{ t('dialog.new_instance.url') }}</FieldLabel>
                                <FieldContent>
                                    <InputGroupField v-model="newInstanceDialog.url" size="sm" readonly />
                                </FieldContent>
                            </Field>
                        </template>
                    </FieldGroup>
                </template>
                <template #Legacy>
                    <FieldGroup class="gap-4">
                        <Field>
                            <FieldLabel>{{ t('dialog.new_instance.access_type') }}</FieldLabel>
                            <FieldContent>
                                <ToggleGroup
                                    type="single"
                                    required
                                    variant="outline"
                                    size="sm"
                                    :model-value="newInstanceDialog.accessType"
                                    @update:model-value="
                                        (value) => {
                                            newInstanceDialog.accessType = value;
                                            buildLegacyInstance();
                                        }
                                    ">
                                    <ToggleGroupItem value="public">{{
                                        t('dialog.new_instance.access_type_public')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="group">{{
                                        t('dialog.new_instance.access_type_group')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="friends+">{{
                                        t('dialog.new_instance.access_type_friend_plus')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="friends">{{
                                        t('dialog.new_instance.access_type_friend')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="invite+">{{
                                        t('dialog.new_instance.access_type_invite_plus')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="invite">{{
                                        t('dialog.new_instance.access_type_invite')
                                    }}</ToggleGroupItem>
                                </ToggleGroup>
                            </FieldContent>
                        </Field>
                        <Field v-if="newInstanceDialog.accessType === 'group'">
                            <FieldLabel>{{ t('dialog.new_instance.group_access_type') }}</FieldLabel>
                            <FieldContent>
                                <ToggleGroup
                                    type="single"
                                    required
                                    variant="outline"
                                    size="sm"
                                    :model-value="newInstanceDialog.groupAccessType"
                                    @update:model-value="
                                        (value) => {
                                            newInstanceDialog.groupAccessType = value;
                                            buildLegacyInstance();
                                        }
                                    ">
                                    <ToggleGroupItem value="members">{{
                                        t('dialog.new_instance.group_access_type_members')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="plus">{{
                                        t('dialog.new_instance.group_access_type_plus')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="public">{{
                                        t('dialog.new_instance.group_access_type_public')
                                    }}</ToggleGroupItem>
                                </ToggleGroup>
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.new_instance.region') }}</FieldLabel>
                            <FieldContent>
                                <ToggleGroup
                                    type="single"
                                    required
                                    variant="outline"
                                    size="sm"
                                    :model-value="newInstanceDialog.region"
                                    @update:model-value="
                                        (value) => {
                                            newInstanceDialog.region = value;
                                            buildLegacyInstance();
                                        }
                                    ">
                                    <ToggleGroupItem value="US West">{{
                                        t('dialog.new_instance.region_usw')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="US East">{{
                                        t('dialog.new_instance.region_use')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="Europe">{{
                                        t('dialog.new_instance.region_eu')
                                    }}</ToggleGroupItem>
                                    <ToggleGroupItem value="Japan">{{
                                        t('dialog.new_instance.region_jp')
                                    }}</ToggleGroupItem>
                                </ToggleGroup>
                            </FieldContent>
                        </Field>
                        <Field v-if="newInstanceDialog.accessType === 'group'">
                            <FieldLabel>{{ t('dialog.new_instance.ageGate') }}</FieldLabel>
                            <FieldContent>
                                <Checkbox v-model="newInstanceDialog.ageGate" @update:modelValue="buildInstance" />
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.new_instance.world_id') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupField
                                    v-model="newInstanceDialog.worldId"
                                    size="sm"
                                    @click="$event.target.tagName === 'INPUT' && $event.target.select()"
                                    @change="buildLegacyInstance" />
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.new_instance.instance_id') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupField
                                    v-model="newInstanceDialog.instanceName"
                                    :placeholder="t('dialog.new_instance.instance_id_placeholder')"
                                    size="sm"
                                    @change="buildLegacyInstance" />
                            </FieldContent>
                        </Field>
                        <Field
                            v-if="
                                newInstanceDialog.selectedTab === 'Legacy' &&
                                newInstanceDialog.accessType !== 'public' &&
                                newInstanceDialog.accessType !== 'group'
                            "
                            class="items-start">
                            <FieldLabel>{{ t('dialog.new_instance.instance_creator') }}</FieldLabel>
                            <FieldContent>
                                <VirtualCombobox
                                    v-model="newInstanceDialog.legacyUserId"
                                    :groups="creatorPickerGroups"
                                    :placeholder="t('dialog.new_instance.instance_creator_placeholder')"
                                    :search-placeholder="t('dialog.new_instance.instance_creator_placeholder')"
                                    :clearable="true"
                                    :close-on-select="true"
                                    :deselect-on-reselect="true"
                                    @change="buildLegacyInstance">
                                    <template #item="{ item, selected }">
                                        <div class="flex w-full items-center p-1.5 text-[13px]">
                                            <template v-if="item.user">
                                                <div
                                                    class="relative inline-block flex-none size-9 mr-2.5"
                                                    :class="userStatusClass(item.user)">
                                                    <img
                                                        class="size-full rounded-full object-cover"
                                                        :src="userImage(item.user)"
                                                        loading="lazy" />
                                                </div>
                                                <div class="flex-1 overflow-hidden">
                                                    <span
                                                        class="block truncate font-medium leading-[18px]"
                                                        :style="{ color: item.user.$userColour }"
                                                        v-text="item.user.displayName"></span>
                                                </div>
                                            </template>
                                            <template v-else>
                                                <span v-text="item.label"></span>
                                            </template>

                                            <CheckIcon
                                                :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                                        </div>
                                    </template>
                                </VirtualCombobox>
                            </FieldContent>
                        </Field>
                        <Field v-if="newInstanceDialog.accessType === 'group'">
                            <FieldLabel>{{ t('dialog.new_instance.group_id') }}</FieldLabel>
                            <FieldContent>
                                <VirtualCombobox
                                    v-model="newInstanceDialog.groupId"
                                    :groups="legacyGroupPickerGroups"
                                    :placeholder="t('dialog.new_instance.group_placeholder')"
                                    :search-placeholder="t('dialog.new_instance.group_placeholder')"
                                    :clearable="true"
                                    :close-on-select="true"
                                    :deselect-on-reselect="true"
                                    @change="buildLegacyInstance">
                                    <template #item="{ item, selected }">
                                        <div class="flex w-full items-center p-1.5 text-[13px]">
                                            <div class="relative inline-block flex-none size-9 mr-2.5">
                                                <img
                                                    class="size-full rounded-full object-cover"
                                                    :src="item.iconUrl"
                                                    loading="lazy" />
                                            </div>
                                            <div class="flex-1 overflow-hidden">
                                                <span
                                                    class="block truncate font-medium leading-[18px]"
                                                    v-text="item.label"></span>
                                            </div>
                                            <CheckIcon
                                                :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                                        </div>
                                    </template>
                                </VirtualCombobox>
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.new_instance.location') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupField
                                    v-model="newInstanceDialog.location"
                                    size="sm"
                                    readonly
                                    @click="$event.target.tagName === 'INPUT' && $event.target.select()" />
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.new_instance.url') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupField v-model="newInstanceDialog.url" size="sm" readonly />
                            </FieldContent>
                        </Field>
                    </FieldGroup>
                </template>
            </TabsUnderline>
            <DialogFooter v-if="newInstanceDialog.selectedTab === 'Normal'">
                <template v-if="newInstanceDialog.instanceCreated">
                    <Button variant="outline" class="mr-2" @click="copyInstanceUrl(newInstanceDialog.location)">{{
                        t('dialog.new_instance.copy_url')
                    }}</Button>
                    <Button variant="outline" class="mr-2" @click="selfInvite(newInstanceDialog.location)">{{
                        t('dialog.new_instance.self_invite')
                    }}</Button>
                    <Button
                        variant="outline"
                        class="mr-2"
                        :disabled="
                            (newInstanceDialog.accessType === 'friends' || newInstanceDialog.accessType === 'invite') &&
                            newInstanceDialog.userId !== currentUser.id
                        "
                        @click="showInviteDialog(newInstanceDialog.location)"
                        >{{ t('dialog.new_instance.invite') }}</Button
                    >
                    <template v-if="canOpenInstanceInGame">
                        <Button
                            variant="secondary"
                            class="mr-2"
                            @click="showLaunchDialog(newInstanceDialog.location, newInstanceDialog.shortName)"
                            >{{ t('dialog.new_instance.launch') }}</Button
                        >
                        <Button @click="handleAttachGame(newInstanceDialog.location, newInstanceDialog.shortName)">
                            {{ t('dialog.new_instance.open_ingame') }}
                        </Button>
                    </template>
                    <template v-else>
                        <Button @click="showLaunchDialog(newInstanceDialog.location, newInstanceDialog.shortName)">{{
                            t('dialog.new_instance.launch')
                        }}</Button>
                    </template>
                </template>
                <template v-else>
                    <Button @click="handleCreateNewInstance">{{ t('dialog.new_instance.create_instance') }}</Button>
                </template>
            </DialogFooter>
            <DialogFooter v-else-if="newInstanceDialog.selectedTab === 'Legacy'">
                <Button variant="outline" class="mr-2" @click="copyInstanceUrl(newInstanceDialog.location)">{{
                    t('dialog.new_instance.copy_url')
                }}</Button>
                <Button variant="outline" class="mr-2" @click="selfInvite(newInstanceDialog.location)">{{
                    t('dialog.new_instance.self_invite')
                }}</Button>
                <Button
                    variant="outline"
                    :disabled="
                        (newInstanceDialog.accessType === 'friends' || newInstanceDialog.accessType === 'invite') &&
                        newInstanceDialog.legacyUserId !== currentUser.id
                    "
                    @click="showInviteDialog(newInstanceDialog.location)"
                    >{{ t('dialog.new_instance.invite') }}</Button
                >
                <template v-if="canOpenInstanceInGame">
                    <Button
                        variant="secondary"
                        class="mr-2"
                        @click="showLaunchDialog(newInstanceDialog.location, newInstanceDialog.shortName)"
                        >{{ t('dialog.new_instance.launch') }}</Button
                    >
                    <Button @click="handleAttachGame(newInstanceDialog.location, newInstanceDialog.shortName)">
                        {{ t('dialog.new_instance.open_ingame') }}
                    </Button>
                </template>
                <template v-else>
                    <Button @click="showLaunchDialog(newInstanceDialog.location, newInstanceDialog.shortName)">{{
                        t('dialog.new_instance.launch')
                    }}</Button>
                </template>
            </DialogFooter>
        </DialogContent>

        <InviteDialog :invite-dialog="inviteDialog" @closeInviteDialog="closeInviteDialog" />
    </Dialog>
</template>

<script setup>
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { computed, ref, toRef } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Check as CheckIcon } from 'lucide-vue-next';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupField } from '@/components/ui/input-group';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        copyToClipboard,
        getLaunchURL,
        hasGroupPermission,
        isRealInstance,
        parseLocation
    } from '../../../shared/utils';
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
    import {
        useFriendStore,
        useGroupStore,
        useInviteStore,
        useLaunchStore,
        useLocationStore,
        useUserStore
    } from '../../../stores';
    import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group';
    import { instanceRequest, queryRequest } from '../../../api';
    import { VirtualCombobox } from '../../ui/virtual-combobox';
    import { useNewInstanceBuilder } from './useNewInstanceBuilder';

    import InviteDialog from '../InviteDialog/InviteDialog.vue';
    import { useUserDisplay } from '../../../composables/useUserDisplay';

    const { userImage, userStatusClass } = useUserDisplay();

    const props = defineProps({
        newInstanceDialogLocationTag: {
            type: String,
            required: true
        }
    });
    const newInstanceTabs = computed(() => [
        { value: 'Normal', label: t('dialog.new_instance.normal') },
        { value: 'Legacy', label: t('dialog.new_instance.legacy') }
    ]);

    const { t } = useI18n();

    const { friends, vipFriends, onlineFriends, activeFriends, offlineFriends } = storeToRefs(useFriendStore());
    const { currentUserGroups } = storeToRefs(useGroupStore());
    const { lastLocation } = storeToRefs(useLocationStore());
    const { showLaunchDialog, tryOpenInstanceInVrc } = useLaunchStore();
    const { currentUser } = storeToRefs(useUserStore());
    const { canOpenInstanceInGame } = useInviteStore();

    const {
        newInstanceDialog,
        isLocalUserVrcPlusSupporter,
        buildInstance,
        buildLegacyInstance,
        updateNewInstanceDialog,
        handleCreateNewInstance,
        newInstanceTabClick,
        handleRoleIdsChange
    } = useNewInstanceBuilder(toRef(props, 'newInstanceDialogLocationTag'));

    const inviteDialog = ref({
        visible: false,
        loading: false,
        worldId: '',
        worldName: '',
        userIds: [],
        friendsInInstance: []
    });

    const instanceCreatableGroups = computed(() => {
        return Array.from(currentUserGroups.value.values()).filter((group) => {
            if (!group) {
                return false;
            }
            return (
                hasGroupPermission(group, 'group-instance-public-create') ||
                hasGroupPermission(group, 'group-instance-plus-create') ||
                hasGroupPermission(group, 'group-instance-open-create')
            );
        });
    });

    const normalGroupPickerGroups = computed(() => [
        {
            key: 'instanceCreatableGroups',
            label: t('dialog.new_instance.group_placeholder'),
            items: instanceCreatableGroups.value.map((group) => ({
                value: String(group.id),
                label: group.name,
                search: group.name,
                iconUrl: group.iconUrl
            }))
        }
    ]);

    const legacyGroupPickerGroups = computed(() => [
        {
            key: 'currentUserGroups',
            label: t('dialog.new_instance.group_placeholder'),
            items: Array.from(currentUserGroups.value.values())
                .filter(Boolean)
                .map((group) => ({
                    value: String(group.id),
                    label: group.name,
                    search: group.name,
                    iconUrl: group.iconUrl
                }))
        }
    ]);

    const selectedRoleSummary = computed(() => {
        const roleIds = newInstanceDialog.value.roleIds ?? [];
        if (!Array.isArray(roleIds) || roleIds.length === 0) {
            return '';
        }
        const roleById = new Map((newInstanceDialog.value.selectedGroupRoles ?? []).map((r) => [r.id, r.name]));
        const names = roleIds.map((id) => roleById.get(id) ?? String(id));
        return names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '');
    });

    const friendSections = computed(() => [
        {
            key: 'vip',
            label: t('side_panel.favorite'),
            friends: vipFriends.value
        },
        {
            key: 'online',
            label: t('side_panel.online'),
            friends: onlineFriends.value
        },
        {
            key: 'active',
            label: t('side_panel.active'),
            friends: activeFriends.value
        },
        {
            key: 'offline',
            label: t('side_panel.offline'),
            friends: offlineFriends.value
        }
    ]);

    const friendById = computed(() => {
        const map = new Map();
        for (const section of friendSections.value) {
            for (const friend of section.friends ?? []) {
                map.set(friend.id, friend);
            }
        }
        return map;
    });

    /**
     *
     * @param userId
     */
    function resolveUserDisplayName(userId) {
        if (currentUser.value?.id && currentUser.value.id === userId) {
            return currentUser.value.displayName;
        }
        const friend = friendById.value.get(userId);
        return friend?.ref?.displayName ?? friend?.name ?? String(userId);
    }

    const creatorPickerGroups = computed(() => {
        const groups = [];

        if (currentUser.value) {
            groups.push({
                key: 'me',
                label: t('side_panel.me'),
                items: [
                    {
                        value: String(currentUser.value.id),
                        label: currentUser.value.displayName,
                        search: currentUser.value.displayName,
                        user: currentUser.value
                    }
                ]
            });
        }

        const addFriendGroup = ({ key, label, friends }) => {
            if (!friends?.length) return;
            groups.push({
                key,
                label,
                items: friends.map((friend) => {
                    const user = friend?.ref ?? null;
                    const displayName = resolveUserDisplayName(friend.id);
                    return {
                        value: String(friend.id),
                        label: displayName,
                        search: displayName,
                        user
                    };
                })
            });
        };

        friendSections.value.forEach(addFriendGroup);

        return groups;
    });

    /**
     *
     */
    function closeInviteDialog() {
        inviteDialog.value.visible = false;
    }

    /**
     *
     * @param tag
     */
    function showInviteDialog(tag) {
        if (!isRealInstance(tag)) {
            return;
        }
        const L = parseLocation(tag);
        queryRequest
            .fetch('world', {
                worldId: L.worldId
            })
            .then((args) => {
                const D = inviteDialog.value;
                D.userIds = [];
                D.worldId = L.tag;
                D.worldName = args.ref.name;
                D.friendsInInstance = [];
                const friendsInCurrentInstance = lastLocation.value.friendList;
                for (const friend of friendsInCurrentInstance.values()) {
                    const ctx = friends.value.get(friend.userId);
                    if (typeof ctx?.ref === 'undefined') {
                        continue;
                    }
                    D.friendsInInstance.push(ctx);
                }
                D.visible = true;
            });
    }

    /**
     *
     * @param location
     * @param shortName
     */
    function handleAttachGame(location, shortName) {
        tryOpenInstanceInVrc(location, shortName);
        closeInviteDialog();
    }

    /**
     *
     * @param location
     */
    function selfInvite(location) {
        const L = parseLocation(location);
        if (!L.isRealInstance) {
            return;
        }
        instanceRequest
            .selfInvite({
                instanceId: L.instanceId,
                worldId: L.worldId
            })
            .then((args) => {
                toast.success(t('message.invite.self_sent'));
                return args;
            });
    }

    /**
     *
     * @param location
     */
    async function copyInstanceUrl(location) {
        const L = parseLocation(location);
        const args = await instanceRequest.getInstanceShortName({
            worldId: L.worldId,
            instanceId: L.instanceId
        });
        if (args.json) {
            if (args.json.shortName) {
                L.shortName = args.json.shortName;
            }
            const resLocation = `${args.instance.worldId}:${args.instance.instanceId}`;
            if (resLocation === newInstanceDialog.value.location) {
                const shortName = args.json.shortName;
                const secureOrShortName = args.json.shortName || args.json.secureName;
                newInstanceDialog.value.shortName = shortName;
                newInstanceDialog.value.secureOrShortName = secureOrShortName;
                updateNewInstanceDialog(true);
            }
        }
        const newUrl = getLaunchURL(L);
        copyToClipboard(newUrl);
    }
</script>
