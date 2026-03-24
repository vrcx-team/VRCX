import { describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('@tanstack/vue-virtual', () => ({
    useVirtualizer: (optionsRef) => ({
        value: {
            getVirtualItems: () => {
                const options = optionsRef.value;
                return Array.from({ length: options.count }, (_, index) => ({
                    index,
                    key: options.getItemKey?.(index) ?? index,
                    start: index * 56
                }));
            },
            getTotalSize: () => optionsRef.value.count * 56,
            measure: vi.fn(),
            measureElement: vi.fn()
        }
    })
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    })
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="view-more" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/separator', () => ({
    Separator: { template: '<hr data-testid="separator" />' }
}));

vi.mock('../NotificationItem.vue', () => ({
    default: {
        props: ['notification', 'isUnseen'],
        emits: ['show-invite-response', 'show-invite-request-response'],
        template:
            '<div data-testid="notification-item" :data-id="notification.id" :data-unseen="String(isUnseen)">' +
            '{{ notification.id }}' +
            '<button data-testid="emit-invite-response" @click="$emit(\'show-invite-response\', notification)">invite-response</button>' +
            '<button data-testid="emit-invite-request-response" @click="$emit(\'show-invite-request-response\', notification)">invite-request-response</button>' +
            '</div>'
    }
}));

import NotificationList from '../NotificationList.vue';

function makeNoty(id, createdAt) {
    return {
        id,
        created_at: createdAt,
        type: 'friendRequest'
    };
}

describe('NotificationList.vue', () => {
    test('renders empty state when there are no rows', () => {
        const wrapper = mount(NotificationList, {
            props: {
                notifications: [],
                recentNotifications: []
            }
        });

        expect(wrapper.text()).toContain(
            'side_panel.notification_center.no_new_notifications'
        );
    });

    test('sorts unseen notifications desc and renders recent section header', () => {
        const wrapper = mount(NotificationList, {
            props: {
                notifications: [
                    makeNoty('old', '2026-03-08T00:00:00.000Z'),
                    makeNoty('new', '2026-03-09T00:00:00.000Z')
                ],
                recentNotifications: [
                    makeNoty('recent1', '2026-03-07T00:00:00.000Z')
                ]
            }
        });

        const items = wrapper.findAll('[data-testid="notification-item"]');
        expect(items.map((x) => x.attributes('data-id'))).toEqual([
            'new',
            'old',
            'recent1'
        ]);
        expect(wrapper.text()).toContain(
            'side_panel.notification_center.past_notifications'
        );
    });

    test('emits navigate-to-table when view-more button is clicked', async () => {
        const wrapper = mount(NotificationList, {
            props: {
                notifications: [makeNoty('n1', '2026-03-09T00:00:00.000Z')],
                recentNotifications: []
            }
        });

        await wrapper.get('[data-testid="view-more"]').trigger('click');
        expect(wrapper.emitted('navigate-to-table')).toBeTruthy();
    });

    test('re-emits invite-related events from NotificationItem', async () => {
        const wrapper = mount(NotificationList, {
            props: {
                notifications: [makeNoty('n1', '2026-03-09T00:00:00.000Z')],
                recentNotifications: []
            }
        });

        await wrapper
            .get('[data-testid="emit-invite-response"]')
            .trigger('click');
        await wrapper
            .get('[data-testid="emit-invite-request-response"]')
            .trigger('click');

        expect(wrapper.emitted('show-invite-response')).toBeTruthy();
        expect(wrapper.emitted('show-invite-request-response')).toBeTruthy();
    });
});
