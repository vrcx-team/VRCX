import { defineStore } from 'pinia';
import { reactive, toRefs } from 'vue';

const initialDialogState = () => ({
    groupCalendar: false,
    noteExport: false,
    exportDiscordNames: false,
    exportFriendsList: false,
    exportAvatarsList: false,
    editInviteMessages: false,
    autoChangeStatus: false
});

export const useToolsStore = defineStore('Tools', () => {
    const dialogs = reactive(initialDialogState());

    function setDialogVisible(dialogKey, value) {
        if (!(dialogKey in dialogs)) {
            console.warn(
                `[toolsStore] Unknown dialog key "${dialogKey}" passed to setDialogVisible`
            );
            return;
        }
        dialogs[dialogKey] = value;
    }

    function openDialog(dialogKey) {
        setDialogVisible(dialogKey, true);
    }

    function closeDialog(dialogKey) {
        setDialogVisible(dialogKey, false);
    }

    function closeAllDialogs() {
        Object.keys(dialogs).forEach((dialogKey) => {
            dialogs[dialogKey] = false;
        });
    }

    return {
        ...toRefs(dialogs),
        setDialogVisible,
        openDialog,
        closeDialog,
        closeAllDialogs
    };
});
