<template>
    <Dialog :open="isAutoChangeStatusDialogVisible" @update:open="(open) => !open && closeDialog()">
        <DialogContent class="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>{{ t('view.settings.general.automation.auto_change_status') }}</DialogTitle>
            </DialogHeader>

            <FieldGroup class="gap-4">
                <SimpleSwitch
                    :label="t('view.settings.general.automation.auto_change_status_switch')"
                    :value="autoStateChangeEnabled"
                    :tooltip="t('view.settings.general.automation.auto_state_change_switch_tooltip')"
                    @change="setAutoStateChangeEnabled" />

                <Field>
                    <FieldLabel>{{ t('view.settings.general.automation.alone_condition') }}</FieldLabel>
                    <FieldContent>
                        <RadioGroup
                            :model-value="autoStateChangeNoFriends ? 'true' : 'false'"
                            :disabled="!autoStateChangeEnabled"
                            class="gap-2 flex"
                            @update:modelValue="handleAutoStateChangeNoFriendsRadio">
                            <div class="flex items-center space-x-2">
                                <RadioGroupItem id="autoStateChangeNoFriends-false" value="false" />
                                <label for="autoStateChangeNoFriends-false">
                                    {{ t('view.settings.general.automation.alone') }}
                                </label>
                            </div>
                            <div class="flex items-center space-x-2">
                                <RadioGroupItem id="autoStateChangeNoFriends-true" value="true" />
                                <label for="autoStateChangeNoFriends-true">
                                    {{ t('view.settings.general.automation.no_friends') }}
                                </label>
                            </div>
                        </RadioGroup>
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel>{{ t('view.settings.general.automation.auto_change_status_groups') }}</FieldLabel>
                    <FieldContent>
                        <Select
                            :model-value="autoStateChangeGroups"
                            :disabled="!autoStateChangeEnabled || !autoStateChangeNoFriends"
                            multiple
                            @update:modelValue="setAutoStateChangeGroups">
                            <SelectTrigger size="sm">
                                <SelectValue
                                    :placeholder="
                                        t('view.settings.general.automation.auto_change_status_groups_placeholder')
                                    " />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="group in favoriteFriendGroups"
                                        :key="group.key"
                                        :value="group.key">
                                        {{ group.displayName }}
                                    </SelectItem>
                                </SelectGroup>
                                <template v-if="localFriendFavoriteGroups.length">
                                    <SelectSeparator />
                                    <SelectGroup>
                                        <SelectItem
                                            v-for="group in localFriendFavoriteGroups"
                                            :key="'local:' + group"
                                            :value="'local:' + group">
                                            {{ group }}
                                        </SelectItem>
                                    </SelectGroup>
                                </template>
                            </SelectContent>
                        </Select>
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel>{{ t('view.settings.general.automation.allowed_instance_types') }}</FieldLabel>
                    <FieldContent>
                        <Select
                            :model-value="autoStateChangeInstanceTypes"
                            :disabled="!autoStateChangeEnabled"
                            multiple
                            @update:modelValue="setAutoStateChangeInstanceTypes">
                            <SelectTrigger size="sm">
                                <SelectValue
                                    :placeholder="t('view.settings.general.automation.instance_type_placeholder')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    v-for="instanceType in instanceTypes"
                                    :key="instanceType"
                                    :value="instanceType">
                                    {{ translateAccessType(instanceType) }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel>{{ t('view.settings.general.automation.alone_status') }}</FieldLabel>
                    <FieldContent>
                        <Select
                            :model-value="autoStateChangeAloneStatus"
                            :disabled="!autoStateChangeEnabled"
                            @update:modelValue="setAutoStateChangeAloneStatus">
                            <SelectTrigger size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="join me">
                                    <i class="x-user-status joinme"></i> {{ t('dialog.user.status.join_me') }}
                                </SelectItem>
                                <SelectItem value="active">
                                    <i class="x-user-status online"></i> {{ t('dialog.user.status.online') }}
                                </SelectItem>
                                <SelectItem value="ask me">
                                    <i class="x-user-status askme"></i> {{ t('dialog.user.status.ask_me') }}
                                </SelectItem>
                                <SelectItem value="busy">
                                    <i class="x-user-status busy"></i> {{ t('dialog.user.status.busy') }}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <SimpleSwitch
                            :label="t('view.settings.general.automation.change_status_description')"
                            :value="autoStateChangeAloneDescEnabled"
                            :disabled="!autoStateChangeEnabled"
                            @change="setAutoStateChangeAloneDescEnabled" />
                        <Input
                            v-if="autoStateChangeAloneDescEnabled"
                            :model-value="autoStateChangeAloneDesc"
                            :disabled="!autoStateChangeEnabled"
                            :maxlength="32"
                            :placeholder="t('view.settings.general.automation.status_description_placeholder')"
                            size="sm"
                            @update:modelValue="setAutoStateChangeAloneDesc" />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel>{{ t('view.settings.general.automation.company_status') }}</FieldLabel>
                    <FieldContent>
                        <Select
                            :model-value="autoStateChangeCompanyStatus"
                            :disabled="!autoStateChangeEnabled"
                            @update:modelValue="setAutoStateChangeCompanyStatus">
                            <SelectTrigger size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="join me">
                                    <i class="x-user-status joinme"></i> {{ t('dialog.user.status.join_me') }}
                                </SelectItem>
                                <SelectItem value="active">
                                    <i class="x-user-status online"></i> {{ t('dialog.user.status.online') }}
                                </SelectItem>
                                <SelectItem value="ask me">
                                    <i class="x-user-status askme"></i> {{ t('dialog.user.status.ask_me') }}
                                </SelectItem>
                                <SelectItem value="busy">
                                    <i class="x-user-status busy"></i> {{ t('dialog.user.status.busy') }}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <SimpleSwitch
                            :label="t('view.settings.general.automation.change_status_description')"
                            :value="autoStateChangeCompanyDescEnabled"
                            :disabled="!autoStateChangeEnabled"
                            @change="setAutoStateChangeCompanyDescEnabled" />
                        <Input
                            v-if="autoStateChangeCompanyDescEnabled"
                            :model-value="autoStateChangeCompanyDesc"
                            :disabled="!autoStateChangeEnabled"
                            :maxlength="32"
                            :placeholder="t('view.settings.general.automation.status_description_placeholder')"
                            size="sm"
                            @update:modelValue="setAutoStateChangeCompanyDesc" />
                    </FieldContent>
                </Field>

                <FieldSeparator></FieldSeparator>

                <SimpleSwitch
                    :label="t('view.settings.general.automation.auto_invite_request_accept')"
                    :tooltip="t('view.settings.general.automation.auto_invite_request_accept_tooltip')"
                    :value="autoAcceptInviteRequests !== 'Off'"
                    @change="handleAutoAcceptInviteSwitch" />

                <Field>
                    <FieldLabel>{{ t('view.settings.general.automation.auto_invite_request_accept') }}</FieldLabel>
                    <FieldContent>
                        <RadioGroup
                            :model-value="autoAcceptInviteMode"
                            :disabled="autoAcceptInviteRequests === 'Off'"
                            class="gap-2 flex"
                            @update:modelValue="handleAutoAcceptInviteModeChange">
                            <div class="flex items-center space-x-2">
                                <RadioGroupItem id="autoAcceptInvite-all" value="All Favorites" />
                                <label for="autoAcceptInvite-all">
                                    {{ t('view.settings.general.automation.auto_invite_request_accept_favs') }}
                                </label>
                            </div>
                            <div class="flex items-center space-x-2">
                                <RadioGroupItem id="autoAcceptInvite-selected" value="Selected Favorites" />
                                <label for="autoAcceptInvite-selected">
                                    {{ t('view.settings.general.automation.auto_invite_request_accept_selected_favs') }}
                                </label>
                            </div>
                        </RadioGroup>
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel>{{ t('view.settings.general.automation.auto_accept_invite_groups') }}</FieldLabel>
                    <FieldContent>
                        <Select
                            :model-value="autoAcceptInviteGroups"
                            :disabled="autoAcceptInviteRequests !== 'Selected Favorites'"
                            multiple
                            @update:modelValue="setAutoAcceptInviteGroups">
                            <SelectTrigger size="sm">
                                <SelectValue
                                    :placeholder="
                                        t('view.settings.general.automation.auto_accept_invite_groups_placeholder')
                                    " />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="group in favoriteFriendGroups"
                                        :key="group.key"
                                        :value="group.key">
                                        {{ group.displayName }}
                                    </SelectItem>
                                </SelectGroup>
                                <template v-if="localFriendFavoriteGroups.length">
                                    <SelectSeparator />
                                    <SelectGroup>
                                        <SelectItem
                                            v-for="group in localFriendFavoriteGroups"
                                            :key="'local:' + group"
                                            :value="'local:' + group">
                                            {{ group }}
                                        </SelectItem>
                                    </SelectGroup>
                                </template>
                            </SelectContent>
                        </Select>
                    </FieldContent>
                </Field>
            </FieldGroup>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import {
        Select,
        SelectContent,
        SelectGroup,
        SelectItem,
        SelectSeparator,
        SelectTrigger,
        SelectValue
    } from '@/components/ui/select';
    import { Field, FieldContent, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
    import { Input } from '@/components/ui/input';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useGeneralSettingsStore } from '../../../stores';
    import { accessTypeLocaleKeyMap } from '../../../shared/constants';

    import SimpleSwitch from '../../Settings/components/SimpleSwitch.vue';

    defineProps({
        isAutoChangeStatusDialogVisible: {
            type: Boolean
        }
    });

    const emit = defineEmits(['close']);

    const { t } = useI18n();
    const generalSettingsStore = useGeneralSettingsStore();

    const {
        autoStateChangeEnabled,
        autoStateChangeAloneStatus,
        autoStateChangeCompanyStatus,
        autoStateChangeInstanceTypes,
        autoStateChangeNoFriends,
        autoStateChangeAloneDescEnabled,
        autoStateChangeAloneDesc,
        autoStateChangeCompanyDescEnabled,
        autoStateChangeCompanyDesc,
        autoStateChangeGroups,
        autoAcceptInviteRequests,
        autoAcceptInviteGroups
    } = storeToRefs(generalSettingsStore);

    const favoriteStore = useFavoriteStore();
    const { favoriteFriendGroups, localFriendFavoriteGroups } = storeToRefs(favoriteStore);

    const {
        setAutoStateChangeEnabled,
        setAutoStateChangeAloneStatus,
        setAutoStateChangeCompanyStatus,
        setAutoStateChangeInstanceTypes,
        setAutoStateChangeNoFriends,
        setAutoStateChangeAloneDescEnabled,
        setAutoStateChangeAloneDesc,
        setAutoStateChangeCompanyDescEnabled,
        setAutoStateChangeCompanyDesc,
        setAutoStateChangeGroups,
        setAutoAcceptInviteRequests,
        setAutoAcceptInviteGroups
    } = generalSettingsStore;

    const instanceTypes = computed(() => [
        'invite',
        'invite+',
        'friends',
        'friends+',
        'public',
        'groupPublic',
        'groupPlus',
        'groupOnly'
    ]);

    const instanceTypeToMapKey = {
        groupOnly: 'groupMembers'
    };

    function translateAccessType(accessTypeNameRaw) {
        const mapKey = instanceTypeToMapKey[accessTypeNameRaw] || accessTypeNameRaw;
        const key = accessTypeLocaleKeyMap[mapKey];
        if (!key) {
            return accessTypeNameRaw;
        }
        if (mapKey === 'groupPublic' || mapKey === 'groupPlus' || mapKey === 'groupMembers') {
            const groupKey = accessTypeLocaleKeyMap['group'];
            return t(groupKey) + ' ' + t(key);
        }
        return t(key);
    }

    function handleAutoStateChangeNoFriendsRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== autoStateChangeNoFriends.value) {
            setAutoStateChangeNoFriends();
        }
    }

    const autoAcceptInviteMode = computed(() => {
        if (autoAcceptInviteRequests.value === 'Off') {
            return 'All Favorites';
        }
        return autoAcceptInviteRequests.value;
    });

    function handleAutoAcceptInviteSwitch(enabled) {
        if (enabled) {
            setAutoAcceptInviteRequests(autoAcceptInviteMode.value);
        } else {
            setAutoAcceptInviteRequests('Off');
        }
    }

    function handleAutoAcceptInviteModeChange(value) {
        setAutoAcceptInviteRequests(value);
    }

    function closeDialog() {
        emit('close');
    }
</script>
