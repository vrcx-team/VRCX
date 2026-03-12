import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    close: vi.fn(),
    save: vi.fn(),
    dialog: { value: { visible: true, maxTableSize: '1000', searchLimit: '100' } }
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('../../../stores', () => ({
    useAppearanceSettingsStore: () => ({
        tableLimitsDialog: mocks.dialog,
        closeTableLimitsDialog: (...a) => mocks.close(...a),
        saveTableLimitsDialog: (...a) => mocks.save(...a),
        TABLE_MAX_SIZE_MIN: 100,
        TABLE_MAX_SIZE_MAX: 5000,
        SEARCH_LIMIT_MIN: 10,
        SEARCH_LIMIT_MAX: 1000
    })
}));
vi.mock('@/components/ui/dialog', () => ({ Dialog: { template: '<div><slot /></div>' }, DialogContent: { template: '<div><slot /></div>' }, DialogHeader: { template: '<div><slot /></div>' }, DialogTitle: { template: '<div><slot /></div>' }, DialogDescription: { template: '<div><slot /></div>' }, DialogFooter: { template: '<div><slot /></div>' } }));
vi.mock('@/components/ui/field', () => ({ Field: { template: '<div><slot /></div>' }, FieldGroup: { template: '<div><slot /></div>' }, FieldLabel: { template: '<div><slot /></div>' }, FieldContent: { template: '<div><slot /></div>' } }));
vi.mock('@/components/ui/button', () => ({ Button: { emits: ['click'], template: '<button data-testid="btn" :disabled="$attrs.disabled" @click="$emit(\'click\')"><slot /></button>' } }));
vi.mock('@/components/ui/input-group', () => ({ InputGroupField: { template: '<input />' } }));

import TableLimitsDialog from '../TableLimitsDialog.vue';

describe('TableLimitsDialog.vue', () => {
    it('disables save when limits are invalid and calls close', async () => {
        mocks.dialog.value.maxTableSize = '1';
        const wrapper = mount(TableLimitsDialog);
        const buttons = wrapper.findAll('[data-testid="btn"]');

        expect(buttons[1].attributes('disabled')).toBeDefined();
        await buttons[0].trigger('click');
        expect(mocks.close).toHaveBeenCalled();
    });
});
