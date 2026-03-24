import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

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

import { useFavoritesCardScaling } from '../useFavoritesCardScaling';

function mountComposable() {
    let api;
    const Comp = defineComponent({
        setup() {
            api = useFavoritesCardScaling({
                configKey: 'scale-key',
                spacingConfigKey: 'spacing-key'
            });
            return () => h('div');
        }
    });
    mount(Comp);
    return api;
}

describe('useFavoritesCardScaling', () => {
    beforeEach(() => {
        mocks.getString.mockClear();
        mocks.setString.mockClear();
    });

    it('builds grid style css vars from scale/spacing', async () => {
        const api = mountComposable();
        api.cardScale.value = 0.8;
        api.cardSpacing.value = 1.2;

        const style = api.gridStyle.value(3, { preferredColumns: 2 });

        expect(style['--favorites-card-scale']).toBe('0.80');
        expect(style['--favorites-card-spacing-scale']).toBe('1.20');
        expect(
            Number(style['--favorites-grid-columns'])
        ).toBeGreaterThanOrEqual(1);
        expect(mocks.setString).toHaveBeenCalledWith('scale-key', '0.8');
        expect(mocks.setString).toHaveBeenCalledWith('spacing-key', '1.2');
    });
});
