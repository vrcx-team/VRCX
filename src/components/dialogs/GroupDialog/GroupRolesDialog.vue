<template>
    <div class="flex-1 min-h-0 flex flex-col">
        <DialogHeader class="sr-only">
            <DialogTitle>{{
                canManage ? t('dialog.group_roles.header') : t('dialog.group_roles.view_header')
            }}</DialogTitle>
        </DialogHeader>

        <h3>
            {{ canManage ? t('dialog.group_roles.header') : t('dialog.group_roles.view_header') }}
            <span class="text-muted-foreground">- {{ groupRolesDialog.groupRef.name }}</span>
        </h3>
        <div class="flex-1 min-h-0 flex gap-4 mt-2">
            <div class="w-80 shrink-0 flex flex-col min-h-0 border-r pr-4">
                <div class="flex items-center gap-2 mb-2">
                    <Button size="sm" :disabled="!canManage || groupRolesDialog.loading" @click="newRole">
                        <Plus />
                        {{ t('dialog.group_roles.new_role') }}
                    </Button>
                    <Button
                        class="ml-auto"
                        variant="ghost"
                        size="icon-sm"
                        :disabled="groupRolesDialog.loading"
                        @click="loadGroupRolesDialogRoles(groupRolesDialog.id)">
                        <RefreshCw :class="{ 'animate-spin': groupRolesDialog.loading }" />
                    </Button>
                </div>
                <DragDropProvider :modifiers="[RestrictToVerticalAxis]" @dragEnd="onDragEnd">
                    <div :key="listKey" class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
                        <div
                            v-if="!groupRolesDialog.loading && groupRolesDialog.roles.length === 0"
                            class="text-sm text-muted-foreground p-2">
                            {{ t('dialog.group_roles.no_roles') }}
                        </div>
                        <template v-for="section in roleSections" :key="section.group">
                            <div class="text-xs font-medium text-muted-foreground px-1 pt-2 first:pt-0">
                                {{ section.label }}
                            </div>
                            <SortableGroupRoleItem
                                v-for="(role, index) in section.roles"
                                :id="role.id"
                                :key="role.id"
                                :index="index"
                                :group="section.group"
                                :draggable="canManage && !isFixedRole(role)"
                                :disabled="groupRolesDialog.loading"
                                :class="{ 'bg-accent': form.mode === 'edit' && form.roleId === role.id }"
                                @click="selectRole(role)">
                                <div class="flex-1 min-w-0">
                                    <div class="truncate text-sm font-medium" v-text="role.name"></div>
                                    <div class="flex flex-wrap gap-1 mt-0.5">
                                        <Badge v-if="isMyRole(role)" class="text-[10px] px-1 py-0">
                                            {{ t('dialog.group_roles.assigned_to_you') }}
                                        </Badge>
                                        <Badge
                                            v-if="role.defaultRole"
                                            variant="secondary"
                                            class="text-[10px] px-1 py-0">
                                            {{ t('dialog.group_roles.default_role') }}
                                        </Badge>
                                        <Badge
                                            v-if="role.isSelfAssignable"
                                            variant="outline"
                                            class="text-[10px] px-1 py-0">
                                            {{ t('dialog.group_roles.self_assignable') }}
                                        </Badge>
                                        <Badge
                                            v-if="role.isAddedOnJoin"
                                            variant="outline"
                                            class="text-[10px] px-1 py-0">
                                            {{ t('dialog.group_roles.added_on_join') }}
                                        </Badge>
                                        <Badge
                                            v-if="role.requiresTwoFactor"
                                            variant="outline"
                                            class="text-[10px] px-1 py-0">
                                            {{ t('dialog.group_roles.requires_two_factor') }}
                                        </Badge>
                                    </div>
                                </div>
                                <div v-if="canManage && !isFixedRole(role)" class="flex shrink-0" @click.stop>
                                    <TooltipWrapper :content="t('dialog.group_roles.delete')" :delayDuration="500">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            :disabled="groupRolesDialog.loading"
                                            @click="deleteRole(role)">
                                            <Trash2 class="text-destructive" />
                                        </Button>
                                    </TooltipWrapper>
                                </div>
                            </SortableGroupRoleItem>
                        </template>
                    </div>
                </DragDropProvider>
            </div>

            <div class="flex-1 min-h-0 flex flex-col">
                <div v-if="!form.mode" class="text-sm text-muted-foreground p-2">
                    {{ t('dialog.group_roles.no_role_selected') }}
                </div>
                <template v-else>
                    <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2">
                        <FieldGroup class="gap-4">
                            <Field>
                                <FieldLabel>{{ t('dialog.group_roles.name') }}</FieldLabel>
                                <FieldContent>
                                    <InputGroupField
                                        v-model="form.name"
                                        size="sm"
                                        :maxlength="64"
                                        :disabled="isReadOnly"
                                        show-count />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>{{ t('dialog.group_roles.description') }}</FieldLabel>
                                <FieldContent>
                                    <InputGroupTextareaField
                                        v-model="form.description"
                                        :rows="3"
                                        :maxlength="512"
                                        :disabled="isReadOnly"
                                        show-count />
                                </FieldContent>
                            </Field>

                            <div class="flex flex-col gap-0.5">
                                <label
                                    class="inline-flex items-start gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent/50">
                                    <Checkbox v-model="form.isSelfAssignable" :disabled="isReadOnly" />
                                    <span class="space-y-1">
                                        <span class="block text-sm">{{ t('dialog.group_roles.self_assignable') }}</span>
                                        <span class="block text-xs text-muted-foreground">
                                            {{ t('dialog.group_roles.self_assignable_description') }}
                                        </span>
                                    </span>
                                </label>
                                <label
                                    class="inline-flex items-start gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent/50">
                                    <Checkbox v-model="form.isAddedOnJoin" :disabled="isReadOnly" />
                                    <span class="space-y-1">
                                        <span class="block text-sm">{{ t('dialog.group_roles.added_on_join') }}</span>
                                        <span class="block text-xs text-muted-foreground">
                                            {{ t('dialog.group_roles.added_on_join_description') }}
                                        </span>
                                    </span>
                                </label>
                                <label
                                    class="inline-flex items-start gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent/50">
                                    <Checkbox v-model="form.requiresTwoFactor" :disabled="isReadOnly" />
                                    <span class="space-y-1">
                                        <span class="block text-sm">{{
                                            t('dialog.group_roles.requires_two_factor')
                                        }}</span>
                                        <span class="block text-xs text-muted-foreground">
                                            {{ t('dialog.group_roles.requires_two_factor_description') }}
                                        </span>
                                    </span>
                                </label>
                            </div>

                            <Field v-if="standardPermissions.length > 0">
                                <FieldLabel>{{ t('dialog.group_roles.permissions') }}</FieldLabel>
                                <FieldContent>
                                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-x-2 gap-y-0.5">
                                        <label
                                            v-for="permission in standardPermissions"
                                            :key="permission.name"
                                            class="inline-flex items-start gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent/50">
                                            <Checkbox
                                                :model-value="hasPermission(permission.name)"
                                                :disabled="isReadOnly || !permission.allowedToAdd"
                                                @update:model-value="togglePermission(permission.name, $event)" />
                                            <span class="space-y-1">
                                                <span class="block text-sm">
                                                    {{ permission.displayName || permission.name }}
                                                </span>
                                                <span
                                                    v-if="permission.help"
                                                    class="block text-xs text-muted-foreground"
                                                    v-text="permission.help"></span>
                                            </span>
                                        </label>
                                    </div>
                                </FieldContent>
                            </Field>

                            <Field v-if="managementPermissions.length > 0">
                                <FieldLabel>{{ t('dialog.group_roles.management_permissions') }}</FieldLabel>
                                <FieldContent>
                                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-x-2 gap-y-0.5">
                                        <label
                                            v-for="permission in managementPermissions"
                                            :key="permission.name"
                                            class="inline-flex items-start gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent/50">
                                            <Checkbox
                                                :model-value="hasPermission(permission.name)"
                                                :disabled="isReadOnly || !permission.allowedToAdd"
                                                @update:model-value="togglePermission(permission.name, $event)" />
                                            <span class="space-y-1">
                                                <span class="block text-sm">
                                                    {{ permission.displayName || permission.name }}
                                                </span>
                                                <span
                                                    v-if="permission.help"
                                                    class="block text-xs text-muted-foreground"
                                                    v-text="permission.help"></span>
                                            </span>
                                        </label>
                                    </div>
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </div>

                    <div class="flex justify-end gap-2 pt-4">
                        <Button variant="outline" :disabled="groupRolesDialog.loading" @click="cancelEdit">
                            {{ t('dialog.group_roles.cancel') }}
                        </Button>
                        <Button :disabled="!canSave" @click="saveRole">
                            {{ form.mode === 'create' ? t('dialog.group_roles.create') : t('dialog.group_roles.save') }}
                        </Button>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { Plus, RefreshCw, Trash2 } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { InputGroupField, InputGroupTextareaField } from '@/components/ui/input-group';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { DragDropProvider } from '@dnd-kit/vue';
    import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import { isSortable } from '@dnd-kit/vue/sortable';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useGroupStore, useModalStore } from '../../../stores';
    import { groupRequest } from '../../../api';
    import { hasGroupPermission } from '../../../shared/utils';
    import { loadGroupRolesDialogRoles } from '../../../coordinators/groupCoordinator';

    import SortableGroupRoleItem from './SortableGroupRoleItem.vue';

    const { t } = useI18n();
    const modalStore = useModalStore();
    const { groupRolesDialog } = storeToRefs(useGroupStore());

    const form = ref(createBlankForm());
    const listKey = ref(0);

    const roleSections = computed(() =>
        [
            {
                group: 'management',
                label: t('dialog.group_roles.management_roles'),
                roles: groupRolesDialog.value.roles.filter((role) => role.isManagementRole)
            },
            {
                group: 'member',
                label: t('dialog.group_roles.member_roles'),
                roles: groupRolesDialog.value.roles.filter((role) => !role.isManagementRole)
            }
        ].filter((section) => section.roles.length > 0)
    );

    const canManage = computed(() => hasGroupPermission(groupRolesDialog.value.groupRef, 'group-roles-manage'));
    const canManageDefaultRole = computed(() =>
        hasGroupPermission(groupRolesDialog.value.groupRef, 'group-default-role-manage')
    );
    const isReadOnly = computed(
        () =>
            (form.value.isDefaultRole ? !canManageDefaultRole.value : !canManage.value) ||
            form.value.isManagementRole ||
            groupRolesDialog.value.loading
    );
    const canSave = computed(() => !isReadOnly.value && form.value.name.trim().length > 0);

    const assignablePermissions = computed(() =>
        groupRolesDialog.value.permissions.filter((permission) => permission.name !== '*')
    );
    const standardPermissions = computed(() =>
        assignablePermissions.value.filter((permission) => permission.isManagementPermission !== true)
    );
    const managementPermissions = computed(() =>
        assignablePermissions.value.filter((permission) => permission.isManagementPermission === true)
    );

    function createBlankForm() {
        return {
            mode: '',
            roleId: '',
            name: '',
            description: '',
            isSelfAssignable: false,
            isAddedOnJoin: false,
            requiresTwoFactor: false,
            isManagementRole: false,
            isDefaultRole: false,
            permissions: []
        };
    }

    /**
     * @param {object} [role]
     */
    function resetForm(role) {
        if (!role) {
            form.value = createBlankForm();
            return;
        }
        form.value = {
            mode: 'edit',
            roleId: role.id,
            name: role.name,
            description: role.description,
            isSelfAssignable: role.isSelfAssignable === true,
            isAddedOnJoin: role.isAddedOnJoin === true,
            requiresTwoFactor: role.requiresTwoFactor === true,
            isManagementRole: role.isManagementRole === true,
            isDefaultRole: role.defaultRole === true,
            permissions: Array.isArray(role.permissions) ? [...role.permissions] : []
        };
    }

    /**
     * @param {object} role
     */
    function selectRole(role) {
        groupRolesDialog.value.selectedRoleId = role.id;
        resetForm(role);
    }

    function newRole() {
        groupRolesDialog.value.selectedRoleId = '';
        resetForm();
        form.value.mode = 'create';
    }

    function cancelEdit() {
        groupRolesDialog.value.selectedRoleId = '';
        resetForm();
    }

    /**
     * @param {string} name
     * @returns {boolean}
     */
    function hasPermission(name) {
        return form.value.permissions.includes('*') || form.value.permissions.includes(name);
    }

    /**
     * @param {string} name
     * @param {boolean} checked
     */
    function togglePermission(name, checked) {
        if (checked) {
            if (!form.value.permissions.includes(name)) {
                form.value.permissions.push(name);
            }
            return;
        }
        form.value.permissions = form.value.permissions.filter((permission) => permission !== name);
    }

    async function saveRole() {
        if (!canSave.value) {
            return;
        }
        const D = groupRolesDialog.value;
        const params = {
            groupId: D.id,
            name: form.value.name.trim(),
            description: form.value.description,
            isSelfAssignable: form.value.isSelfAssignable,
            isAddedOnJoin: form.value.isAddedOnJoin,
            requiresTwoFactor: form.value.requiresTwoFactor,
            permissions: [...form.value.permissions]
        };
        D.loading = true;
        try {
            let roleId = form.value.roleId;
            if (form.value.mode === 'create') {
                const args = await groupRequest.createGroupRole(params);
                roleId = args.json.id;
            } else {
                await groupRequest.editGroupRole({ ...params, roleId });
            }
            D.selectedRoleId = roleId;
            form.value.mode = roleId ? 'edit' : '';
            form.value.roleId = roleId;
            await loadGroupRolesDialogRoles(D.id);
            toast.success(t('dialog.group_roles.saved'));
        } catch (error) {
            console.error('Failed to save group role:', error);
            toast.error(t('dialog.group_roles.save_failed'));
        } finally {
            D.loading = false;
        }
    }

    /**
     * @param {object} role
     */
    async function deleteRole(role) {
        const { ok } = await modalStore.confirm({
            title: t('confirm.title'),
            description: t('dialog.group_roles.delete_confirm', { name: role.name }),
            destructive: true
        });
        if (!ok) {
            return;
        }
        const D = groupRolesDialog.value;
        D.loading = true;
        try {
            await groupRequest.deleteGroupRole({ groupId: D.id, roleId: role.id });
            if (form.value.roleId === role.id) {
                D.selectedRoleId = '';
                resetForm();
            }
            await loadGroupRolesDialogRoles(D.id);
            toast.success(t('dialog.group_roles.deleted'));
        } catch (error) {
            console.error('Failed to delete group role:', error);
            toast.error(t('dialog.group_roles.delete_failed'));
        } finally {
            D.loading = false;
        }
    }

    /**
     * @param {object} role
     * @returns {boolean}
     */
    function isFixedRole(role) {
        return role.defaultRole === true || (Array.isArray(role.permissions) && role.permissions.includes('*'));
    }

    /**
     * @param {object} role
     * @returns {boolean}
     */
    function isMyRole(role) {
        const roleIds = groupRolesDialog.value.groupRef?.myMember?.roleIds;
        return Array.isArray(roleIds) && roleIds.includes(role.id);
    }

    /**
     * @param {object} event
     */
    async function onDragEnd(event) {
        if (event.canceled) {
            return;
        }
        const { source } = event.operation;
        if (!isSortable(source)) {
            return;
        }
        const { initialIndex, index, initialGroup, group } = source;
        if (initialGroup !== group) {
            listKey.value++;
            return;
        }
        if (initialIndex === index) {
            return;
        }
        const D = groupRolesDialog.value;
        const roles = roleSections.value.flatMap((section) => section.roles);
        const sectionRoles = [...roleSections.value.find((section) => section.group === group).roles];
        const [moved] = sectionRoles.splice(initialIndex, 1);
        sectionRoles.splice(index, 0, moved);
        const reordered = roleSections.value.flatMap((section) =>
            section.group === group ? sectionRoles : section.roles
        );
        if (reordered.some((role, i) => isFixedRole(role) && role.id !== roles[i].id)) {
            listKey.value++;
            return;
        }
        const orders = D.roles.map((role) => role.order);
        D.roles = reordered;
        D.loading = true;
        try {
            for (let i = 0; i < reordered.length; i++) {
                if (reordered[i].id !== roles[i].id) {
                    await groupRequest.editGroupRole({ groupId: D.id, roleId: reordered[i].id, order: orders[i] });
                }
            }
        } catch (error) {
            console.error('Failed to reorder group role:', error);
            toast.error(t('dialog.group_roles.save_failed'));
        } finally {
            await loadGroupRolesDialogRoles(D.id);
            D.loading = false;
        }
    }

    watch(
        () => groupRolesDialog.value.roles,
        (roles) => {
            const selectedId = groupRolesDialog.value.selectedRoleId;
            if (form.value.mode === 'create' || !selectedId) {
                return;
            }
            const role = roles.find((r) => r.id === selectedId);
            if (role) {
                resetForm(role);
            } else {
                groupRolesDialog.value.selectedRoleId = '';
                resetForm();
            }
        },
        { immediate: true }
    );
</script>
