import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    }),
    createI18n: () => ({
        global: { t: (key) => key, locale: require('vue').ref('en') },
        install: vi.fn()
    })
}));

vi.mock('../../../../shared/utils', () => ({
    hasGroupPermission: vi.fn((_group, permission) => {
        if (_group?._mockPermissions) {
            return _group._mockPermissions.includes(permission);
        }
        return true;
    })
}));

import GroupModerationBulkActions from '../GroupModerationBulkActions.vue';

function mountComponent(props = {}) {
    return mount(GroupModerationBulkActions, {
        props: {
            selectUserId: '',
            selectedUsersArray: [],
            selectedRoles: [],
            note: '',
            progressCurrent: 0,
            progressTotal: 0,
            groupRef: {
                roles: [
                    { id: 'role_1', name: 'Admin' },
                    { id: 'role_2', name: 'Moderator' }
                ],
                _mockPermissions: [
                    'group-roles-assign',
                    'group-members-manage',
                    'group-members-remove',
                    'group-bans-manage'
                ]
            },
            ...props
        },
        global: {
            stubs: {
                AlertTriangle: { template: '<svg class="alert-icon" />' },
                Trash2: { template: '<svg class="trash-icon" />' },
                X: { template: '<svg class="x-icon" />' },
                TooltipWrapper: {
                    template:
                        '<div class="tooltip-stub"><slot /><slot name="content" /></div>'
                }
            }
        }
    });
}

describe('GroupModerationBulkActions.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('renders user ID input field', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain(
                'dialog.group_member_moderation.user_id'
            );
        });

        test('renders selected users section', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain(
                'dialog.group_member_moderation.selected_users'
            );
        });

        test('renders roles dropdown with available roles', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain(
                'dialog.group_member_moderation.selected_roles'
            );
        });

        test('renders action buttons', () => {
            const wrapper = mountComponent();
            const text = wrapper.text();
            expect(text).toContain('dialog.group_member_moderation.add_roles');
            expect(text).toContain(
                'dialog.group_member_moderation.remove_roles'
            );
            expect(text).toContain('dialog.group_member_moderation.save_note');
            expect(text).toContain('dialog.group_member_moderation.kick');
            expect(text).toContain('dialog.group_member_moderation.ban');
            expect(text).toContain('dialog.group_member_moderation.unban');
        });

        test('renders selected user badges', () => {
            const wrapper = mountComponent({
                selectedUsersArray: [
                    {
                        id: 'usr_1',
                        userId: 'usr_1',
                        membershipStatus: 'member',
                        user: { displayName: 'Alice' }
                    },
                    {
                        id: 'usr_2',
                        userId: 'usr_2',
                        membershipStatus: 'member',
                        user: { displayName: 'Bob' }
                    }
                ]
            });
            expect(wrapper.text()).toContain('Alice');
            expect(wrapper.text()).toContain('Bob');
        });

        test('shows warning tooltip for non-member users', () => {
            const wrapper = mountComponent({
                selectedUsersArray: [
                    {
                        id: 'usr_1',
                        userId: 'usr_1',
                        membershipStatus: 'banned',
                        user: { displayName: 'Charlie' }
                    }
                ]
            });
            expect(wrapper.text()).toContain(
                'dialog.group_member_moderation.user_isnt_in_group'
            );
        });

        test('does not show warning for member users', () => {
            const wrapper = mountComponent({
                selectedUsersArray: [
                    {
                        id: 'usr_1',
                        userId: 'usr_1',
                        membershipStatus: 'member',
                        user: { displayName: 'Alice' }
                    }
                ]
            });
            expect(wrapper.text()).not.toContain(
                'dialog.group_member_moderation.user_isnt_in_group'
            );
        });
    });

    describe('progress indicator', () => {
        test('shows progress when progressCurrent > 0', () => {
            const wrapper = mountComponent({
                progressCurrent: 3,
                progressTotal: 10
            });
            expect(wrapper.text()).toContain(
                'dialog.group_member_moderation.progress'
            );
            expect(wrapper.text()).toContain('3/10');
        });

        test('shows cancel button during progress', () => {
            const wrapper = mountComponent({
                progressCurrent: 3,
                progressTotal: 10
            });
            expect(wrapper.text()).toContain(
                'dialog.group_member_moderation.cancel'
            );
        });

        test('hides progress when not in progress', () => {
            const wrapper = mountComponent({ progressCurrent: 0 });
            expect(wrapper.text()).not.toContain(
                'dialog.group_member_moderation.progress'
            );
        });
    });

    describe('button disabled states', () => {
        test('add/remove roles disabled when no roles selected', () => {
            const wrapper = mountComponent({ selectedRoles: [] });
            const addBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b
                        .text()
                        .includes('dialog.group_member_moderation.add_roles')
                );
            expect(addBtn.attributes('disabled')).toBeDefined();
        });

        test('add/remove roles enabled when roles are selected', () => {
            const wrapper = mountComponent({ selectedRoles: ['role_1'] });
            const addBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b
                        .text()
                        .includes('dialog.group_member_moderation.add_roles')
                );
            expect(addBtn.attributes('disabled')).toBeUndefined();
        });

        test('action buttons disabled during progress', () => {
            const wrapper = mountComponent({
                selectedRoles: ['role_1'],
                progressCurrent: 5,
                progressTotal: 10
            });
            const kickBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.group_member_moderation.kick')
                );
            expect(kickBtn.attributes('disabled')).toBeDefined();
        });

        test('select user button disabled when no user ID entered', () => {
            const wrapper = mountComponent({ selectUserId: '' });
            const selectBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b
                        .text()
                        .includes('dialog.group_member_moderation.select_user')
                );
            expect(selectBtn.attributes('disabled')).toBeDefined();
        });

        test('select user button enabled when user ID is entered', () => {
            const wrapper = mountComponent({ selectUserId: 'usr_test' });
            const selectBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b
                        .text()
                        .includes('dialog.group_member_moderation.select_user')
                );
            expect(selectBtn.attributes('disabled')).toBeUndefined();
        });
    });

    describe('permissions', () => {
        test('disables kick when missing group-members-remove permission', () => {
            const wrapper = mountComponent({
                groupRef: {
                    roles: [],
                    _mockPermissions: ['group-bans-manage']
                }
            });
            const kickBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.group_member_moderation.kick')
                );
            expect(kickBtn.attributes('disabled')).toBeDefined();
        });

        test('disables ban/unban when missing group-bans-manage permission', () => {
            const wrapper = mountComponent({
                groupRef: {
                    roles: [],
                    _mockPermissions: ['group-members-remove']
                }
            });
            const banBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.group_member_moderation.ban')
                );
            const unbanBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.group_member_moderation.unban')
                );
            expect(banBtn.attributes('disabled')).toBeDefined();
            expect(unbanBtn.attributes('disabled')).toBeDefined();
        });
    });

    describe('events', () => {
        test('emits select-user on select button click', async () => {
            const wrapper = mountComponent({ selectUserId: 'usr_test' });
            const selectBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b
                        .text()
                        .includes('dialog.group_member_moderation.select_user')
                );
            await selectBtn.trigger('click');
            expect(wrapper.emitted('select-user')).toBeTruthy();
        });

        test('emits clear-all on trash button click', async () => {
            const wrapper = mountComponent();
            // The trash button is the rounded-full icon-sm button after "selected_users" label
            const buttons = wrapper.findAll('button');
            const trashBtn = buttons.find((b) => {
                const classes = b.classes();
                return classes.includes('rounded-full');
            });
            await trashBtn.trigger('click');
            expect(wrapper.emitted('clear-all')).toBeTruthy();
        });

        test('emits delete-user when removing a selected user', async () => {
            const user = {
                id: 'usr_1',
                userId: 'usr_1',
                membershipStatus: 'member',
                user: { displayName: 'Alice' }
            };
            const wrapper = mountComponent({ selectedUsersArray: [user] });
            // The X button is a native <button type="button"> inside each Badge
            const deleteBtn = wrapper.find('button[type="button"]');
            await deleteBtn.trigger('click');
            expect(wrapper.emitted('delete-user')?.[0]?.[0]).toEqual(user);
        });

        test('emits ban on ban button click', async () => {
            const wrapper = mountComponent();
            const banBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.group_member_moderation.ban')
                );
            await banBtn.trigger('click');
            expect(wrapper.emitted('ban')).toBeTruthy();
        });

        test('emits cancel-progress on cancel click', async () => {
            const wrapper = mountComponent({
                progressCurrent: 3,
                progressTotal: 10
            });
            const cancelBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.group_member_moderation.cancel')
                );
            await cancelBtn.trigger('click');
            expect(wrapper.emitted('cancel-progress')).toBeTruthy();
        });
    });
});
