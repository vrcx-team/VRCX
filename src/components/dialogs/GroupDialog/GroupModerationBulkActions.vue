<template>
    <div>
        <span class="name">{{ t('dialog.group_member_moderation.user_id') }}</span>
        <br />
        <InputGroupField
            :model-value="selectUserId"
            size="sm"
            style="margin-top: 6px"
            :placeholder="t('dialog.group_member_moderation.user_id_placeholder')"
            clearable
            @update:model-value="$emit('update:selectUserId', $event)" />
        <Button
            size="sm"
            variant="outline"
            style="margin-top: 8px"
            :disabled="!selectUserId"
            @click="$emit('select-user')"
            >{{ t('dialog.group_member_moderation.select_user') }}</Button
        >
        <br />
        <br />
        <span class="name">{{ t('dialog.group_member_moderation.selected_users') }}</span>
        <Button
            class="rounded-full"
            size="icon-sm"
            variant="outline"
            style="margin-left: 6px"
            @click="$emit('clear-all')">
            <Trash2 />
        </Button>
        <br />
        <Badge
            v-for="user in selectedUsersArray"
            :key="user.id"
            variant="outline"
            style="margin-right: 6px; margin-top: 6px">
            <TooltipWrapper v-if="user.membershipStatus !== 'member'" side="top">
                <template #content>
                    <span>{{ t('dialog.group_member_moderation.user_isnt_in_group') }}</span>
                </template>
                <AlertTriangle style="margin-left: 3px; display: inline-block" />
            </TooltipWrapper>
            <span v-text="user.user?.displayName || user.userId" style="font-weight: bold; margin-left: 6px"></span>
            <button
                type="button"
                style="
                    margin-left: 8px;
                    border: none;
                    background: transparent;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    color: inherit;
                    cursor: pointer;
                "
                @click="$emit('delete-user', user)">
                <X class="h-3 w-3" />
            </button>
        </Badge>
        <br />
        <br />
        <span class="name">{{ t('dialog.group_member_moderation.notes') }}</span>
        <InputGroupTextareaField
            :model-value="note"
            class="text-xs"
            :rows="2"
            :placeholder="t('dialog.group_member_moderation.note_placeholder')"
            style="margin-top: 6px"
            input-class="resize-none min-h-0"
            @update:model-value="$emit('update:note', $event)" />
        <br />
        <br />
        <span class="name">{{ t('dialog.group_member_moderation.selected_roles') }}</span>
        <br />
        <Select :model-value="selectedRoles" multiple @update:model-value="$emit('update:selectedRoles', $event)">
            <SelectTrigger style="margin-top: 6px">
                <SelectValue :placeholder="t('dialog.group_member_moderation.choose_roles_placeholder')" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem v-for="role in groupRef.roles" :key="role.id" :value="role.id">
                    {{ role.name }}
                </SelectItem>
            </SelectContent>
        </Select>
        <br />
        <br />
        <span class="name">{{ t('dialog.group_member_moderation.actions') }}</span>
        <br />
        <div class="flex gap-2">
            <Button
                variant="outline"
                :disabled="
                    Boolean(
                        !selectedRoles.length || progressCurrent || !hasGroupPermission(groupRef, 'group-roles-assign')
                    )
                "
                @click="$emit('add-roles')"
                >{{ t('dialog.group_member_moderation.add_roles') }}</Button
            >
            <Button
                variant="secondary"
                :disabled="
                    Boolean(
                        !selectedRoles.length || progressCurrent || !hasGroupPermission(groupRef, 'group-roles-assign')
                    )
                "
                @click="$emit('remove-roles')"
                >{{ t('dialog.group_member_moderation.remove_roles') }}</Button
            >
            <Button
                variant="outline"
                :disabled="Boolean(progressCurrent || !hasGroupPermission(groupRef, 'group-members-manage'))"
                @click="$emit('save-note')"
                >{{ t('dialog.group_member_moderation.save_note') }}</Button
            >
            <Button
                variant="outline"
                :disabled="Boolean(progressCurrent || !hasGroupPermission(groupRef, 'group-members-remove'))"
                @click="$emit('kick')"
                >{{ t('dialog.group_member_moderation.kick') }}</Button
            >
            <Button
                variant="outline"
                :disabled="Boolean(progressCurrent || !hasGroupPermission(groupRef, 'group-bans-manage'))"
                @click="$emit('ban')"
                >{{ t('dialog.group_member_moderation.ban') }}</Button
            >
            <Button
                variant="outline"
                :disabled="Boolean(progressCurrent || !hasGroupPermission(groupRef, 'group-bans-manage'))"
                @click="$emit('unban')"
                >{{ t('dialog.group_member_moderation.unban') }}</Button
            >
            <span v-if="progressCurrent" style="margin-top: 8px">
                <Spinner class="inline-block ml-2 mr-2" />
                {{ t('dialog.group_member_moderation.progress') }} {{ progressCurrent }}/{{ progressTotal }}
            </span>
            <Button
                v-if="progressCurrent"
                variant="secondary"
                style="margin-left: 6px"
                @click="$emit('cancel-progress')"
                >{{ t('dialog.group_member_moderation.cancel') }}</Button
            >
        </div>
    </div>
</template>

<script setup>
    import { AlertTriangle, Trash2, X } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { InputGroupField, InputGroupTextareaField } from '@/components/ui/input-group';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Badge } from '@/components/ui/badge';
    import { hasGroupPermission } from '@/shared/utils';

    defineProps({
        selectUserId: { type: String, default: '' },
        selectedUsersArray: { type: Array, default: () => [] },
        selectedRoles: { type: Array, default: () => [] },
        note: { type: String, default: '' },
        progressCurrent: { type: Number, default: 0 },
        progressTotal: { type: Number, default: 0 },
        groupRef: { type: Object, default: () => ({}) }
    });

    defineEmits([
        'update:selectUserId',
        'update:note',
        'update:selectedRoles',
        'select-user',
        'clear-all',
        'delete-user',
        'add-roles',
        'remove-roles',
        'save-note',
        'kick',
        'ban',
        'unban',
        'cancel-progress'
    ]);

    const { t } = useI18n();
</script>
