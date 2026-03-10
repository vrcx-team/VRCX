import { toast } from 'vue-sonner';

import { useModalStore, useSearchStore } from '../../stores';
import { escapeTag } from './base/string';
import { i18n } from '../../plugins/i18n';

/**
 * @param {string} fileName
 * @param {*} data
 */
function downloadAndSaveJson(fileName, data) {
    if (!fileName || !data) {
        return;
    }
    try {
        const link = document.createElement('a');
        link.setAttribute(
            'href',
            `data:application/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(data, null, 2)
            )}`
        );
        link.setAttribute('download', `${fileName}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch {
        toast.error(escapeTag('Failed to download JSON.'));
    }
}

/**
 *
 * @param {string} text
 * @param {string} message
 */
function copyToClipboard(text, message = 'Copied successfully!') {
    navigator.clipboard
        .writeText(text)
        .then(() => {
            toast.success(message);
        })
        .catch((err) => {
            console.error('Copy failed:', err);
            toast.error(i18n.global.t('message.copy_failed'));
        });
}

/**
 *
 * @param {string} link
 */
function openExternalLink(link) {
    const searchStore = useSearchStore();
    if (searchStore.directAccessParse(link)) {
        return;
    }

    const modalStore = useModalStore();
    modalStore
        .confirm({
            description: `${link}`,
            title: 'Open External Link',
            confirmText: 'Open',
            cancelText: 'Copy'
        })
        .then(({ ok, reason }) => {
            if (reason === 'cancel') {
                copyToClipboard(link, 'Link copied to clipboard!');
                return;
            }
            if (ok) {
                AppApi.OpenLink(link);
                return;
            }
        });
}

function openDiscordProfile(discordId) {
    if (!discordId) {
        toast.error('No Discord ID provided!');
        return;
    }
    AppApi.OpenDiscordProfile(discordId).catch((err) => {
        console.error('Failed to open Discord profile:', err);
        toast.error('Failed to open Discord profile!');
    });
}

// #region | App: Random unsorted app methods, data structs, API functions, and an API feedback/file analysis event

function openFolderGeneric(path) {
    AppApi.OpenFolderAndSelectItem(path, true);
}

export {
    downloadAndSaveJson,
    copyToClipboard,
    openExternalLink,
    openDiscordProfile,
    openFolderGeneric
};
