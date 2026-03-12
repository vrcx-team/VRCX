import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const mocks = vi.hoisted(() => ({
    checkCanInviteSelf: vi.fn(() => true),
    parseLocation: vi.fn(() => ({ isRealInstance: true, instanceId: 'inst_1', worldId: 'wrld_1', tag: 'wrld_1:inst_1' })),
    hasGroupPermission: vi.fn(() => false),
    formatDateFilter: vi.fn(() => 'formatted-date'),
    selfInvite: vi.fn(() => Promise.resolve({})),
    closeInstance: vi.fn(() => Promise.resolve({ json: { id: 'inst_closed' } })),
    showUserDialog: vi.fn(),
    toastSuccess: vi.fn(),
    applyInstance: vi.fn(),
    showLaunchDialog: vi.fn(),
    tryOpenInstanceInVrc: vi.fn(),
    modalConfirm: vi.fn(() => Promise.resolve({ ok: true })),
    instanceJoinHistory: { value: new Map() },
    canOpenInstanceInGame: false,
    isOpeningInstance: false,
    lastLocation: { location: 'wrld_here:111', playerList: new Set(['u1', 'u2']) },
    currentUser: { id: 'usr_me' },
    cachedGroups: new Map()
}));

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) =>
            Object.fromEntries(
                Object.entries(store).map(([key, value]) => [
                    key,
                    key === 'instanceJoinHistory' ? value : value?.value ?? value
                ])
            )
    };
});

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('vue-sonner', () => ({
    toast: {
        success: (...args) => mocks.toastSuccess(...args)
    }
}));

vi.mock('../../stores', () => ({
    useLocationStore: () => ({
        lastLocation: mocks.lastLocation
    }),
    useUserStore: () => ({
        currentUser: mocks.currentUser
    }),
    useGroupStore: () => ({
        cachedGroups: mocks.cachedGroups
    }),
    useInstanceStore: () => ({
        instanceJoinHistory: mocks.instanceJoinHistory,
        applyInstance: (...args) => mocks.applyInstance(...args)
    }),
    useModalStore: () => ({
        confirm: (...args) => mocks.modalConfirm(...args)
    }),
    useLaunchStore: () => ({
        isOpeningInstance: mocks.isOpeningInstance,
        showLaunchDialog: (...args) => mocks.showLaunchDialog(...args),
        tryOpenInstanceInVrc: (...args) => mocks.tryOpenInstanceInVrc(...args)
    }),
    useInviteStore: () => ({
        canOpenInstanceInGame: mocks.canOpenInstanceInGame
    })
}));

vi.mock('../../composables/useInviteChecks', () => ({
    useInviteChecks: () => ({
        checkCanInviteSelf: (...args) => mocks.checkCanInviteSelf(...args)
    })
}));

vi.mock('../../shared/utils', () => ({
    parseLocation: (...args) => mocks.parseLocation(...args),
    hasGroupPermission: (...args) => mocks.hasGroupPermission(...args),
    formatDateFilter: (...args) => mocks.formatDateFilter(...args)
}));

vi.mock('../../api', () => ({
    instanceRequest: {
        selfInvite: (...args) => mocks.selfInvite(...args)
    },
    miscRequest: {
        closeInstance: (...args) => mocks.closeInstance(...args)
    }
}));

vi.mock('../../coordinators/userCoordinator', () => ({
    showUserDialog: (...args) => mocks.showUserDialog(...args)
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template: '<button data-testid="btn" @click="$emit(\'click\', $event)"><slot /></button>'
    }
}));

vi.mock('lucide-vue-next', () => ({
    History: { template: '<i data-testid="icon-history" />' },
    Loader2: { template: '<i data-testid="icon-loader" />' },
    LogIn: { template: '<i data-testid="icon-login" />' },
    Mail: { template: '<i data-testid="icon-mail" />' },
    MapPin: { template: '<i data-testid="icon-map" />' },
    RefreshCw: { template: '<i data-testid="icon-refresh" />' },
    UsersRound: { template: '<i data-testid="icon-users" />' }
}));

import InstanceActionBar from '../InstanceActionBar.vue';

function mountBar(props = {}) {
    return mount(InstanceActionBar, {
        props: {
            location: 'wrld_base:111',
            launchLocation: '',
            inviteLocation: '',
            lastJoinLocation: '',
            instanceLocation: '',
            shortname: 'sn',
            instance: {
                ownerId: 'usr_me',
                capacity: 16,
                userCount: 4,
                hasCapacityForYou: true,
                platforms: { standalonewindows: 1, android: 2, ios: 0 },
                users: [{ id: 'usr_a', displayName: 'Alice' }],
                gameServerVersion: 123,
                $disabledContentSettings: []
            },
            friendcount: 2,
            currentlocation: '',
            showLaunch: true,
            showInvite: true,
            showRefresh: true,
            showHistory: true,
            showLastJoin: true,
            showInstanceInfo: true,
            refreshTooltip: 'refresh',
            historyTooltip: 'history',
            onRefresh: vi.fn(),
            onHistory: vi.fn(),
            ...props
        },
        global: {
            stubs: {
                TooltipWrapper: {
                    props: ['content'],
                    template: '<div><slot /><slot name="content" /><span v-if="content">{{ content }}</span></div>'
                },
                Timer: {
                    props: ['epoch'],
                    template: '<span data-testid="timer">{{ epoch }}</span>'
                }
            }
        }
    });
}

describe('InstanceActionBar.vue', () => {
    beforeEach(() => {
        mocks.checkCanInviteSelf.mockReturnValue(true);
        mocks.parseLocation.mockReturnValue({
            isRealInstance: true,
            instanceId: 'inst_1',
            worldId: 'wrld_1',
            tag: 'wrld_1:inst_1'
        });
        mocks.hasGroupPermission.mockReturnValue(false);
        mocks.selfInvite.mockClear();
        mocks.closeInstance.mockClear();
        mocks.showUserDialog.mockClear();
        mocks.toastSuccess.mockClear();
        mocks.applyInstance.mockClear();
        mocks.showLaunchDialog.mockClear();
        mocks.tryOpenInstanceInVrc.mockClear();
        mocks.modalConfirm.mockImplementation(() => Promise.resolve({ ok: true }));
        mocks.instanceJoinHistory.value = new Map([['wrld_base:111', 1700000000]]);
        mocks.canOpenInstanceInGame = false;
        mocks.isOpeningInstance = false;
        mocks.lastLocation.location = 'wrld_here:111';
        mocks.lastLocation.playerList = new Set(['u1', 'u2']);
        mocks.currentUser.id = 'usr_me';
        mocks.cachedGroups = new Map();
    });

    it('renders launch and invite buttons when invite-self is allowed', () => {
        const wrapper = mountBar({
            showRefresh: false,
            showHistory: false,
            showInstanceInfo: false
        });

        expect(wrapper.findAll('[data-testid="btn"]')).toHaveLength(2);
        expect(wrapper.text()).toContain('dialog.user.info.launch_invite_tooltip');
        expect(wrapper.text()).toContain('dialog.user.info.self_invite_tooltip');
    });

    it('launch button opens launch dialog with resolved launchLocation', async () => {
        const wrapper = mountBar({
            launchLocation: 'wrld_launch:222',
            showRefresh: false,
            showHistory: false,
            showInstanceInfo: false
        });
        const launchBtn = wrapper.findAll('[data-testid="btn"]')[0];
        expect(launchBtn).toBeTruthy();

        await launchBtn.trigger('click');

        expect(mocks.showLaunchDialog).toHaveBeenCalledWith('wrld_launch:222');
    });

    it('invite button sends self-invite when canOpenInstanceInGame is false', async () => {
        const wrapper = mountBar({
            inviteLocation: 'wrld_invite:333',
            showRefresh: false,
            showHistory: false,
            showInstanceInfo: false
        });
        const inviteBtn = wrapper.findAll('[data-testid="btn"]')[1];
        expect(inviteBtn).toBeTruthy();

        await inviteBtn.trigger('click');
        await Promise.resolve();

        expect(mocks.selfInvite).toHaveBeenCalledWith({
            instanceId: 'inst_1',
            worldId: 'wrld_1',
            shortName: 'sn'
        });
        expect(mocks.toastSuccess).toHaveBeenCalledWith('message.invite.self_sent');
    });

    it('invite button opens in VRChat when canOpenInstanceInGame is true', async () => {
        mocks.canOpenInstanceInGame = true;
        const wrapper = mountBar({
            inviteLocation: 'wrld_invite:333',
            showRefresh: false,
            showHistory: false,
            showInstanceInfo: false
        });
        const inviteBtn = wrapper.findAll('[data-testid="btn"]')[1];
        expect(inviteBtn).toBeTruthy();

        await inviteBtn.trigger('click');

        expect(mocks.tryOpenInstanceInVrc).toHaveBeenCalledWith('wrld_1:inst_1', 'sn');
        expect(mocks.selfInvite).not.toHaveBeenCalled();
    });

    it('refresh/history callbacks run when buttons clicked', async () => {
        const onRefresh = vi.fn();
        const onHistory = vi.fn();
        const wrapper = mountBar({
            onRefresh,
            onHistory,
            showLaunch: false,
            showInvite: false,
            showInstanceInfo: false
        });
        const buttons = wrapper.findAll('[data-testid="btn"]');
        expect(buttons).toHaveLength(2);

        await buttons[0].trigger('click');
        await buttons[1].trigger('click');

        expect(onRefresh).toHaveBeenCalledTimes(1);
        expect(onHistory).toHaveBeenCalledTimes(1);
    });

    it('shows last-join timer and friend count', () => {
        const wrapper = mountBar({ friendcount: 5 });

        expect(wrapper.find('[data-testid="timer"]').exists()).toBe(true);
        expect(wrapper.text()).toContain('5');
    });

    it('close instance flow confirms, calls api, applies instance and toasts', async () => {
        const wrapper = mountBar({
            instanceLocation: 'wrld_close:444',
            instance: {
                ownerId: 'usr_me',
                capacity: 16,
                userCount: 4,
                hasCapacityForYou: true,
                platforms: { standalonewindows: 1, android: 2, ios: 0 },
                users: [],
                gameServerVersion: 123,
                $disabledContentSettings: []
            }
        });

        const closeBtn = wrapper.findAll('button').find((btn) => btn.text().includes('dialog.user.info.close_instance'));
        expect(closeBtn).toBeTruthy();

        await closeBtn.trigger('click');
        await Promise.resolve();
        await Promise.resolve();
        await nextTick();

        expect(mocks.modalConfirm).toHaveBeenCalled();
        expect(mocks.closeInstance).toHaveBeenCalledWith({ location: 'wrld_close:444', hardClose: false });
        expect(mocks.applyInstance).toHaveBeenCalledWith({ id: 'inst_closed' });
        expect(mocks.toastSuccess).toHaveBeenCalledWith('message.instance.closed');
    });

    it('hides launch and invite buttons when invite-self is not allowed', () => {
        mocks.checkCanInviteSelf.mockReturnValue(false);
        const wrapper = mountBar({
            showRefresh: false,
            showHistory: false,
            showInstanceInfo: false
        });

        expect(wrapper.findAll('[data-testid="btn"]')).toHaveLength(0);
    });
});
