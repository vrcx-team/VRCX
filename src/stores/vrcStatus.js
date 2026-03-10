import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import { formatDateFilter, openExternalLink } from '../shared/utils';

import webApiService from '../services/webapi';

import * as workerTimers from 'worker-timers';

export const useVrcStatusStore = defineStore('VrcStatus', () => {
    const vrcStatusApiUrl = 'https://status.vrchat.com/api/v2';

    const lastStatus = ref('');
    const lastStatusTime = ref(null);
    const lastStatusSummary = ref('');
    const lastTimeFetched = ref(0);
    const pollingInterval = ref(0);

    const statusBarServersVisible = ref(false);
    const initialized = ref(false);

    const alertRef = ref(null);
    const lastStatusText = ref('');

    const { t } = useI18n();

    const statusText = computed(() => {
        if (lastStatus.value && lastStatusSummary.value) {
            return `${lastStatus.value}: ${lastStatusSummary.value}`;
        }
        return lastStatus.value;
    });

    const hasIssue = computed(() => !!lastStatus.value);

    /**
     * @returns {void}
     */
    function dismissAlert() {
        if (!alertRef.value) {
            return;
        }
        toast.dismiss(alertRef.value);
        alertRef.value = null;
    }

    /**
     * @returns {void}
     */
    function openStatusPage() {
        openExternalLink('https://status.vrchat.com');
    }

    /**
     * @param {boolean} visible
     * @returns {void}
     */
    function setStatusBarServersVisible(visible) {
        statusBarServersVisible.value = visible;
        if (!initialized.value) {
            initialized.value = true;
        }
    }

    /**
     * @param {string} text
     * @returns {void}
     */
    function showWarningToast(text) {
        dismissAlert();
        alertRef.value = toast.warning(t('status_bar.servers_issue'), {
            description: `${formatDateFilter(lastStatusTime.value, 'short')}: ${text}`,
            duration: Infinity,
            closeButton: true,
            position: 'bottom-right',
            action: {
                label: 'Open',
                onClick: () => openStatusPage()
            }
        });
    }

    watch(statusText, (newVal) => {
        if (statusBarServersVisible.value || !initialized.value) {
            return;
        }

        if (lastStatusText.value === newVal) {
            return;
        }
        lastStatusText.value = newVal;

        if (!newVal) {
            if (alertRef.value) {
                dismissAlert();
                alertRef.value = toast.success(t('status_bar.servers_issue'), {
                    description: `${formatDateFilter(lastStatusTime.value, 'short')}: ${t('status_bar.servers_ok')}`,
                    position: 'bottom-right',
                    action: {
                        label: 'Open',
                        onClick: () => openStatusPage()
                    }
                });
            }
            return;
        }

        showWarningToast(newVal);
    });

    watch(statusBarServersVisible, (visible) => {
        if (!visible && hasIssue.value && statusText.value) {
            lastStatusText.value = '';
            showWarningToast(statusText.value);
            lastStatusText.value = statusText.value;
        }
        if (visible) {
            dismissAlert();
            lastStatusText.value = '';
        }
    });

    /**
     * @returns {Promise<void>}
     */
    async function getVrcStatus() {
        const response = await webApiService.execute({
            url: `${vrcStatusApiUrl}/status.json`,
            method: 'GET',
            headers: {
                Referer: 'https://vrcx.app'
            }
        });
        lastTimeFetched.value = Date.now();
        if (response.status !== 200) {
            console.error('Failed to fetch VRChat status', response);
            lastStatus.value = 'Failed to fetch VRC status';
            pollingInterval.value = 2 * 60 * 1000; // 2 minutes
            return;
        }
        const data = JSON.parse(response.data);
        lastStatusTime.value = new Date(data.page.updated_at);
        if (data.status.description === 'All Systems Operational') {
            lastStatus.value = '';
            pollingInterval.value = 15 * 60 * 1000; // 15 minutes
            return;
        }
        lastStatus.value = data.status.description;
        pollingInterval.value = 2 * 60 * 1000; // 2 minutes
        getVrcStatusSummary();
    }

    /**
     * @returns {Promise<void>}
     */
    async function getVrcStatusSummary() {
        const response = await webApiService.execute({
            url: `${vrcStatusApiUrl}/summary.json`,
            method: 'GET',
            headers: {
                Referer: 'https://vrcx.app'
            }
        });
        if (response.status !== 200) {
            console.error('Failed to fetch VRChat status summary', response);
            return;
        }
        const data = JSON.parse(response.data);
        let summary = '';
        for (const component of data.components) {
            if (component.status !== 'operational') {
                summary += `${component.name}, `;
            }
        }
        if (summary.endsWith(', ')) {
            summary = summary.slice(0, -2);
        }
        lastStatusSummary.value = summary;
    }

    // ran from Cef and Electron when browser is focused
    /**
     * @returns {void}
     */
    function onBrowserFocus() {
        if (Date.now() - lastTimeFetched.value > 60 * 1000) {
            getVrcStatus();
        }
    }

    /**
     * @returns {void}
     */
    function init() {
        getVrcStatus();
        workerTimers.setInterval(() => {
            if (Date.now() - lastTimeFetched.value > pollingInterval.value) {
                getVrcStatus();
            }
        }, 60 * 1000);
    }

    init();

    return {
        lastStatus,
        lastStatusTime,
        lastStatusSummary,
        statusText,
        hasIssue,
        statusBarServersVisible,
        setStatusBarServersVisible,
        openStatusPage,
        onBrowserFocus,
        getVrcStatus
    };
});
