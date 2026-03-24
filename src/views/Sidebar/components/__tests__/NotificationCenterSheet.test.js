import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    router: {
        push: vi.fn()
    },
    inviteStore: {
        refreshInviteMessageTableData: vi.fn()
    },
    galleryStore: {
        clearInviteImageUpload: vi.fn()
    },
    notificationStore: null
}));

vi.mock('pinia', () => ({
    storeToRefs: (store) => store
}));

vi.mock('vue-router', () => ({
    useRouter: () => mocks.router
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    })
}));

vi.mock('../../../../stores', () => ({
    useInviteStore: () => mocks.inviteStore,
    useGalleryStore: () => mocks.galleryStore,
    useNotificationStore: () => mocks.notificationStore
}));

vi.mock('@/components/ui/sheet', () => ({
    Sheet: {
        props: ['open'],
        emits: ['update:open'],
        template: '<div data-testid="sheet"><slot /></div>'
    },
    SheetContent: {
        template: '<div data-testid="sheet-content"><slot /></div>'
    },
    SheetHeader: {
        template: '<div data-testid="sheet-header"><slot /></div>'
    },
    SheetTitle: {
        template: '<div data-testid="sheet-title"><slot /></div>'
    }
}));

vi.mock('@/components/ui/tabs', () => ({
    Tabs: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template:
            '<div data-testid="tabs" :data-model-value="modelValue"><slot /></div>'
    },
    TabsList: { template: '<div data-testid="tabs-list"><slot /></div>' },
    TabsTrigger: {
        props: ['value'],
        template:
            '<button data-testid="tabs-trigger" :data-value="value"><slot /></button>'
    },
    TabsContent: {
        props: ['value'],
        template:
            '<div data-testid="tabs-content" :data-value="value"><slot /></div>'
    }
}));

vi.mock('../NotificationList.vue', () => ({
    default: {
        props: ['notifications', 'recentNotifications'],
        emits: [
            'show-invite-response',
            'show-invite-request-response',
            'navigate-to-table'
        ],
        template:
            '<div data-testid="notification-list">' +
            '<button data-testid="emit-show-invite-response" @click="$emit(\'show-invite-response\', { id: \'invite_1\' })">invite-response</button>' +
            '<button data-testid="emit-show-invite-request-response" @click="$emit(\'show-invite-request-response\', { id: \'invite_2\' })">invite-request-response</button>' +
            '<button data-testid="emit-navigate" @click="$emit(\'navigate-to-table\')">navigate</button>' +
            '</div>'
    }
}));

vi.mock('../../../Notifications/dialogs/SendInviteResponseDialog.vue', () => ({
    default: {
        props: ['sendInviteResponseDialogVisible'],
        template:
            '<div data-testid="dialog-response" :data-visible="String(sendInviteResponseDialogVisible)" />'
    }
}));

vi.mock(
    '../../../Notifications/dialogs/SendInviteRequestResponseDialog.vue',
    () => ({
        default: {
            props: ['sendInviteRequestResponseDialogVisible'],
            template:
                '<div data-testid="dialog-request-response" :data-visible="String(sendInviteRequestResponseDialogVisible)" />'
        }
    })
);

import NotificationCenterSheet from '../NotificationCenterSheet.vue';

describe('NotificationCenterSheet.vue', () => {
    beforeEach(() => {
        mocks.router.push.mockReset();
        mocks.inviteStore.refreshInviteMessageTableData.mockReset();
        mocks.galleryStore.clearInviteImageUpload.mockReset();

        mocks.notificationStore = {
            isNotificationCenterOpen: ref(false),
            unseenFriendNotifications: ref([]),
            unseenGroupNotifications: ref([]),
            unseenOtherNotifications: ref([]),
            recentFriendNotifications: ref([]),
            recentGroupNotifications: ref([]),
            recentOtherNotifications: ref([])
        };
    });

    test('selects group tab when opening and only group unseen notifications exist', async () => {
        mocks.notificationStore.unseenGroupNotifications.value = [{ id: 'g1' }];
        const wrapper = mount(NotificationCenterSheet);

        mocks.notificationStore.isNotificationCenterOpen.value = true;
        await wrapper.vm.$nextTick();

        expect(
            wrapper.get('[data-testid="tabs"]').attributes('data-model-value')
        ).toBe('group');
    });

    test('navigate-to-table closes center and routes to notification page', async () => {
        mocks.notificationStore.isNotificationCenterOpen.value = true;
        const wrapper = mount(NotificationCenterSheet);

        await wrapper.get('[data-testid="emit-navigate"]').trigger('click');

        expect(mocks.notificationStore.isNotificationCenterOpen.value).toBe(
            false
        );
        expect(mocks.router.push).toHaveBeenCalledWith({
            name: 'notification'
        });
    });

    test('show invite response/request dialogs trigger side effects', async () => {
        const wrapper = mount(NotificationCenterSheet);

        await wrapper
            .get('[data-testid="emit-show-invite-response"]')
            .trigger('click');

        expect(
            mocks.inviteStore.refreshInviteMessageTableData
        ).toHaveBeenCalledWith('response');
        expect(mocks.galleryStore.clearInviteImageUpload).toHaveBeenCalled();
        expect(
            wrapper
                .get('[data-testid="dialog-response"]')
                .attributes('data-visible')
        ).toBe('true');

        await wrapper
            .get('[data-testid="emit-show-invite-request-response"]')
            .trigger('click');

        expect(
            mocks.inviteStore.refreshInviteMessageTableData
        ).toHaveBeenCalledWith('requestResponse');
        expect(
            wrapper
                .get('[data-testid="dialog-request-response"]')
                .attributes('data-visible')
        ).toBe('true');
    });
});
