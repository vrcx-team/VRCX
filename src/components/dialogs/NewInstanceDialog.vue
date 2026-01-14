<template>
    <el-dialog
        :z-index="newInstanceDialogIndex"
        v-model="newInstanceDialog.visible"
        :title="t('dialog.new_instance.header')"
        width="650px"
        append-to-body>
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
                                        !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-open-create')
                                    "
                                    >{{ t('dialog.new_instance.group_access_type_members') }}</ToggleGroupItem
                                >
                                <ToggleGroupItem
                                    value="plus"
                                    :disabled="
                                        !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-plus-create')
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
                                    !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-age-gated-create')
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
                                    <div class="x-friend-item flex w-full items-center">
                                        <div class="avatar">
                                            <img :src="item.iconUrl" loading="lazy" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="item.label"></span>
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
                            newInstanceDialog.accessType === 'group' && newInstanceDialog.groupAccessType === 'members'
                        "
                        class="items-start">
                        <FieldLabel>{{ t('dialog.new_instance.roles') }}</FieldLabel>
                        <FieldContent>
                            <Select
                                multiple
                                :model-value="Array.isArray(newInstanceDialog.roleIds) ? newInstanceDialog.roleIds : []"
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
                                v-model="newInstanceDialog.userId"
                                :groups="creatorPickerGroups"
                                :placeholder="t('dialog.new_instance.instance_creator_placeholder')"
                                :search-placeholder="t('dialog.new_instance.instance_creator_placeholder')"
                                :clearable="true"
                                :close-on-select="true"
                                :deselect-on-reselect="true"
                                @change="buildLegacyInstance">
                                <template #item="{ item, selected }">
                                    <div class="x-friend-item flex w-full items-center">
                                        <template v-if="item.user">
                                            <div class="avatar" :class="userStatusClass(item.user)">
                                                <img :src="userImage(item.user)" loading="lazy" />
                                            </div>
                                            <div class="detail">
                                                <span
                                                    class="name"
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
                                    <div class="x-friend-item flex w-full items-center">
                                        <div class="avatar">
                                            <img :src="item.iconUrl" loading="lazy" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="item.label"></span>
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
        <template v-if="newInstanceDialog.selectedTab === 'Normal'" #footer>
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
        </template>
        <template v-else-if="newInstanceDialog.selectedTab === 'Legacy'" #footer>
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
        <InviteDialog :invite-dialog="inviteDialog" @closeInviteDialog="closeInviteDialog" />
    </el-dialog>
</template>

<script setup>
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { computed, nextTick, ref, watch } from 'vue';
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
        parseLocation,
        userImage,
        userStatusClass
    } from '../../shared/utils';
    import {
        useFriendStore,
        useGroupStore,
        useInstanceStore,
        useInviteStore,
        useLaunchStore,
        useLocationStore,
        useUserStore
    } from '../../stores';
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
    import { groupRequest, instanceRequest, worldRequest } from '../../api';
    import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
    import { VirtualCombobox } from '../ui/virtual-combobox';
    import { getNextDialogIndex } from '../../shared/utils/base/ui';

    import InviteDialog from './InviteDialog/InviteDialog.vue';
    import configRepository from '../../service/config';

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
    const { cachedGroups, handleGroupPermissions } = useGroupStore();
    const { lastLocation } = storeToRefs(useLocationStore());
    const { showLaunchDialog, tryOpenInstanceInVrc } = useLaunchStore();
    const { createNewInstance } = useInstanceStore();
    const { currentUser, isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());
    const { canOpenInstanceInGame } = useInviteStore();

    const newInstanceDialogIndex = ref(2000);

    const newInstanceDialog = ref({
        visible: false,
        // loading: false,
        selectedTab: 'Normal',
        instanceCreated: false,
        queueEnabled: false,
        worldId: '',
        instanceId: '',
        instanceName: '',
        userId: '',
        accessType: 'public',
        region: 'US West',
        groupRegion: '',
        groupId: '',
        groupAccessType: 'plus',
        ageGate: false,
        strict: false,
        location: '',
        shortName: '',
        displayName: '',
        url: '',
        secureOrShortName: '',
        lastSelectedGroupId: '',
        selectedGroupRoles: [],
        roleIds: [],
        groupRef: {}
    });

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

    const friendById = computed(() => {
        const map = new Map();
        for (const friend of vipFriends.value) map.set(friend.id, friend);
        for (const friend of onlineFriends.value) map.set(friend.id, friend);
        for (const friend of activeFriends.value) map.set(friend.id, friend);
        for (const friend of offlineFriends.value) map.set(friend.id, friend);
        return map;
    });

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

        const addFriendGroup = (key, label, friends) => {
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

        addFriendGroup('vip', t('side_panel.favorite'), vipFriends.value);
        addFriendGroup('online', t('side_panel.online'), onlineFriends.value);
        addFriendGroup('active', t('side_panel.active'), activeFriends.value);
        addFriendGroup('offline', t('side_panel.offline'), offlineFriends.value);

        return groups;
    });

    function handleRoleIdsChange(value) {
        const next = Array.isArray(value) ? value.map((v) => String(v ?? '')).filter(Boolean) : [];
        newInstanceDialog.value.roleIds = next;
        buildInstance();
    }

    watch(
        () => props.newInstanceDialogLocationTag,
        (value) => {
            initNewInstanceDialog(value);
        }
    );

    initializeNewInstanceDialog();

    function closeInviteDialog() {
        inviteDialog.value.visible = false;
    }

    function showInviteDialog(tag) {
        if (!isRealInstance(tag)) {
            return;
        }
        const L = parseLocation(tag);
        worldRequest
            .getCachedWorld({
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

    function handleAttachGame(location, shortName) {
        tryOpenInstanceInVrc(location, shortName);
        closeInviteDialog();
    }

    async function initNewInstanceDialog(tag) {
        if (!isRealInstance(tag)) {
            return;
        }
        nextTick(() => {
            newInstanceDialogIndex.value = getNextDialogIndex();
        });
        const D = newInstanceDialog.value;
        const L = parseLocation(tag);
        if (D.worldId === L.worldId) {
            // reopening dialog, keep last open instance
            D.visible = true;
            return;
        }
        D.worldId = L.worldId;
        D.instanceCreated = false;
        D.lastSelectedGroupId = '';
        D.selectedGroupRoles = [];
        D.groupRef = {};
        D.roleIds = [];
        D.strict = false;
        D.shortName = '';
        D.secureOrShortName = '';
        if (!isLocalUserVrcPlusSupporter.value) {
            D.displayName = '';
        }
        const args = await groupRequest.getGroupPermissions({ userId: currentUser.value.id });
        handleGroupPermissions(args);
        buildInstance();
        buildLegacyInstance();
        updateNewInstanceDialog();
        D.visible = true;
    }
    function initializeNewInstanceDialog() {
        configRepository
            .getBool('instanceDialogQueueEnabled', true)
            .then((value) => (newInstanceDialog.value.queueEnabled = value));

        configRepository
            .getString('instanceDialogInstanceName', '')
            .then((value) => (newInstanceDialog.value.instanceName = value));

        configRepository
            .getString('instanceDialogUserId', '')
            .then((value) => (newInstanceDialog.value.userId = value));

        configRepository
            .getString('instanceDialogAccessType', 'public')
            .then((value) => (newInstanceDialog.value.accessType = value));

        configRepository
            .getString('instanceRegion', 'US West')
            .then((value) => (newInstanceDialog.value.region = value));

        configRepository
            .getString('instanceDialogGroupId', '')
            .then((value) => (newInstanceDialog.value.groupId = value));

        configRepository
            .getString('instanceDialogGroupAccessType', 'plus')
            .then((value) => (newInstanceDialog.value.groupAccessType = value));

        configRepository
            .getBool('instanceDialogAgeGate', false)
            .then((value) => (newInstanceDialog.value.ageGate = value));

        configRepository
            .getString('instanceDialogDisplayName', '')
            .then((value) => (newInstanceDialog.value.displayName = value));
    }
    function saveNewInstanceDialog() {
        const {
            accessType,
            region,
            instanceName,
            userId,
            groupId,
            groupAccessType,
            queueEnabled,
            ageGate,
            displayName
        } = newInstanceDialog.value;

        configRepository.setString('instanceDialogAccessType', accessType);
        configRepository.setString('instanceRegion', region);
        configRepository.setString('instanceDialogInstanceName', instanceName);
        configRepository.setString('instanceDialogUserId', userId === currentUser.value.id ? '' : userId);
        configRepository.setString('instanceDialogGroupId', groupId);
        configRepository.setString('instanceDialogGroupAccessType', groupAccessType);
        configRepository.setBool('instanceDialogQueueEnabled', queueEnabled);
        configRepository.setBool('instanceDialogAgeGate', ageGate);
        configRepository.setString('instanceDialogDisplayName', displayName);
    }
    function newInstanceTabClick(tabName) {
        if (tabName === 'Normal') {
            buildInstance();
        } else {
            buildLegacyInstance();
        }
    }
    function updateNewInstanceDialog(noChanges) {
        const D = newInstanceDialog.value;
        if (D.instanceId) {
            D.location = `${D.worldId}:${D.instanceId}`;
        } else {
            D.location = D.worldId;
        }
        const L = parseLocation(D.location);
        if (noChanges) {
            L.shortName = D.shortName;
        } else {
            D.shortName = '';
        }
        D.url = getLaunchURL(L);
    }
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
                toast.success('Self invite sent');
                return args;
            });
    }
    async function handleCreateNewInstance() {
        const args = await createNewInstance(newInstanceDialog.value.worldId, newInstanceDialog.value);

        if (args) {
            newInstanceDialog.value.location = args.json.location;
            newInstanceDialog.value.instanceId = args.json.instanceId;
            newInstanceDialog.value.secureOrShortName = args.json.shortName || args.json.secureName;
            newInstanceDialog.value.instanceCreated = true;
            updateNewInstanceDialog();
        }
    }
    function buildInstance() {
        const D = newInstanceDialog.value;
        D.instanceCreated = false;
        D.instanceId = '';
        D.shortName = '';
        D.secureOrShortName = '';
        if (!D.userId) {
            D.userId = currentUser.value.id;
        }
        if (D.groupId && D.groupId !== D.lastSelectedGroupId) {
            D.roleIds = [];
            const ref = cachedGroups.get(D.groupId);
            if (typeof ref !== 'undefined') {
                D.groupRef = ref;
                D.selectedGroupRoles = ref.roles;
                groupRequest
                    .getGroupRoles({
                        groupId: D.groupId
                    })
                    .then((args) => {
                        D.lastSelectedGroupId = D.groupId;
                        D.selectedGroupRoles = args.json;
                        ref.roles = args.json;
                    });
            }
        }
        if (!D.groupId) {
            D.roleIds = [];
            D.groupRef = {};
            D.selectedGroupRoles = [];
            D.lastSelectedGroupId = '';
        }
        saveNewInstanceDialog();
    }
    function buildLegacyInstance() {
        const D = newInstanceDialog.value;
        D.instanceCreated = false;
        D.shortName = '';
        D.secureOrShortName = '';
        const tags = [];
        if (D.instanceName) {
            D.instanceName = D.instanceName.replace(/[^A-Za-z0-9]/g, '');
            tags.push(D.instanceName);
        } else {
            const randValue = (99999 * Math.random() + 1).toFixed(0);
            tags.push(String(randValue).padStart(5, '0'));
        }
        if (!D.userId) {
            D.userId = currentUser.value.id;
        }
        const userId = D.userId;
        if (D.accessType !== 'public') {
            if (D.accessType === 'friends+') {
                tags.push(`~hidden(${userId})`);
            } else if (D.accessType === 'friends') {
                tags.push(`~friends(${userId})`);
            } else if (D.accessType === 'group') {
                tags.push(`~group(${D.groupId})`);
                tags.push(`~groupAccessType(${D.groupAccessType})`);
            } else {
                tags.push(`~private(${userId})`);
            }
            if (D.accessType === 'invite+') {
                tags.push('~canRequestInvite');
            }
        }
        if (D.accessType === 'group' && D.ageGate) {
            tags.push('~ageGate');
        }
        if (D.region === 'US West') {
            tags.push(`~region(us)`);
        } else if (D.region === 'US East') {
            tags.push(`~region(use)`);
        } else if (D.region === 'Europe') {
            tags.push(`~region(eu)`);
        } else if (D.region === 'Japan') {
            tags.push(`~region(jp)`);
        }
        if (D.accessType !== 'invite' && D.accessType !== 'friends') {
            D.strict = false;
        }
        if (D.strict) {
            tags.push('~strict');
        }
        if (D.groupId && D.groupId !== D.lastSelectedGroupId) {
            D.roleIds = [];
            const ref = cachedGroups.get(D.groupId);
            if (typeof ref !== 'undefined') {
                D.groupRef = ref;
                D.selectedGroupRoles = ref.roles;
                groupRequest
                    .getGroupRoles({
                        groupId: D.groupId
                    })
                    .then((args) => {
                        D.lastSelectedGroupId = D.groupId;
                        D.selectedGroupRoles = args.json;
                        ref.roles = args.json;
                    });
            }
        }
        if (!D.groupId) {
            D.roleIds = [];
            D.selectedGroupRoles = [];
            D.groupRef = {};
            D.lastSelectedGroupId = '';
        }
        D.instanceId = tags.join('');
        updateNewInstanceDialog(false);
        saveNewInstanceDialog();
    }
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
