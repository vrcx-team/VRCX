import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    followGroupEvent: vi.fn(async () => ({ json: { ok: true } })),
    showFullscreenImageDialog: vi.fn(),
    writeText: vi.fn(),
    toastSuccess: vi.fn()
}));

Object.assign(globalThis, { navigator: { clipboard: { writeText: (...a) => mocks.writeText(...a) } } });

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('../../../../stores', () => ({
    useGalleryStore: () => ({ showFullscreenImageDialog: (...a) => mocks.showFullscreenImageDialog(...a) }),
    useGroupStore: () => ({ cachedGroups: new Map([['grp_1', { name: 'Group One', bannerUrl: 'https://example.com/banner.png' }]]) })
}));
vi.mock('../../../../services/appConfig', () => ({ AppDebug: { endpointDomain: 'https://api.example.com' } }));
vi.mock('../../../../shared/utils', () => ({ formatDateFilter: () => '12:00' }));
vi.mock('../../../../api', () => ({ groupRequest: { followGroupEvent: (...a) => mocks.followGroupEvent(...a) } }));
vi.mock('vue-sonner', () => ({ toast: { success: (...a) => mocks.toastSuccess(...a), error: vi.fn() } }));
vi.mock('@/components/ui/popover', () => ({ Popover: { template: '<div><slot /></div>' }, PopoverTrigger: { template: '<div><slot /></div>' }, PopoverContent: { template: '<div><slot /></div>' } }));
vi.mock('@/components/ui/card', () => ({ Card: { template: '<div><slot /></div>' } }));
vi.mock('@/components/ui/button', () => ({ Button: { emits: ['click'], template: '<button data-testid="btn" @click="$emit(\'click\')"><slot /></button>' } }));
vi.mock('lucide-vue-next', () => ({
    Calendar: { template: '<i />' },
    Download: { template: '<i />' },
    Share2: { template: '<i />' },
    Star: { template: '<i />' }
}));

import GroupCalendarEventCard from '../GroupCalendarEventCard.vue';

function mountCard() {
    return mount(GroupCalendarEventCard, {
        props: {
            event: { id: 'evt_1', ownerId: 'grp_1', title: 'Event One', startsAt: '2026-01-01', endsAt: '2026-01-01', accessType: 'public', category: 'social', interestedUserCount: 2, closeInstanceAfterEndMinutes: 30, createdAt: '2026-01-01', description: 'desc', imageUrl: '' },
            mode: 'timeline',
            isFollowing: false
        }
    });
}

describe('GroupCalendarEventCard.vue', () => {
    beforeEach(() => {
        mocks.followGroupEvent.mockClear();
        mocks.writeText.mockClear();
    });

    it('copies event link and toggles follow', async () => {
        const wrapper = mountCard();
        const buttons = wrapper.findAll('[data-testid="btn"]');

        await buttons[0].trigger('click');
        await buttons[1].trigger('click');
        await Promise.resolve();

        expect(mocks.writeText).toHaveBeenCalledWith('https://vrchat.com/home/group/grp_1/calendar/evt_1');
        expect(mocks.followGroupEvent).toHaveBeenCalledWith({ groupId: 'grp_1', eventId: 'evt_1', isFollowing: true });
        expect(wrapper.emitted('update-following-calendar-data')).toBeTruthy();
    });
});
