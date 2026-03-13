import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    emojiTable: [],
    getCachedEmoji: vi.fn(async () => ({
        frames: null,
        framesOverTime: null,
        loopStyle: null,
        versions: []
    })),
    extractFileId: vi.fn(() => 'file_1'),
    generateEmojiStyle: vi.fn(() => 'background: red;')
}));

vi.mock('../../stores', () => ({
    useGalleryStore: () => ({
        getCachedEmoji: (...args) => mocks.getCachedEmoji(...args),
        emojiTable: mocks.emojiTable
    })
}));

vi.mock('../../shared/utils', () => ({
    extractFileId: (...args) => mocks.extractFileId(...args),
    generateEmojiStyle: (...args) => mocks.generateEmojiStyle(...args)
}));

vi.mock('../ui/avatar', () => ({
    Avatar: { template: '<div data-testid="avatar"><slot /></div>' },
    AvatarImage: {
        props: ['src'],
        template: '<img data-testid="avatar-image" :src="src" />'
    },
    AvatarFallback: {
        template: '<span data-testid="avatar-fallback"><slot /></span>'
    }
}));

vi.mock('lucide-vue-next', () => ({
    ImageOff: { template: '<i data-testid="image-off" />' }
}));

import Emoji from '../Emoji.vue';

async function flush() {
    await Promise.resolve();
    await Promise.resolve();
}

describe('Emoji.vue', () => {
    beforeEach(() => {
        mocks.emojiTable.length = 0;
        mocks.getCachedEmoji.mockClear();
        mocks.extractFileId.mockReturnValue('file_1');
        mocks.generateEmojiStyle.mockClear();
    });

    it('renders animated div when emoji has frames in table', async () => {
        mocks.emojiTable.push({
            id: 'file_1',
            frames: 4,
            framesOverTime: 1,
            loopStyle: 0,
            versions: []
        });

        const wrapper = mount(Emoji, {
            props: {
                imageUrl: 'https://example.com/file_1.png',
                size: 64
            }
        });

        await flush();

        const animated = wrapper.find('.avatar');
        expect(animated.exists()).toBe(true);
        expect(mocks.generateEmojiStyle).toHaveBeenCalled();
        expect(animated.attributes('style')).toContain('background: red;');
        expect(wrapper.find('[data-testid="avatar"]').exists()).toBe(false);
    });

    it('falls back to Avatar image when no frames', async () => {
        const wrapper = mount(Emoji, {
            props: {
                imageUrl: 'https://example.com/file_2.png',
                size: 48
            }
        });

        await flush();

        expect(mocks.getCachedEmoji).toHaveBeenCalledWith('file_1');
        expect(wrapper.find('[data-testid="avatar"]').exists()).toBe(true);
        expect(
            wrapper.find('[data-testid="avatar-image"]').attributes('src')
        ).toBe('https://example.com/file_2.png');
        expect(wrapper.find('[data-testid="avatar-fallback"]').exists()).toBe(
            true
        );
    });

    it('updates when imageUrl changes', async () => {
        const wrapper = mount(Emoji, {
            props: {
                imageUrl: 'https://example.com/a.png'
            }
        });

        await flush();
        mocks.extractFileId.mockReturnValue('file_2');

        await wrapper.setProps({ imageUrl: 'https://example.com/b.png' });
        await flush();

        expect(mocks.getCachedEmoji).toHaveBeenCalledWith('file_1');
        expect(mocks.getCachedEmoji).toHaveBeenCalledWith('file_2');
    });
});
