import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
    getString: vi.fn(async (_key, fallback) => fallback),
    setString: vi.fn()
}));

vi.mock('../../../../services/config.js', () => ({
    default: {
        getString: (...args) => mocks.getString(...args),
        setString: (...args) => mocks.setString(...args)
    }
}));

import { useFavoritesSplitter } from '../useFavoritesSplitter';

function mountComposable() {
    let api;
    const Comp = defineComponent({
        setup() {
            api = useFavoritesSplitter({
                configKey: 'split-key',
                defaultSize: 240,
                minPx: 120,
                maxPx: 360
            });
            return () => h('div');
        }
    });
    mount(Comp);
    return api;
}

describe('useFavoritesSplitter', () => {
    beforeEach(() => {
        mocks.setString.mockClear();
    });

    it('persists layout size while dragging', () => {
        const api = mountComposable();
        api.splitterGroupRef.value = {
            getBoundingClientRect: () => ({ width: 1200 })
        };

        api.setDragging(true);
        api.handleLayout([25, 75]);
        api.setDragging(false);

        expect(mocks.setString).toHaveBeenCalledWith('split-key', '300');
    });

    it('ignores layout updates when not dragging', () => {
        const api = mountComposable();
        api.splitterGroupRef.value = {
            getBoundingClientRect: () => ({ width: 1200 })
        };

        api.handleLayout([20, 80]);

        expect(mocks.setString).not.toHaveBeenCalled();
    });
});
