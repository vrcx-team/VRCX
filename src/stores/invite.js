import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import { instanceRequest, inviteMessagesRequest } from '../api';
import { $app } from '../app';
import { watchState } from '../service/watchState';
import { parseLocation } from '../shared/utils';
import { useInstanceStore } from './instance';
import { useGameStore } from './game';
import { useLaunchStore } from './launch';
import { useAdvancedSettingsStore } from './settings/advanced';

export const useInviteStore = defineStore('Invite', () => {
    const instanceStore = useInstanceStore();
    const gameStore = useGameStore();
    const launchStore = useLaunchStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const state = reactive({
        editInviteMessageDialog: {
            visible: false,
            inviteMessage: {},
            messageType: '',
            newMessage: ''
        },
        inviteMessageTable: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            layout: 'table',
            visible: false
        },
        inviteResponseMessageTable: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            layout: 'table',
            visible: false
        },
        inviteRequestMessageTable: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            layout: 'table',
            visible: false
        },
        inviteRequestResponseMessageTable: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            layout: 'table',
            visible: false
        }
    });

    watch(
        () => watchState.isLoggedIn,
        () => {
            state.inviteMessageTable.data = [];
            state.inviteResponseMessageTable.data = [];
            state.inviteRequestMessageTable.data = [];
            state.inviteRequestResponseMessageTable.data = [];
            state.editInviteMessageDialog.visible = false;
            state.inviteMessageTable.visible = false;
            state.inviteResponseMessageTable.visible = false;
            state.inviteRequestMessageTable.visible = false;
            state.inviteRequestResponseMessageTable.visible = false;
        },
        { flush: 'sync' }
    );

    const editInviteMessageDialog = computed({
        get: () => state.editInviteMessageDialog,
        set: (value) => {
            state.editInviteMessageDialog = value;
        }
    });

    const inviteMessageTable = computed({
        get: () => state.inviteMessageTable,
        set: (value) => {
            state.inviteMessageTable = value;
        }
    });

    const inviteResponseMessageTable = computed({
        get: () => state.inviteResponseMessageTable,
        set: (value) => {
            state.inviteResponseMessageTable = value;
        }
    });

    const inviteRequestMessageTable = computed({
        get: () => state.inviteRequestMessageTable,
        set: (value) => {
            state.inviteRequestMessageTable = value;
        }
    });

    const inviteRequestResponseMessageTable = computed({
        get: () => state.inviteRequestResponseMessageTable,
        set: (value) => {
            state.inviteRequestResponseMessageTable = value;
        }
    });

    /**
     *
     * @param {string} messageType
     * @param {any} inviteMessage
     */
    function showEditInviteMessageDialog(messageType, inviteMessage) {
        const D = state.editInviteMessageDialog;
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
                        state.inviteMessageTable.data = json;
                        break;
                    case 'response':
                        state.inviteResponseMessageTable.data = json;
                        break;
                    case 'request':
                        state.inviteRequestMessageTable.data = json;
                        break;
                    case 'requestResponse':
                        state.inviteRequestResponseMessageTable.data = json;
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
                $app.$message({
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
                    $app.$message({
                        message: 'Self invite sent',
                        type: 'success'
                    });
                    return args;
                });
        });
    }

    return {
        state,
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
