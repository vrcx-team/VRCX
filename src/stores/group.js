import { reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import { hasGroupPermission, replaceBioSymbols } from '../shared/utils';
import { groupRequest, queryRequest } from '../api';
import { initUserGroups } from '../coordinators/groupCoordinator';
import { watchState } from '../services/watchState';

export const useGroupStore = defineStore('Group', () => {
    const { t } = useI18n();

    let cachedGroups = new Map();

    const groupDialog = ref({
        visible: false,
        loading: false,
        activeTab: 'Info',
        lastActiveTab: 'Info',
        isGetGroupDialogGroupLoading: false,
        id: '',
        inGroup: false,
        ownerDisplayName: '',
        ref: {},
        announcement: {},
        posts: [],
        postsFiltered: [],
        calendar: [],
        members: [],
        memberSearch: '',
        memberSearchResults: [],
        instances: [],
        memberRoles: [],
        lastVisit: '',
        memberFilter: {
            name: 'dialog.group.members.filters.everyone',
            id: null
        },
        memberSortOrder: {
            name: 'dialog.group.members.sorting.joined_at_desc',
            value: 'joinedAt:desc'
        },
        postsSearch: '',
        galleries: {}
    });

    const currentUserGroups = reactive(new Map());

    const inviteGroupDialog = ref({
        visible: false,
        loading: false,
        groupId: '',
        groupName: '',
        userId: '',
        userIds: [],
        userObject: {
            id: '',
            displayName: '',
            $userColour: ''
        }
    });

    const moderateGroupDialog = ref({
        visible: false,
        groupId: '',
        groupName: '',
        userId: '',
        userObject: {}
    });

    const groupMemberModeration = ref({
        visible: false,
        loading: false,
        id: '',
        groupRef: {},
        auditLogTypes: [],
        openWithUserId: ''
    });

    const inGameGroupOrder = ref([]);

    const groupInstances = ref([]);

    const currentUserGroupsInit = ref(false);

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            groupDialog.value.visible = false;
            inviteGroupDialog.value.visible = false;
            moderateGroupDialog.value.visible = false;
            groupMemberModeration.value.visible = false;
            currentUserGroupsInit.value = false;
            cachedGroups.clear();
            currentUserGroups.clear();
            if (isLoggedIn) {
                initUserGroups();
            }
        },
        { flush: 'sync' }
    );

    /**
     *
     * @param {{ groupId: string }} params
     * @returns { Promise<{posts: any, params}> }
     */
    async function getAllGroupPosts(params) {
        const n = 100;
        const posts = [];
        let offset = 0;
        let total = Infinity;
        let pages = 0;
        do {
            const args = await groupRequest.getGroupPosts({
                groupId: params.groupId,
                n,
                offset
            });
            const pagePosts = args.json?.posts ?? [];
            total = Number(args.json?.total ?? pagePosts.length);
            posts.push(...pagePosts);
            offset += n;
            pages += 1;
            if (pagePosts.length === 0) {
                break;
            }
        } while (offset < total && pages < 50);
        const returnArgs = {
            posts,
            params
        };
        const D = groupDialog.value;
        if (D.id === params.groupId) {
            for (const post of posts) {
                post.title = replaceBioSymbols(post.title);
                post.text = replaceBioSymbols(post.text);
            }
            D.announcement = posts[0] ?? {};
            D.posts = posts;
            updateGroupPostSearch();
        }

        return returnArgs;
    }

    /**
     *
     * @param event
     */
    function applyGroupEvent(event) {
        return {
            userInterest: {
                createdAt: null,
                isFollowing: false,
                updatedAt: null
            },
            ...event,
            title: replaceBioSymbols(event.title),
            description: replaceBioSymbols(event.description)
        };
    }

    /**
     *
     * @param a
     * @param b
     */
    function sortGroupInstancesByInGame(a, b) {
        const aIndex = inGameGroupOrder.value.indexOf(a?.group?.id);
        const bIndex = inGameGroupOrder.value.indexOf(b?.group?.id);
        if (aIndex === -1 && bIndex === -1) {
            return 0;
        }
        if (aIndex === -1) {
            return 1;
        }
        if (bIndex === -1) {
            return -1;
        }
        return aIndex - bIndex;
    }

    /**
     *
     */
    function updateGroupPostSearch() {
        const D = groupDialog.value;
        const search = D.postsSearch.toLowerCase();
        D.postsFiltered = D.posts.filter((post) => {
            if (search === '') {
                return true;
            }
            if (post.title.toLowerCase().includes(search)) {
                return true;
            }
            if (post.text.toLowerCase().includes(search)) {
                return true;
            }
            return false;
        });
    }

    /**
     *
     * @param {object} args
     */
    function handleGroupPost(args) {
        const D = groupDialog.value;
        if (D.id !== args.params.groupId) {
            return;
        }

        const newPost = args.json;
        newPost.title = replaceBioSymbols(newPost.title);
        newPost.text = replaceBioSymbols(newPost.text);
        let hasPost = false;
        // update existing post
        for (const post of D.posts) {
            if (post.id === newPost.id) {
                Object.assign(post, newPost);
                hasPost = true;
                break;
            }
        }
        // set or update announcement
        if (newPost.id === D.announcement.id || !D.announcement.id) {
            D.announcement = newPost;
        }
        // add new post
        if (!hasPost) {
            D.posts.unshift(newPost);
        }
        updateGroupPostSearch();
    }

    /**
     *
     */
    function clearGroupInstances() {
        groupInstances.value = [];
    }

    /**
     * @param {boolean} value
     */
    function setGroupDialogVisible(value) {
        groupDialog.value.visible = value;
    }

    /**
     *
     * @param userId
     */
    function showModerateGroupDialog(userId) {
        const D = moderateGroupDialog.value;
        D.userId = userId;
        D.userObject = {};
        D.visible = true;
    }

    /**
     *
     * @param groupId
     * @param userId
     */
    function showGroupMemberModerationDialog(groupId, userId = '') {
        const D = groupMemberModeration.value;
        D.id = groupId;
        D.openWithUserId = userId;

        D.groupRef = {};
        D.auditLogTypes = [];
        queryRequest.fetch('group.dialog', { groupId }).then((args) => {
            D.groupRef = args.ref;
            if (hasGroupPermission(D.groupRef, 'group-audit-view')) {
                groupRequest.getGroupAuditLogTypes({ groupId }).then((args) => {
                    if (D.id !== args.params.groupId) {
                        return;
                    }
                    D.auditLogTypes = args.json;
                });
            }
        });
        D.visible = true;
    }

    /**
     * @param {boolean} value
     */
    function setCurrentUserGroupsInit(value) {
        currentUserGroupsInit.value = value;
    }

    /**
     * @param {Array} value
     */
    function setInGameGroupOrder(value) {
        inGameGroupOrder.value = value;
    }

    /**
     * @param {Array} value
     */
    function setGroupInstances(value) {
        groupInstances.value = value;
    }

    return {
        groupDialog,
        currentUserGroups,
        inviteGroupDialog,
        moderateGroupDialog,
        groupMemberModeration,
        cachedGroups,
        inGameGroupOrder,
        groupInstances,
        currentUserGroupsInit,
        getAllGroupPosts,
        applyGroupEvent,
        sortGroupInstancesByInGame,
        updateGroupPostSearch,
        handleGroupPost,
        clearGroupInstances,
        setGroupDialogVisible,
        showModerateGroupDialog,
        showGroupMemberModerationDialog,
        setCurrentUserGroupsInit,
        setInGameGroupOrder,
        setGroupInstances
    };
});
