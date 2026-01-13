import { defineStore } from 'pinia';
import { i18n } from '@/plugin';
import { ref } from 'vue';

function translate(key, fallback) {
    try {
        return i18n.global.t(key);
    } catch {
        return fallback;
    }
}

/**
 * @typedef {Object} ConfirmResult
 * @property {boolean} ok
 * @property {'ok' | 'cancel' | 'dismiss' | 'replaced'} reason
 */

/**
 * @typedef {Object} ConfirmOptions
 * @property {string} title
 * @property {string} description
 * @property {string=} confirmText
 * @property {string=} cancelText
 * @property {boolean=} dismissible  // true: allow esc/outside, false: block
 */

/**
 * @typedef {Object} AlertOptions
 * @property {string} title
 * @property {string} description
 * @property {string=} confirmText
 * @property {boolean=} dismissible
 */

// TODO: Method chains for confirm

export const useModalStore = defineStore('Modal', () => {
    const alertOpen = ref(false);
    const alertMode = ref('confirm'); // 'confirm' | 'alert'
    const alertTitle = ref('');
    const alertDescription = ref('');
    const alertOkText = ref('');
    const alertCancelText = ref('');
    const alertDismissible = ref(true);

    /** @type {{ resolve: ((result: ConfirmResult) => void) | null } | null} */
    let pending = null;

    function closeDialog() {
        alertOpen.value = false;
    }

    /**
     * @param {'ok' | 'cancel' | 'dismiss' | 'replaced'} reason
     */
    function finish(reason) {
        const resolve = pending?.resolve;
        pending = null;
        closeDialog();
        if (resolve) resolve({ ok: reason === 'ok', reason });
    }

    /**
     * @param {'ok' | 'cancel' | 'dismiss' | 'replaced'} reason
     */
    function finishWithoutClosing(reason) {
        const resolve = pending?.resolve;
        pending = null;
        if (resolve) resolve({ ok: reason === 'ok', reason });
    }

    /**
     * @param {'confirm' | 'alert'} mode
     * @param {any} options
     */
    function openBase(mode, options) {
        if (pending) {
            // old dialog is force-finished
            // do not call closeDialog here because we are about to open a new one
            finishWithoutClosing('replaced');
        }

        alertMode.value = mode;
        alertTitle.value = options.title;
        alertDescription.value = options.description;
        alertDismissible.value = options.dismissible !== false;

        if (mode === 'alert') {
            alertOkText.value =
                options.confirmText || translate('dialog.alertdialog.ok', 'OK');
            alertCancelText.value = '';
        } else {
            alertOkText.value =
                options.confirmText ||
                translate('dialog.alertdialog.confirm', 'Confirm');
            alertCancelText.value =
                options.cancelText ||
                translate('dialog.alertdialog.cancel', 'Cancel');
        }

        alertOpen.value = true;

        return new Promise((resolve) => {
            pending = { resolve };
        });
    }

    /**
     * confirm: always resolve({ok, reason})
     * @param {ConfirmOptions} options
     * @returns {Promise<ConfirmResult>}
     */
    function confirm(options) {
        return openBase('confirm', options);
    }

    /**
     * alert: always resolve({ok:true, reason:'ok'}) when closed
     * @param {AlertOptions} options
     * @returns {Promise<ConfirmResult>}
     */
    function alert(options) {
        return openBase('alert', options);
    }

    function handleOk() {
        if (!pending) return;
        finish('ok');
    }

    function handleCancel() {
        if (!pending) return;

        // alert has no cancel semantics
        if (alertMode.value === 'alert') {
            finish('ok');
            return;
        }

        finish('cancel');
    }

    function handleDismiss() {
        if (!pending) return;
        if (!alertDismissible.value) return;

        // alert: dismiss also means done
        if (alertMode.value === 'alert') {
            finish('ok');
            return;
        }

        finish('dismiss');
    }

    function setAlertOpen(open) {
        alertOpen.value = !!open;
    }

    return {
        alertOpen,
        alertMode,
        alertTitle,
        alertDescription,
        alertOkText,
        alertCancelText,
        alertDismissible,

        confirm,
        alert,

        handleOk,
        handleCancel,
        handleDismiss,
        setAlertOpen
    };
});
