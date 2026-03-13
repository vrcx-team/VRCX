import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    cachedInstances: new Map(),
    lastInstanceApplied: { value: '' },
    showLaunchDialog: vi.fn(),
    showGroupDialog: vi.fn(),
    getGroupName: vi.fn(() => Promise.resolve('Fetched Group')),
    parseLocation: vi.fn(() => ({
        isRealInstance: true,
        tag: 'wrld_1:inst_1',
        groupId: 'grp_1'
    }))
}));

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('../../stores', () => ({
    useInstanceStore: () => ({
        cachedInstances: mocks.cachedInstances,
        lastInstanceApplied: mocks.lastInstanceApplied
    }),
    useLaunchStore: () => ({
        showLaunchDialog: (...args) => mocks.showLaunchDialog(...args)
    }),
    useGroupStore: () => ({})
}));

vi.mock('../../coordinators/groupCoordinator', () => ({
    showGroupDialog: (...args) => mocks.showGroupDialog(...args)
}));

vi.mock('../../shared/constants', () => ({
    accessTypeLocaleKeyMap: {
        friends: 'dialog.world.instance.friends',
        groupPublic: 'dialog.world.instance.group_public',
        group: 'dialog.world.instance.group'
    }
}));

vi.mock('../../shared/utils', () => ({
    getGroupName: (...args) => mocks.getGroupName(...args),
    parseLocation: (...args) => mocks.parseLocation(...args)
}));

vi.mock('lucide-vue-next', () => ({
    AlertTriangle: { template: '<i data-testid="alert" />' },
    Lock: { template: '<i data-testid="lock" />' },
    Unlock: { template: '<i data-testid="unlock" />' }
}));

import LocationWorld from '../LocationWorld.vue';

async function flush() {
    await Promise.resolve();
    await Promise.resolve();
}

function mountComponent(props = {}) {
    return mount(LocationWorld, {
        props: {
            locationobject: {
                tag: 'wrld_1:inst_1',
                accessTypeName: 'friends',
                strict: false,
                shortName: 'short-1',
                userId: 'usr_owner',
                region: 'eu',
                instanceName: 'Instance Name',
                groupId: 'grp_1'
            },
            currentuserid: 'usr_owner',
            worlddialogshortname: '',
            grouphint: '',
            ...props
        },
        global: {
            stubs: {
                TooltipWrapper: {
                    props: ['content'],
                    template: '<span><slot /></span>'
                }
            }
        }
    });
}

describe('LocationWorld.vue', () => {
    beforeEach(() => {
        mocks.cachedInstances = new Map();
        mocks.lastInstanceApplied.value = '';
        mocks.showLaunchDialog.mockClear();
        mocks.showGroupDialog.mockClear();
        mocks.getGroupName.mockClear();
        mocks.parseLocation.mockClear();
        mocks.parseLocation.mockImplementation(() => ({
            isRealInstance: true,
            tag: 'wrld_1:inst_1',
            groupId: 'grp_1'
        }));
    });

    it('renders translated access type and instance name', () => {
        const wrapper = mountComponent();

        expect(wrapper.text()).toContain(
            'dialog.world.instance.friends #Instance Name'
        );
        expect(wrapper.find('.flags.eu').exists()).toBe(true);
    });

    it('marks unlocked for owner and opens launch dialog on click', async () => {
        const wrapper = mountComponent();

        expect(wrapper.find('[data-testid="unlock"]').exists()).toBe(true);

        await wrapper.findAll('.cursor-pointer')[0].trigger('click');

        expect(mocks.showLaunchDialog).toHaveBeenCalledWith(
            'wrld_1:inst_1',
            'short-1'
        );
    });

    it('shows group hint and opens group dialog', async () => {
        const wrapper = mountComponent({ grouphint: 'Hint Group' });

        expect(wrapper.text()).toContain('(Hint Group)');

        await wrapper.findAll('.cursor-pointer')[1].trigger('click');

        expect(mocks.showGroupDialog).toHaveBeenCalledWith('grp_1');
    });

    it('loads group name asynchronously when no hint', async () => {
        const wrapper = mountComponent({ grouphint: '' });
        await flush();

        expect(mocks.getGroupName).toHaveBeenCalledWith('grp_1');
        expect(wrapper.text()).toContain('(Fetched Group)');
    });

    it('shows closed indicator and strict lock from instance cache', () => {
        mocks.cachedInstances = new Map([
            [
                'wrld_1:inst_1',
                {
                    displayName: 'Resolved Name',
                    closedAt: '2026-01-01T00:00:00.000Z'
                }
            ]
        ]);

        const wrapper = mountComponent({
            locationobject: {
                tag: 'wrld_1:inst_1',
                accessTypeName: 'friends',
                strict: true,
                shortName: 'short-1',
                userId: 'usr_other',
                region: 'us',
                instanceName: 'Fallback Name',
                groupId: 'grp_1'
            },
            currentuserid: 'usr_me'
        });

        expect(wrapper.text()).toContain('#Resolved Name');
        expect(wrapper.find('[data-testid="alert"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="lock"]').exists()).toBe(true);
    });
});
