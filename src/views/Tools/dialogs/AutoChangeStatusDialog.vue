<template>
    <Dialog :open="isAutoChangeStatusDialogVisible" @update:open="(open) => !open && closeDialog()">
        <DialogContent class="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>{{ t('view.settings.general.automation.auto_change_status') }}</DialogTitle>
            </DialogHeader>

            <FieldGroup class="gap-4">
                <SimpleSwitch
                    :label="t('view.settings.general.automation.auto_change_status')"
                    :value="autoStateChangeEnabled"
                    :tooltip="t('view.settings.general.automation.auto_state_change_tooltip')"
                    @change="setAutoStateChangeEnabled" />

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
                                    {{ instanceType }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FieldContent>
                </Field>

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
                    <FieldLabel>
                        {{ t('view.settings.general.automation.auto_invite_request_accept') }}
                        <TooltipWrapper
                            side="top"
                            :content="t('view.settings.general.automation.auto_invite_request_accept_tooltip')">
                            <Info class="inline-block" />
                        </TooltipWrapper>
                    </FieldLabel>
                    <FieldContent>
                        <ToggleGroup
                            type="single"
                            required
                            variant="outline"
                            size="sm"
                            :model-value="autoAcceptInviteRequests"
                            @update:model-value="setAutoAcceptInviteRequests">
                            <ToggleGroupItem value="Off">{{
                                t('view.settings.general.automation.auto_invite_request_accept_off')
                            }}</ToggleGroupItem>
                            <ToggleGroupItem value="All Favorites">{{
                                t('view.settings.general.automation.auto_invite_request_accept_favs')
                            }}</ToggleGroupItem>
                            <ToggleGroupItem value="Selected Favorites">{{
                                t('view.settings.general.automation.auto_invite_request_accept_selected_favs')
                            }}</ToggleGroupItem>
                        </ToggleGroup>
                    </FieldContent>
                </Field>
            </FieldGroup>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
    import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
    import { Info } from 'lucide-vue-next';
    import { Input } from '@/components/ui/input';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGeneralSettingsStore } from '../../../stores';

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
        autoAcceptInviteRequests
    } = storeToRefs(generalSettingsStore);

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
        setAutoAcceptInviteRequests
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

    function handleAutoStateChangeNoFriendsRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== autoStateChangeNoFriends.value) {
            setAutoStateChangeNoFriends();
        }
    }

    function closeDialog() {
        emit('close');
    }
</script>
