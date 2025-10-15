import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';

import { instanceRequest, inviteMessagesRequest } from '../api';
import { parseLocation } from '../shared/utils';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useGameStore } from './game';
import { useInstanceStore } from './instance';
import { useLaunchStore } from './launch';
import { watchState } from '../service/watchState';

export const useInviteStore = defineStore('Invite', () => {
    const instanceStore = useInstanceStore();
    const gameStore = useGameStore();
    const launchStore = useLaunchStore();
    const advancedSettingsStore = useAdvancedSettingsStore();

    const editInviteMessageDialog = ref({
        visible: false,
        inviteMessage: {},
        messageType: '',
        newMessage: ''
    });

    const inviteMessageTable = ref({
        data: [],
        tableProps: {
            stripe: true,
            size: 'small'
        },
        layout: 'table',
        visible: false
    });

    const inviteResponseMessageTable = ref({
        data: [],
        tableProps: {
            stripe: true,
            size: 'small'
        },
        layout: 'table',
        visible: false
    });

    const inviteRequestMessageTable = ref({
        data: [],
        tableProps: {
            stripe: true,
            size: 'small'
        },
        layout: 'table',
        visible: false
    });

    const inviteRequestResponseMessageTable = ref({
        data: [],
        tableProps: {
            stripe: true,
            size: 'small'
        },
        layout: 'table',
        visible: false
    });

    watch(
        () => watchState.isLoggedIn,
        () => {
            inviteMessageTable.value.data = [];
            inviteResponseMessageTable.value.data = [];
            inviteRequestMessageTable.value.data = [];
            inviteRequestResponseMessageTable.value.data = [];
            editInviteMessageDialog.value.visible = false;
            inviteMessageTable.value.visible = false;
            inviteResponseMessageTable.value.visible = false;
            inviteRequestMessageTable.value.visible = false;
            inviteRequestResponseMessageTable.value.visible = false;
        },
        { flush: 'sync' }
    );

    /**
     *
     * @param {string} messageType
     * @param {any} inviteMessage
     */
    function showEditInviteMessageDialog(messageType, inviteMessage) {
        const D = editInviteMessageDialog.value;
        D.newMessage = inviteMessage.message;
        D.visible = true;
        D.inviteMessage = inviteMessage;
        D.messageType = messageType;
    }

    /**
     *
     * @param {'message' | 'request' | 'response' | 'requestResponse'} mode
     */
    function refreshInviteMessageTableData(mode) {
        inviteMessagesRequest
            .refreshInviteMessageTableData(mode)
            .then(({ json }) => {
                switch (mode) {
                    case 'message':
                        inviteMessageTable.value.data = json;
                        break;
                    case 'response':
                        inviteResponseMessageTable.value.data = json;
                        break;
                    case 'request':
                        inviteRequestMessageTable.value.data = json;
                        break;
                    case 'requestResponse':
                        inviteRequestResponseMessageTable.value.data = json;
                        break;
                }
            })
            .catch((err) => {
                console.error('refreshInviteMessageTableData Failed：', err);
            });
    }

    function canOpenInstanceInGame() {
        return (
            !LINUX &&
            gameStore.isGameRunning &&
            !advancedSettingsStore.selfInviteOverride
        );
    }

    function newInstanceSelfInvite(worldId) {
        instanceStore.createNewInstance(worldId).then((args) => {
            const location = args?.json?.location;
            if (!location) {
                ElMessage({
                    message: 'Failed to create instance',
                    type: 'error'
                });
                return;
            }
            // self invite
            const L = parseLocation(location);
            if (!L.isRealInstance) {
                return;
            }
            if (canOpenInstanceInGame()) {
                const secureOrShortName =
                    args.json.shortName || args.json.secureName;
                launchStore.tryOpenInstanceInVrc(location, secureOrShortName);
                return;
            }
            instanceRequest
                .selfInvite({
                    instanceId: L.instanceId,
                    worldId: L.worldId
                })
                .then((args) => {
                    ElMessage({
                        message: 'Self invite sent',
                        type: 'success'
                    });
                    return args;
                });
        });
    }

    return {
        editInviteMessageDialog,
        inviteMessageTable,
        inviteResponseMessageTable,
        inviteRequestMessageTable,
        inviteRequestResponseMessageTable,
        showEditInviteMessageDialog,
        refreshInviteMessageTableData,
        newInstanceSelfInvite,
        canOpenInstanceInGame
    };
});
