import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SetAvatarTagsDialog from '../SetAvatarTagsDialog.vue';

const mocks = vi.hoisted(() => ({
    avatars: new Map(),
    preloadOwnAvatars: vi.fn(),
    currentUser: { id: 'usr_me' },
    saveAvatar: vi.fn(),
    applyAvatar: vi.fn(),
    alert: vi.fn()
}));

vi.mock('../../../../api', () => ({ avatarRequest: { saveAvatar: mocks.saveAvatar } }));
vi.mock('../../../../stores', () => ({
    useModalStore: () => ({ alert: mocks.alert }),
    useUserStore: () => ({ currentUser: mocks.currentUser })
}));
vi.mock('../../../../coordinators/avatarCoordinator', () => ({
    applyAvatar: mocks.applyAvatar,
    preloadOwnAvatars: mocks.preloadOwnAvatars,
    showAvatarDialog: vi.fn()
}));
vi.mock('../../../../shared/utils', () => import('../../../../shared/utils/base/array'));
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
    mocks.avatars.clear();
    mocks.currentUser.id = 'usr_me';
    mocks.preloadOwnAvatars.mockResolvedValue(mocks.avatars);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

test.each([
    [404, 3, 2],
    [403, 2, 1]
])('status %s makes %s requests and saves %s avatars', async (status, requests, saved) => {
    const ids = ['avtr_first', 'avtr_deleted', 'avtr_last'];
    for (const id of ids) {
        mocks.avatars.set(id, { id, tags: ['author_tag_keep', 'content_gore'] });
    }
    const dialog = {
        visible: true,
        loading: false,
        ownAvatars: [],
        selectedAvatarIds: ids,
        selectedTags: ['content_horror']
    };
    mocks.saveAvatar.mockImplementation(async (params) => {
        if (params.id === 'avtr_deleted') {
            await nextTick();
            expect(wrapper.get('[role="status"]').text()).toBe(
                'dialog.set_avatar_tags.save_progress {"total":3,"saved":1,"unchanged":0,"unavailable":0,"remaining":2}'
            );
            throw Object.assign(new Error('request failed'), { status });
        }
        return { json: params };
    });
    const wrapper = shallowMount(SetAvatarTagsDialog, {
        props: { setAvatarTagsDialog: dialog },
        global: { renderStubDefaultSlot: true }
    });

    await wrapper.vm.saveSetAvatarTagsDialog();

    expect(mocks.saveAvatar.mock.calls.map(([params]) => params.id)).toEqual(ids.slice(0, requests));
    expect(mocks.saveAvatar).toHaveBeenLastCalledWith({
        id: ids[requests - 1],
        tags: ['content_horror', 'author_tag_keep']
    });
    expect(mocks.applyAvatar).toHaveBeenCalledTimes(saved);
    const unavailable = status === 404 ? 1 : 0;
    expect(mocks.alert).toHaveBeenCalledWith({
        title: 'dialog.set_avatar_tags.header',
        dismissible: false,
        description:
            (status === 403 ? 'dialog.set_avatar_tags.save_error ' : '') +
            `dialog.set_avatar_tags.save_result ${JSON.stringify({ saved, unchanged: 0, unavailable, remaining: ids.length - saved - unavailable })}`
    });
    expect(dialog.loading).toBe(false);
    expect(dialog.visible).toBe(false);
});

test.each([{ selectedTags: ['content_adult', 'content_sex'] }, { selectedTags: [] }])(
    'skips matching tags but still applies removals (%j)',
    async ({ selectedTags }) => {
        const unchangedTags = [...selectedTags].reverse().concat('author_tag_keep');
        mocks.avatars.set('avtr_unchanged', { id: 'avtr_unchanged', tags: [...unchangedTags] });
        mocks.avatars.set('avtr_changed', { id: 'avtr_changed', tags: ['author_tag_keep', 'content_old'] });
        mocks.avatars.set('avtr_extra', {
            id: 'avtr_extra',
            tags: [...selectedTags, 'content_extra', 'author_tag_keep']
        });
        mocks.saveAvatar.mockResolvedValue({ json: {} });
        const dialog = {
            visible: true,
            loading: false,
            ownAvatars: [{ id: 'avtr_unchanged', tags: ['content_stale'] }],
            selectedAvatarIds: ['avtr_unchanged', 'avtr_changed', 'avtr_extra', 'avtr_deleted'],
            selectedTags
        };
        const wrapper = shallowMount(SetAvatarTagsDialog, { props: { setAvatarTagsDialog: dialog } });

        await wrapper.vm.saveSetAvatarTagsDialog();

        expect(mocks.saveAvatar.mock.calls.map(([params]) => params)).toEqual([
            { id: 'avtr_changed', tags: [...selectedTags, 'author_tag_keep'] },
            { id: 'avtr_extra', tags: [...selectedTags, 'author_tag_keep'] }
        ]);
        expect(mocks.avatars.get('avtr_unchanged').tags).toEqual(unchangedTags);
        expect(mocks.preloadOwnAvatars).toHaveBeenCalledOnce();
        expect(mocks.preloadOwnAvatars.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.saveAvatar.mock.invocationCallOrder[0]
        );
        expect(wrapper.vm.saveProgress).toEqual({
            saved: 2,
            unchanged: 1,
            unavailable: 1,
            total: 4,
            toUpdate: 2,
            refreshing: false
        });
    }
);

test.each(['failed refresh', 'closed dialog', 'changed account'])('does not save after %s', async (reason) => {
    const dialog = {
        visible: true,
        loading: false,
        ownAvatars: [],
        selectedAvatarIds: ['avtr_first'],
        selectedTags: ['content_horror']
    };
    mocks.avatars.set('avtr_first', { id: 'avtr_first', tags: [] });
    let finishRefresh;
    mocks.preloadOwnAvatars.mockReturnValue(
        new Promise((resolve) => {
            finishRefresh = resolve;
        })
    );
    const wrapper = shallowMount(SetAvatarTagsDialog, {
        props: { setAvatarTagsDialog: dialog },
        global: { renderStubDefaultSlot: true }
    });
    const save = wrapper.vm.saveSetAvatarTagsDialog();
    await nextTick();
    expect(wrapper.get('[role="status"]').text()).toBe('dialog.set_avatar_tags.refreshing');
    expect(mocks.saveAvatar).not.toHaveBeenCalled();
    if (reason === 'closed dialog') {
        await wrapper.setProps({ setAvatarTagsDialog: { ...dialog, visible: false } });
    } else if (reason === 'changed account') {
        mocks.currentUser.id = 'usr_other';
    }
    finishRefresh(reason === 'failed refresh' ? null : mocks.avatars);
    await save;
    expect(mocks.saveAvatar).not.toHaveBeenCalled();
    expect(mocks.alert).toHaveBeenCalledWith(
        expect.objectContaining({
            dismissible: false,
            description: expect.stringContaining('"remaining":1')
        })
    );
});
