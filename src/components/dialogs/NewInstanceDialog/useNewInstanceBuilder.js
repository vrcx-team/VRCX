import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import {
    buildLegacyInstanceTag,
    getLaunchURL,
    isRealInstance,
    parseLocation
} from '../../../shared/utils';
import { useGroupStore, useInstanceStore, useUserStore } from '../../../stores';
import { groupRequest } from '../../../api';
import { handleGroupPermissions } from '../../../coordinators/groupCoordinator';

import configRepository from '../../../services/config';

/**
 * Instance builder composable for NewInstanceDialog.
 * Manages instance state, config persistence, and build logic for Normal/Legacy tabs.
 * @param {import('vue').Ref<string>} locationTagRef - reactive location tag from props
 */
export function useNewInstanceBuilder(locationTagRef) {
    const { cachedGroups } = useGroupStore();
    const { currentUser, isLocalUserVrcPlusSupporter } =
        storeToRefs(useUserStore());
    const { createNewInstance } = useInstanceStore();

    const newInstanceDialog = ref({
        visible: false,
        // loading: false,
        selectedTab: 'Normal',
        instanceCreated: false,
        queueEnabled: false,
        worldId: '',
        instanceId: '',
        instanceName: '',
        userId: '',
        legacyUserId: '',
        accessType: 'public',
        region: 'US West',
        groupRegion: '',
        groupId: '',
        groupAccessType: 'plus',
        ageGate: false,
        strict: false,
        location: '',
        shortName: '',
        displayName: '',
        url: '',
        secureOrShortName: '',
        lastSelectedGroupId: '',
        selectedGroupRoles: [],
        roleIds: [],
        groupRef: {}
    });

    // --- Config persistence ---

    /**
     *
     */
    function initializeNewInstanceDialog() {
        configRepository
            .getBool('instanceDialogQueueEnabled', true)
            .then((value) => (newInstanceDialog.value.queueEnabled = value));

        configRepository
            .getString('instanceDialogInstanceName', '')
            .then((value) => (newInstanceDialog.value.instanceName = value));

        configRepository
            .getString('instanceDialogUserId', '')
            .then((value) => (newInstanceDialog.value.legacyUserId = value));

        configRepository
            .getString('instanceDialogAccessType', 'public')
            .then((value) => (newInstanceDialog.value.accessType = value));

        configRepository
            .getString('instanceRegion', 'US West')
            .then((value) => (newInstanceDialog.value.region = value));

        configRepository
            .getString('instanceDialogGroupId', '')
            .then((value) => (newInstanceDialog.value.groupId = value));

        configRepository
            .getString('instanceDialogGroupAccessType', 'plus')
            .then((value) => (newInstanceDialog.value.groupAccessType = value));

        configRepository
            .getBool('instanceDialogAgeGate', false)
            .then((value) => (newInstanceDialog.value.ageGate = value));

        configRepository
            .getString('instanceDialogDisplayName', '')
            .then((value) => (newInstanceDialog.value.displayName = value));
    }
    /**
     *
     */
    function saveNewInstanceDialog() {
        const {
            accessType,
            region,
            instanceName,
            legacyUserId,
            groupId,
            groupAccessType,
            queueEnabled,
            ageGate,
            displayName
        } = newInstanceDialog.value;

        configRepository.setString('instanceDialogAccessType', accessType);
        configRepository.setString('instanceRegion', region);
        configRepository.setString('instanceDialogInstanceName', instanceName);
        configRepository.setString(
            'instanceDialogUserId',
            legacyUserId === currentUser.value.id ? '' : legacyUserId
        );
        configRepository.setString('instanceDialogGroupId', groupId);
        configRepository.setString(
            'instanceDialogGroupAccessType',
            groupAccessType
        );
        configRepository.setBool('instanceDialogQueueEnabled', queueEnabled);
        configRepository.setBool('instanceDialogAgeGate', ageGate);
        configRepository.setString('instanceDialogDisplayName', displayName);
    }

    // --- Group role loading (shared between buildInstance & buildLegacyInstance) ---

    /**
     * @param {object} D - newInstanceDialog.value
     */
    function refreshGroupRoles(D) {
        if (D.groupId && D.groupId !== D.lastSelectedGroupId) {
            D.roleIds = [];
            const ref = cachedGroups.get(D.groupId);
            if (typeof ref !== 'undefined') {
                D.groupRef = ref;
                D.selectedGroupRoles = ref.roles;
                groupRequest
                    .getGroupRoles({
                        groupId: D.groupId
                    })
                    .then((args) => {
                        D.lastSelectedGroupId = D.groupId;
                        D.selectedGroupRoles = args.json;
                        ref.roles = args.json;
                    });
            }
        }
        if (!D.groupId) {
            D.roleIds = [];
            D.groupRef = {};
            D.selectedGroupRoles = [];
            D.lastSelectedGroupId = '';
        }
    }

    // --- Build logic ---

    /**
     *
     * @param noChanges
     */
    function updateNewInstanceDialog(noChanges) {
        const D = newInstanceDialog.value;
        if (D.instanceId) {
            D.location = `${D.worldId}:${D.instanceId}`;
        } else {
            D.location = D.worldId;
        }
        const L = parseLocation(D.location);
        if (noChanges) {
            L.shortName = D.shortName;
        } else {
            D.shortName = '';
        }
        D.url = getLaunchURL(L);
    }
    /**
     *
     */
    function buildInstance() {
        const D = newInstanceDialog.value;
        D.instanceCreated = false;
        D.instanceId = '';
        D.shortName = '';
        D.secureOrShortName = '';
        D.userId = currentUser.value.id;
        refreshGroupRoles(D);
        saveNewInstanceDialog();
    }
    /**
     *
     */
    function buildLegacyInstance() {
        const D = newInstanceDialog.value;
        D.instanceCreated = false;
        D.shortName = '';
        D.secureOrShortName = '';
        if (D.instanceName) {
            D.instanceName = D.instanceName.replace(/[^A-Za-z0-9]/g, '');
        }
        if (!D.legacyUserId) {
            D.legacyUserId = currentUser.value.id;
        }
        if (D.accessType !== 'invite' && D.accessType !== 'friends') {
            D.strict = false;
        }

        const instanceName =
            D.instanceName ||
            String((99999 * Math.random() + 1).toFixed(0)).padStart(5, '0');

        D.instanceId = buildLegacyInstanceTag({
            instanceName,
            userId: D.legacyUserId,
            accessType: D.accessType,
            groupId: D.groupId,
            groupAccessType: D.groupAccessType,
            region: D.region,
            ageGate: D.ageGate,
            strict: D.strict
        });

        refreshGroupRoles(D);
        updateNewInstanceDialog(false);
        saveNewInstanceDialog();
    }

    // --- Dialog lifecycle ---

    /**
     *
     * @param tag
     */
    async function initNewInstanceDialog(tag) {
        if (!isRealInstance(tag)) {
            return;
        }
        const D = newInstanceDialog.value;
        const L = parseLocation(tag);
        if (D.worldId === L.worldId) {
            // reopening dialog, keep last open instance
            D.visible = true;
            return;
        }
        D.worldId = L.worldId;
        D.instanceCreated = false;
        D.lastSelectedGroupId = '';
        D.selectedGroupRoles = [];
        D.groupRef = {};
        D.roleIds = [];
        D.strict = false;
        D.shortName = '';
        D.secureOrShortName = '';
        if (!isLocalUserVrcPlusSupporter.value) {
            D.displayName = '';
        }
        const args = await groupRequest.getGroupPermissions({
            userId: currentUser.value.id
        });
        handleGroupPermissions(args);
        buildInstance();
        buildLegacyInstance();
        updateNewInstanceDialog();
        D.visible = true;
    }
    /**
     *
     */
    async function handleCreateNewInstance() {
        const args = await createNewInstance(
            newInstanceDialog.value.worldId,
            newInstanceDialog.value
        );

        if (args) {
            newInstanceDialog.value.location = args.json.location;
            newInstanceDialog.value.instanceId = args.json.instanceId;
            newInstanceDialog.value.secureOrShortName =
                args.json.shortName || args.json.secureName;
            newInstanceDialog.value.instanceCreated = true;
            updateNewInstanceDialog();
        }
    }

    // --- UI handlers ---

    /**
     *
     * @param tabName
     */
    function newInstanceTabClick(tabName) {
        if (tabName === 'Normal') {
            buildInstance();
        } else {
            buildLegacyInstance();
        }
    }
    /**
     *
     * @param value
     */
    function handleRoleIdsChange(value) {
        const next = Array.isArray(value)
            ? value.map((v) => String(v ?? '')).filter(Boolean)
            : [];
        newInstanceDialog.value.roleIds = next;
        buildInstance();
    }

    // --- Init ---

    watch(
        () => locationTagRef.value,
        (value) => {
            initNewInstanceDialog(value);
        }
    );

    initializeNewInstanceDialog();

    return {
        newInstanceDialog,
        isLocalUserVrcPlusSupporter,
        buildInstance,
        buildLegacyInstance,
        updateNewInstanceDialog,
        handleCreateNewInstance,
        newInstanceTabClick,
        handleRoleIdsChange
    };
}
