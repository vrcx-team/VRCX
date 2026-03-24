import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    appearanceStore: {
        hideNicknames: false
    },
    friendStore: {
        isRefreshFriendsLoading: false,
        allFavoriteFriendIds: new Set()
    },
    userStore: {},
    showUserDialog: vi.fn(),
    confirmDeleteFriend: vi.fn()
}));

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('../../../../stores', () => ({
    useAppearanceSettingsStore: () => mocks.appearanceStore,
    useFriendStore: () => mocks.friendStore,
    useUserStore: () => mocks.userStore
}));

vi.mock('../../../../coordinators/userCoordinator', () => ({
    showUserDialog: (...args) => mocks.showUserDialog(...args)
}));

vi.mock('../../../../coordinators/friendRelationshipCoordinator', () => ({
    confirmDeleteFriend: (...args) => mocks.confirmDeleteFriend(...args)
}));

vi.mock('../../../../shared/utils', () => ({
    userImage: vi.fn(() => 'https://example.com/avatar.png'),
    userStatusClass: vi.fn(() => 'status-online')
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    })
}));

vi.mock('@/components/ui/avatar', () => ({
    Avatar: {
        template: '<div data-testid="avatar"><slot /></div>'
    },
    AvatarImage: {
        props: ['src'],
        template: '<img data-testid="avatar-image" :src="src" />'
    },
    AvatarFallback: {
        template: '<span data-testid="avatar-fallback"><slot /></span>'
    }
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="delete-button" @click="$emit(\'click\', $event)"><slot /></button>'
    }
}));

vi.mock('@/components/ui/spinner', () => ({
    Spinner: {
        template: '<span data-testid="spinner" />'
    }
}));

vi.mock('@/components/Location.vue', () => ({
    default: {
        props: ['location', 'traveling', 'link'],
        template:
            '<span data-testid="location">{{ location }}|{{ traveling }}</span>'
    }
}));

vi.mock('@/components/Timer.vue', () => ({
    default: {
        props: ['epoch'],
        template: '<span data-testid="timer">{{ epoch }}</span>'
    }
}));

vi.mock('lucide-vue-next', () => ({
    User: {
        template: '<span data-testid="icon-user" />'
    },
    Trash2: {
        template: '<span data-testid="icon-trash" />'
    }
}));

import FriendItem from '../FriendItem.vue';

function makeFriend(overrides = {}) {
    return {
        id: 'usr_1',
        name: 'Alice',
        state: 'active',
        pendingOffline: false,
        $nickName: 'Ali',
        ref: {
            displayName: 'Alice',
            $userColour: '#fff',
            statusDescription: 'Online',
            location: 'wrld_abc:123',
            travelingToLocation: '',
            $location_at: 123
        },
        ...overrides
    };
}

function mountItem(props = {}) {
    return mount(FriendItem, {
        props: {
            friend: makeFriend(),
            isGroupByInstance: false,
            ...props
        }
    });
}

describe('FriendItem.vue', () => {
    beforeEach(() => {
        mocks.appearanceStore.hideNicknames = false;
        mocks.friendStore.isRefreshFriendsLoading = false;
        mocks.friendStore.allFavoriteFriendIds = new Set();
        mocks.confirmDeleteFriend.mockReset();
        mocks.showUserDialog.mockReset();
    });

    test('renders nickname when hideNicknames is false', () => {
        const wrapper = mountItem();
        expect(wrapper.text()).toContain('Alice (Ali)');
    });

    test('renders favorite star when grouped by instance and friend is favorite', () => {
        mocks.appearanceStore.hideNicknames = true;
        mocks.friendStore.allFavoriteFriendIds = new Set(['usr_1']);

        const wrapper = mountItem({
            friend: makeFriend({ $nickName: '' }),
            isGroupByInstance: true
        });

        expect(wrapper.text()).toContain('Alice ⭐');
    });

    test('clicking row opens user dialog', async () => {
        const wrapper = mountItem();
        await wrapper.get('div').trigger('click');
        expect(mocks.showUserDialog).toHaveBeenCalledWith('usr_1');
    });

    test('renders delete action for orphan friend and triggers confirmDeleteFriend', async () => {
        const wrapper = mountItem({
            friend: makeFriend({
                id: 'usr_orphan',
                name: 'Ghost',
                ref: null
            })
        });

        expect(wrapper.text()).toContain('Ghost');
        const button = wrapper.get('[data-testid="delete-button"]');
        await button.trigger('click');
        expect(mocks.confirmDeleteFriend).toHaveBeenCalledWith('usr_orphan');
        expect(mocks.showUserDialog).not.toHaveBeenCalled();
    });
});
