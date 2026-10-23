import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import SetAvatarTagsDialog from '../SetAvatarTagsDialog.vue';

const mocks = vi.hoisted(() => ({
    cachedAvatars: new Map(),
    saveAvatar: vi.fn(),
    applyAvatar: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
}));

vi.mock('../../../../api', () => ({ avatarRequest: { saveAvatar: mocks.saveAvatar } }));
vi.mock('../../../../stores', () => ({ useAvatarStore: () => ({ cachedAvatars: mocks.cachedAvatars }) }));
vi.mock('../../../../coordinators/avatarCoordinator', () => ({
    applyAvatar: mocks.applyAvatar,
    showAvatarDialog: vi.fn()
}));
vi.mock('../../../../shared/utils', () => ({ removeFromArray: vi.fn() }));
vi.mock('vue-sonner', () => ({ toast: { info: mocks.info, error: mocks.error } }));
vi.mock('vue-i18n', () => ({
    useI18n: () => ({ t: (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key) })
}));
vi.mock('@/components/ui/dialog', () => ({
    Dialog: {},
    DialogContent: {},
    DialogFooter: {},
    DialogHeader: {},
    DialogTitle: {}
}));

afterEach(() => vi.restoreAllMocks());

beforeEach(() => {
    vi.clearAllMocks();
    mocks.cachedAvatars.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

test.each([
    [404, 3, 2],
    [403, 2, 1]
])('status %s makes %s requests and saves %s avatars', async (status, requests, saved) => {
    const ids = ['avtr_first', 'avtr_deleted', 'avtr_last'];
    for (const id of ids) {
        mocks.cachedAvatars.set(id, { id, tags: ['author_tag_keep', 'content_gore'] });
    }
    const dialog = {
        visible: true,
        loading: false,
        ownAvatars: [],
        selectedAvatarIds: ids,
        selectedTags: ['content_horror']
    };
    mocks.saveAvatar.mockImplementation(async (params) => {
        if (params.id === 'avtr_deleted') throw Object.assign(new Error('request failed'), { status });
        return { json: params };
    });
    const wrapper = shallowMount(SetAvatarTagsDialog, { props: { setAvatarTagsDialog: dialog } });

    await wrapper.vm.saveSetAvatarTagsDialog();

    expect(mocks.saveAvatar.mock.calls.map(([params]) => params.id)).toEqual(ids.slice(0, requests));
    expect(mocks.saveAvatar).toHaveBeenLastCalledWith({
        id: ids[requests - 1],
        tags: ['content_horror', 'author_tag_keep']
    });
    expect(mocks.applyAvatar).toHaveBeenCalledTimes(saved);
    expect(mocks.error).toHaveBeenCalledTimes(status === 404 ? 0 : 1);
    expect(mocks.info).toHaveBeenCalledWith(
        `dialog.set_avatar_tags.save_result ${JSON.stringify({ saved, remaining: ids.length - saved })}`
    );
    expect(dialog.loading).toBe(false);
    expect(dialog.visible).toBe(false);
});
