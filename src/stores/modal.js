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

/**
 * @typedef {Object} PromptResult
 * @property {boolean} ok
 * @property {'ok' | 'cancel' | 'dismiss' | 'replaced'} reason
 * @property {string} value
 */

/**
 * @typedef {Object} PromptOptions
 * @property {string} title
 * @property {string} description
 * @property {string=} confirmText
 * @property {string=} cancelText
 * @property {string=} inputValue
 * @property {string=} inputType
 * @property {RegExp | string=} pattern
 * @property {string=} errorMessage
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

    const promptOpen = ref(false);
    const promptTitle = ref('');
    const promptDescription = ref('');
    const promptOkText = ref('');
    const promptCancelText = ref('');
    const promptDismissible = ref(true);
    const promptInputValue = ref('');
    const promptInputType = ref('text');
    const promptPattern = ref(null);
    const promptErrorMessage = ref('');

    /** @type {{ resolve: ((result: ConfirmResult) => void) | null } | null} */
    let pending = null;
    /** @type {{ resolve: ((result: PromptResult) => void) | null } | null} */
    let pendingPrompt = null;

    function closeDialog() {
        alertOpen.value = false;
    }

    function closePromptDialog() {
        promptOpen.value = false;
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
     * @param {'ok' | 'cancel' | 'dismiss' | 'replaced'} reason
     * @param {string} value
     */
    function finishPrompt(reason, value) {
        const resolve = pendingPrompt?.resolve;
        pendingPrompt = null;
        closePromptDialog();
        if (resolve) resolve({ ok: reason === 'ok', reason, value });
    }

    /**
     * @param {'ok' | 'cancel' | 'dismiss' | 'replaced'} reason
     * @param {string} value
     */
    function finishPromptWithoutClosing(reason, value) {
        const resolve = pendingPrompt?.resolve;
        pendingPrompt = null;
        if (resolve) resolve({ ok: reason === 'ok', reason, value });
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
     * @param {PromptOptions} options
     * @returns {Promise<PromptResult>}
     */
    function openPrompt(options) {
        if (pendingPrompt) {
            finishPromptWithoutClosing('replaced', promptInputValue.value);
        }

        const inputValue = options.inputValue ?? '';
        const inputValueCopy =
            typeof inputValue === 'string'
                ? inputValue.slice()
                : String(inputValue);

        promptTitle.value = options.title;
        promptDescription.value = options.description;
        promptDismissible.value = options.dismissible !== false;
        promptInputValue.value = inputValueCopy;
        promptInputType.value = options.inputType || 'text';
        promptPattern.value = options.pattern ?? null;
        promptErrorMessage.value =
            options.errorMessage ||
            translate('dialog.prompt.input_invalid', '输入错误');

        promptOkText.value =
            options.confirmText ||
            translate('dialog.alertdialog.confirm', 'Confirm');
        promptCancelText.value =
            options.cancelText ||
            translate('dialog.alertdialog.cancel', 'Cancel');

        promptOpen.value = true;

        return new Promise((resolve) => {
            pendingPrompt = { resolve };
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

    /**
     * prompt: always resolve({ok, reason, value})
     * @param {PromptOptions} options
     * @returns {Promise<PromptResult>}
     */
    function prompt(options) {
        return openPrompt(options);
    }

    function handleOk() {
        if (!pending) return;
        finish('ok');
    }

    function handlePromptOk(value) {
        if (!pendingPrompt) return;
        finishPrompt('ok', value ?? '');
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

    function handlePromptCancel(value) {
        if (!pendingPrompt) return;
        finishPrompt('cancel', value ?? '');
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

    function handlePromptDismiss(value) {
        if (!pendingPrompt) return;
        if (!promptDismissible.value) return;
        finishPrompt('dismiss', value ?? '');
    }

    function setAlertOpen(open) {
        alertOpen.value = !!open;
    }

    function setPromptOpen(open) {
        promptOpen.value = !!open;
    }

    return {
        alertOpen,
        alertMode,
        alertTitle,
        alertDescription,
        alertOkText,
        alertCancelText,
        alertDismissible,
        promptOpen,
        promptTitle,
        promptDescription,
        promptOkText,
        promptCancelText,
        promptDismissible,
        promptInputValue,
        promptInputType,
        promptPattern,
        promptErrorMessage,

        confirm,
        alert,
        prompt,

        handleOk,
        handleCancel,
        handleDismiss,
        handlePromptOk,
        handlePromptCancel,
        handlePromptDismiss,
        setAlertOpen,
        setPromptOpen
    };
});
