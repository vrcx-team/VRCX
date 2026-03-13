import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../../WristOverlaySettings.vue', () => ({
    default: {
        emits: ['open-feed-filters'],
        template:
            '<button data-testid="open-filters" @click="$emit(\'open-feed-filters\')">open</button>'
    }
}));

vi.mock('../../../dialogs/FeedFiltersDialog.vue', () => ({
    default: {
        props: ['feedFiltersDialogMode'],
        template:
            '<div data-testid="feed-dialog" :data-mode="feedFiltersDialogMode" />'
    }
}));

import WristOverlayTab from '../WristOverlayTab.vue';

describe('WristOverlayTab.vue', () => {
    it('sets feed dialog mode to wrist when child emits open-feed-filters', async () => {
        const wrapper = mount(WristOverlayTab);

        expect(
            wrapper.get('[data-testid="feed-dialog"]').attributes('data-mode')
        ).toBe('');

        await wrapper.get('[data-testid="open-filters"]').trigger('click');

        expect(
            wrapper.get('[data-testid="feed-dialog"]').attributes('data-mode')
        ).toBe('wrist');
    });
});
