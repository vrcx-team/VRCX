<template>
    <div class="flex flex-1 min-h-0 flex-col gap-3">
        <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">
                {{ t('dialog.group_member_moderation.selected_users') }}
                <span class="ml-1 text-muted-foreground font-normal">{{ selectedUsersArray.length }}</span>
            </span>
            <Button
                class="rounded-full"
                size="icon-sm"
                variant="ghost"
                :disabled="!selectedUsersArray.length"
                :ariaLabel="t('common.actions.delete')"
                @click="$emit('clear-all')">
                <Trash2 />
            </Button>
        </div>

        <div class="flex gap-2">
            <InputGroupField
                :model-value="selectUserId"
                size="sm"
                class="flex-1"
                :placeholder="t('dialog.group_member_moderation.user_id_placeholder')"
                clearable
                @update:model-value="$emit('update:selectUserId', $event)"
                @keydown.enter="selectUserId && $emit('select-user')" />
            <TooltipWrapper :content="t('dialog.group_member_moderation.select_user')" side="top">
                <Button size="icon-sm" variant="outline" :disabled="!selectUserId" @click="$emit('select-user')">
                    <Plus />
                </Button>
            </TooltipWrapper>
        </div>

        <ScrollArea class="flex-1 min-h-24 rounded-md border">
            <div v-if="selectedUsersArray.length" class="p-1">
                <div
                    v-for="user in selectedUsersArray"
                    :key="user.id"
                    class="flex items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-muted">
                    <TooltipWrapper v-if="user.membershipStatus !== 'member'" side="top">
                        <template #content>
                            <span>{{ t('dialog.group_member_moderation.user_isnt_in_group') }}</span>
                        </template>
                        <AlertTriangle class="size-3.5 shrink-0 text-amber-500" />
                    </TooltipWrapper>
                    <span class="flex-1 truncate font-medium" v-text="user.user?.displayName || user.userId"></span>
                    <button
                        type="button"
                        class="inline-flex shrink-0 cursor-pointer items-center text-muted-foreground hover:text-foreground"
                        :ariaLabel="t('common.actions.delete')"
                        @click="$emit('delete-user', user)">
                        <X class="size-3.5" />
                    </button>
                </div>
            </div>
            <div v-else class="p-3 text-center text-sm text-muted-foreground">—</div>
        </ScrollArea>

        <Separator />

        <div class="flex flex-col gap-2">
            <span class="text-sm font-semibold">{{ t('dialog.group_member_moderation.roles') }}</span>
            <Select :model-value="selectedRoles" multiple @update:model-value="$emit('update:selectedRoles', $event)">
                <SelectTrigger class="w-full">
                    <SelectValue :placeholder="t('dialog.group_member_moderation.choose_roles_placeholder')" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="role in groupRef.roles" :key="role.id" :value="role.id">
                        {{ role.name }}
                    </SelectItem>
                </SelectContent>
            </Select>
            <div class="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" :disabled="rolesDisabled" @click="$emit('add-roles')">{{
                    t('dialog.group_member_moderation.add_roles')
                }}</Button>
                <Button size="sm" variant="secondary" :disabled="rolesDisabled" @click="$emit('remove-roles')">{{
                    t('dialog.group_member_moderation.remove_roles')
                }}</Button>
            </div>
        </div>

        <Separator />

        <div class="flex flex-col gap-2">
            <span class="text-sm font-semibold">{{ t('dialog.group_member_moderation.notes') }}</span>
            <InputGroupTextareaField
                :model-value="note"
                class="text-xs"
                :rows="2"
                :placeholder="t('dialog.group_member_moderation.note_placeholder')"
                input-class="resize-none min-h-0"
                @update:model-value="$emit('update:note', $event)" />
            <Button
                size="sm"
                variant="outline"
                :disabled="isActionDisabled('group-members-manage')"
                @click="$emit('save-note')"
                >{{ t('dialog.group_member_moderation.save_note') }}</Button
            >
        </div>

        <Separator />

        <div class="flex flex-col gap-2">
            <span class="text-sm font-semibold">{{ t('dialog.group_member_moderation.actions') }}</span>
            <div class="grid grid-cols-3 gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="isActionDisabled('group-members-remove')"
                    @click="$emit('kick')"
                    >{{ t('dialog.group_member_moderation.kick') }}</Button
                >
                <Button
                    size="sm"
                    variant="destructive"
                    :disabled="isActionDisabled('group-bans-manage')"
                    @click="$emit('ban')"
                    >{{ t('dialog.group_member_moderation.ban') }}</Button
                >
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="isActionDisabled('group-bans-manage')"
                    @click="$emit('unban')"
                    >{{ t('dialog.group_member_moderation.unban') }}</Button
                >
            </div>
        </div>

        <div v-if="progressCurrent" class="flex flex-col gap-2 rounded-md border p-2">
            <div class="flex items-center gap-2 text-sm">
                <Spinner class="size-4" />
                <span class="flex-1">
                    {{ t('dialog.group_member_moderation.progress') }} {{ progressCurrent }}/{{ progressTotal }}
                </span>
                <Button size="sm" variant="secondary" @click="$emit('cancel-progress')">{{
                    t('dialog.group_member_moderation.cancel')
                }}</Button>
            </div>
            <Progress :model-value="progressPercent" />
        </div>
    </div>
</template>

<script setup>
    import { AlertTriangle, Plus, Trash2, X } from 'lucide-vue-next';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { Progress } from '@/components/ui/progress';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { Separator } from '@/components/ui/separator';
    import { InputGroupField, InputGroupTextareaField } from '@/components/ui/input-group';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { hasGroupPermission } from '@/shared/utils';

    const props = defineProps({
        selectUserId: { type: String, default: '' },
        selectedUsersArray: {
            type: /** @type {import('vue').PropType<import('vrchat').GroupMember[]>} */ (Array),
            default: () => []
        },
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

    function isActionDisabled(permission) {
        return Boolean(
            !props.selectedUsersArray.length || props.progressCurrent || !hasGroupPermission(props.groupRef, permission)
        );
    }

    const rolesDisabled = computed(() => !props.selectedRoles.length || isActionDisabled('group-roles-assign'));

    const progressPercent = computed(() =>
        props.progressTotal ? Math.round((props.progressCurrent / props.progressTotal) * 100) : 0
    );
</script>
