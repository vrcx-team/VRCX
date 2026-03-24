import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    saveUserMemo: vi.fn(),
    saveNote: vi.fn(async () => ({
        json: { note: 'n1' },
        params: { targetUserId: 'usr_1', note: 'n1' }
    })),
    getUser: vi.fn()
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('../../../../stores', () => ({
    useUserStore: () => ({
        userDialog: ref({
            id: 'usr_1',
            note: 'n1',
            memo: 'm1',
            ref: { id: 'usr_1', note: 'n1' }
        }),
        cachedUsers: new Map([['usr_1', { note: 'n1' }]])
    }),
    useAppearanceSettingsStore: () => ({
        hideUserNotes: ref(false),
        hideUserMemos: ref(false)
    })
}));
vi.mock('../../../../api', () => ({
    miscRequest: { saveNote: (...a) => mocks.saveNote(...a) },
    userRequest: { getUser: (...a) => mocks.getUser(...a) }
}));
vi.mock('../../../../coordinators/memoCoordinator', () => ({
    saveUserMemo: (...a) => mocks.saveUserMemo(...a)
}));
vi.mock('../../../../shared/utils', () => ({ replaceBioSymbols: (s) => s }));
vi.mock('@/components/ui/dialog', () => ({
    Dialog: { template: '<div><slot /></div>' },
    DialogContent: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<div><slot /></div>' },
    DialogFooter: { template: '<div><slot /></div>' }
}));
vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="btn" @click="$emit(\'click\')"><slot /></button>'
    }
}));
vi.mock('@/components/ui/input-group', () => ({
    InputGroupTextareaField: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template: '<textarea />'
    }
}));

import EditNoteAndMemoDialog from '../EditNoteAndMemoDialog.vue';

describe('EditNoteAndMemoDialog.vue', () => {
    beforeEach(() => {
        mocks.saveUserMemo.mockClear();
    });

    it('emits close and saves memo on confirm', async () => {
        const wrapper = mount(EditNoteAndMemoDialog, {
            props: { visible: false }
        });
        await wrapper.setProps({ visible: true });
        const buttons = wrapper.findAll('[data-testid="btn"]');
        await buttons[1].trigger('click');

        expect(mocks.saveUserMemo).toHaveBeenCalledWith('usr_1', 'm1');
        expect(wrapper.emitted('update:visible')).toEqual([[false]]);
    });
});
