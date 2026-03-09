import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const mocks = vi.hoisted(() => ({
    notificationStore: {
        acceptFriendRequestNotification: vi.fn(),
        acceptRequestInvite: vi.fn(),
        hideNotificationPrompt: vi.fn(),
        deleteNotificationLogPrompt: vi.fn(),
        sendNotificationResponse: vi.fn(),
        queueMarkAsSeen: vi.fn(),
        openNotificationLink: vi.fn(),
        isNotificationExpired: vi.fn(() => false)
    },
    userStore: {
        cachedUsers: new Map(),
        showUserDialog: vi.fn(),
        showSendBoopDialog: vi.fn()
    },
    groupStore: {
        showGroupDialog: vi.fn()
    },
    locationStore: {
        lastLocation: { value: { location: 'wrld_home:123' } }
    },
    gameStore: {
        isGameRunning: { value: true }
    }
}));

vi.mock('pinia', () => ({
    storeToRefs: (store) => store
}));

vi.mock('../../../../stores', () => ({
    useNotificationStore: () => mocks.notificationStore,
    useUserStore: () => mocks.userStore,
    useGroupStore: () => mocks.groupStore,
    useLocationStore: () => mocks.locationStore,
    useGameStore: () => mocks.gameStore
}));

vi.mock('../../../../shared/utils', () => ({
    checkCanInvite: vi.fn(() => true),
    userImage: vi.fn(() => 'https://example.com/avatar.png')
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        te: () => false
    })
}));

vi.mock('@/components/ui/item', () => ({
    Item: { template: '<div data-testid="item"><slot /></div>' },
    ItemMedia: { template: '<div data-testid="item-media"><slot /></div>' },
    ItemContent: { template: '<div data-testid="item-content"><slot /></div>' },
    ItemTitle: { template: '<div data-testid="item-title"><slot /></div>' },
    ItemDescription: {
        template: '<div data-testid="item-description"><slot /></div>'
    }
}));

vi.mock('@/components/ui/avatar', () => ({
    Avatar: { template: '<div data-testid="avatar"><slot /></div>' },
    AvatarImage: {
        props: ['src'],
        template: '<img data-testid="avatar-image" :src="src" />'
    },
    AvatarFallback: { template: '<span data-testid="avatar-fallback"><slot /></span>' }
}));

vi.mock('@/components/ui/hover-card', () => ({
    HoverCard: { template: '<div data-testid="hover-card"><slot /></div>' },
    HoverCardTrigger: { template: '<div data-testid="hover-trigger"><slot /></div>' },
    HoverCardContent: { template: '<div data-testid="hover-content"><slot /></div>' }
}));

vi.mock('@/components/ui/badge', () => ({
    Badge: { template: '<span data-testid="badge"><slot /></span>' }
}));

vi.mock('@/components/ui/separator', () => ({
    Separator: { template: '<hr data-testid="separator" />' }
}));

vi.mock('@/components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<span data-testid="tooltip"><slot /></span>' }
}));

vi.mock('../../../../components/Location.vue', () => ({
    default: {
        props: ['location'],
        template: '<span data-testid="location">{{ location }}</span>'
    }
}));

vi.mock('lucide-vue-next', () => {
    function icon(name) {
        return { template: `<span data-icon="${name}" />` };
    }
    return {
        Ban: icon('Ban'),
        Bell: icon('Bell'),
        BellOff: icon('BellOff'),
        CalendarDays: icon('CalendarDays'),
        Check: icon('Check'),
        Link: icon('Link'),
        Mail: icon('Mail'),
        MessageCircle: icon('MessageCircle'),
        Reply: icon('Reply'),
        Send: icon('Send'),
        Tag: icon('Tag'),
        Trash2: icon('Trash2'),
        UserPlus: icon('UserPlus'),
        Users: icon('Users'),
        X: icon('X')
    };
});

import NotificationItem from '../NotificationItem.vue';

function makeNotification(overrides = {}) {
    return {
        id: 'noty_1',
        type: 'friendRequest',
        senderUserId: 'usr_123',
        senderUsername: 'Alice',
        created_at: '2026-03-09T00:00:00.000Z',
        seen: false,
        details: {},
        ...overrides
    };
}

describe('NotificationItem.vue', () => {
    beforeEach(() => {
        mocks.notificationStore.acceptFriendRequestNotification.mockReset();
        mocks.notificationStore.acceptRequestInvite.mockReset();
        mocks.notificationStore.hideNotificationPrompt.mockReset();
        mocks.notificationStore.deleteNotificationLogPrompt.mockReset();
        mocks.notificationStore.sendNotificationResponse.mockReset();
        mocks.notificationStore.queueMarkAsSeen.mockReset();
        mocks.notificationStore.openNotificationLink.mockReset();
        mocks.notificationStore.isNotificationExpired.mockReturnValue(false);
        mocks.userStore.showUserDialog.mockReset();
        mocks.userStore.showSendBoopDialog.mockReset();
        mocks.groupStore.showGroupDialog.mockReset();
        mocks.userStore.cachedUsers = new Map();
    });

    test('renders sender and opens user dialog on sender click', async () => {
        const wrapper = mount(NotificationItem, {
            props: {
                notification: makeNotification()
            }
        });

        expect(wrapper.text()).toContain('Alice');
        await wrapper.get('span.truncate.cursor-pointer').trigger('click');
        expect(mocks.userStore.showUserDialog).toHaveBeenCalledWith('usr_123');
    });

    test('clicking accept icon calls acceptFriendRequestNotification', async () => {
        const wrapper = mount(NotificationItem, {
            props: {
                notification: makeNotification()
            }
        });

        await wrapper.get('[data-icon="Check"]').trigger('click');
        expect(
            mocks.notificationStore.acceptFriendRequestNotification
        ).toHaveBeenCalledWith(expect.objectContaining({ id: 'noty_1' }));
    });

    test('link response calls openNotificationLink', async () => {
        const wrapper = mount(NotificationItem, {
            props: {
                notification: makeNotification({
                    type: 'message',
                    responses: [
                        {
                            type: 'link',
                            icon: 'reply',
                            text: 'Open',
                            data: 'group:grp_123'
                        }
                    ]
                })
            }
        });

        await wrapper.get('[data-icon="Link"]').trigger('click');
        expect(mocks.notificationStore.openNotificationLink).toHaveBeenCalledWith(
            'group:grp_123'
        );
    });

    test('unmount queues mark-as-seen for unseen notification', () => {
        const wrapper = mount(NotificationItem, {
            props: {
                notification: makeNotification({
                    version: 2
                }),
                isUnseen: true
            }
        });

        wrapper.unmount();
        expect(mocks.notificationStore.queueMarkAsSeen).toHaveBeenCalledWith(
            'noty_1',
            2
        );
    });
});
