import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
const mock = vi.hoisted(() => ({ load: vi.fn(), account: 'demo:observer' }));
vi.mock('../../src/features/local-insights/reader.js', () => ({ loadLocalRecords: mock.load, currentAccountId: () => mock.account }));
import ActivityReview from '../../src/features/local-insights/ActivityReview.vue';
import fixture from './fixtures.json';
let wrapper;
function start(locale = 'en') { wrapper = mount(ActivityReview, { global: { plugins: [createI18n({ legacy: false, locale, messages: { en: {}, 'zh-CN': {} } })] } }); return wrapper; }
beforeEach(() => { mock.account = fixture.observerId; localStorage.clear(); mock.load.mockReset(); mock.load.mockResolvedValue({ ...fixture, records: [], friendIds: new Set() }); });
afterEach(() => wrapper?.unmount());
describe('local review UI', () => {
    it('shows empty state and transparent policy', async () => { start(); await flushPromises(); expect(wrapper.text()).toContain('No recorded encounters'); expect(wrapper.text()).toContain('not hidden'); });
    it('runs the real analysis engine for the demo', async () => { start(); await flushPromises(); await wrapper.find('.li-actions button').trigger('click'); await flushPromises(); expect(wrapper.text()).toContain('90 min'); expect(wrapper.text()).toContain('40 min'); expect(wrapper.text()).toContain('Blair'); expect(wrapper.findAll('.li-timeline li')).toHaveLength(5); });
    it('renders Chinese labels', async () => { start('zh-CN'); await flushPromises(); expect(wrapper.find('h1').text()).toBe('\u5171\u540c\u6e38\u73a9\u56de\u987e'); });
    it('filters the person selector without discarding observed nonfriend evidence', async () => { start(); await flushPromises(); await wrapper.find('.li-actions button').trigger('click'); expect(wrapper.find('.li-person select').text()).not.toContain('Casey'); await wrapper.find('input[type=checkbox]').setValue(false); expect(wrapper.find('.li-person select').text()).toContain('Casey'); });
    it('clears the prior report after a database error', async () => { start(); await flushPromises(); await wrapper.find('.li-actions button').trigger('click'); mock.load.mockRejectedValueOnce(new Error('database is locked')); await wrapper.find('.li-primary').trigger('click'); await flushPromises(); expect(wrapper.find('[role=alert]').text()).toContain('database is locked'); expect(wrapper.find('.li-grid').exists()).toBe(false); });
    it('does not let an older request replace the demo', async () => { let complete; mock.load.mockReturnValueOnce(new Promise((resolve) => { complete = resolve; })); start(); await wrapper.find('.li-actions button').trigger('click'); complete({ ...fixture, records: [], friendIds: new Set() }); await flushPromises(); expect(wrapper.text()).toContain('90 min'); });
    it('clears personal view and saved selection explicitly', async () => { start(); await flushPromises(); await wrapper.find('.li-actions button').trigger('click'); await wrapper.findAll('.li-profile button')[1].trigger('click'); expect(wrapper.find('.li-grid').exists()).toBe(false); expect(wrapper.text()).toContain('No recorded encounters'); });
    it('discards data from a switched account', async () => { let complete; mock.load.mockReturnValueOnce(new Promise((resolve) => { complete = resolve; })); start(); mock.account = 'demo:other'; complete({ ...fixture, friendIds: new Set(fixture.friendIds) }); await flushPromises(); expect(wrapper.find('.li-grid').exists()).toBe(false); expect(wrapper.find('.li-person select').text()).not.toContain('Alex'); });
});
