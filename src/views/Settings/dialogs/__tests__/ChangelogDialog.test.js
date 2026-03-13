import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

// ─── Mocks ───────────────────────────────────────────────────────────

const changeLogDialog = ref({
    visible: true,
    buildName: 'VRCX 2025.1.0',
    changeLog: '## New Features\n- Feature A\n- Feature B'
});

const openExternalLinkFn = vi.fn();

vi.mock('pinia', () => ({
    storeToRefs: () => ({ changeLogDialog }),
    defineStore: (id, fn) => fn
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    })
}));

vi.mock('../../../../stores', () => ({
    useVRCXUpdaterStore: () => ({})
}));

vi.mock('../../../../shared/utils', () => ({
    openExternalLink: (...args) => openExternalLinkFn(...args)
}));

// Stub VueShowdown since it's async and we don't need real markdown rendering
vi.mock('vue-showdown', () => ({
    VueShowdown: {
        props: ['markdown', 'flavor', 'options'],
        template:
            '<div class="changelog-markdown" data-testid="showdown">{{ markdown }}</div>'
    }
}));

import ChangelogDialog from '../ChangelogDialog.vue';

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 *
 */
function mountComponent() {
    return mount(ChangelogDialog, {
        global: {
            stubs: {
                Dialog: {
                    props: ['open'],
                    emits: ['update:open'],
                    template:
                        '<div data-testid="dialog" v-if="open"><slot /></div>'
                },
                DialogContent: { template: '<div><slot /></div>' },
                DialogHeader: { template: '<div><slot /></div>' },
                DialogTitle: { template: '<h2><slot /></h2>' },
                DialogFooter: {
                    template: '<div data-testid="footer"><slot /></div>'
                },
                Button: {
                    emits: ['click'],
                    props: ['variant'],
                    template:
                        '<button @click="$emit(\'click\')"><slot /></button>'
                }
            }
        }
    });
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('ChangelogDialog.vue', () => {
    beforeEach(() => {
        changeLogDialog.value = {
            visible: true,
            buildName: 'VRCX 2025.1.0',
            changeLog: '## New Features\n- Feature A\n- Feature B'
        };
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('renders dialog title', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('dialog.change_log.header');
        });

        test('renders build name', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('VRCX 2025.1.0');
        });

        test('renders description text', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('dialog.change_log.description');
        });

        test('renders donation links', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('Ko-fi');
            expect(wrapper.text()).toContain('Patreon');
        });

        test('renders GitHub button', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('dialog.change_log.github');
        });

        test('renders Close button', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('dialog.change_log.close');
        });

        test('does not render when visible is false', () => {
            changeLogDialog.value.visible = false;
            const wrapper = mountComponent();
            expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
        });
    });

    describe('interactions', () => {
        test('clicking Close button sets visible to false', async () => {
            const wrapper = mountComponent();
            const buttons = wrapper.findAll('button');
            const closeBtn = buttons.find((b) =>
                b.text().includes('dialog.change_log.close')
            );
            expect(closeBtn).toBeTruthy();

            await closeBtn.trigger('click');
            expect(changeLogDialog.value.visible).toBe(false);
        });

        test('clicking GitHub button opens external link', async () => {
            const wrapper = mountComponent();
            const buttons = wrapper.findAll('button');
            const githubBtn = buttons.find((b) =>
                b.text().includes('dialog.change_log.github')
            );
            expect(githubBtn).toBeTruthy();

            await githubBtn.trigger('click');
            expect(openExternalLinkFn).toHaveBeenCalledWith(
                'https://github.com/vrcx-team/VRCX/releases'
            );
        });

        test('clicking Ko-fi link opens external link', async () => {
            const wrapper = mountComponent();
            const links = wrapper.findAll('a');
            const kofiLink = links.find((l) => l.text().includes('Ko-fi'));
            expect(kofiLink).toBeTruthy();

            await kofiLink.trigger('click');
            expect(openExternalLinkFn).toHaveBeenCalledWith(
                'https://ko-fi.com/map1en_'
            );
        });
    });
});
