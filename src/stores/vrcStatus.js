import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import { formatDateFilter, openExternalLink } from '../shared/utils';

import webApiService from '../service/webapi';

export const useVrcStatusStore = defineStore('VrcStatus', () => {
    const vrcStatusApiUrl = 'https://status.vrchat.com/api/v2';

    const lastStatus = ref('');
    const lastStatusTime = ref(null);
    const lastStatusSummary = ref('');
    const lastTimeFetched = ref(0);
    const pollingInterval = ref(0);
    const alertRef = ref(null);
    const { t } = useI18n();

    const lastStatusText = ref('');
    const statusText = computed(() => {
        if (lastStatus.value && lastStatusSummary.value) {
            return `${lastStatus.value}: ${lastStatusSummary.value}`;
        }
        return lastStatus.value;
    });

    function dismissAlert() {
        if (!alertRef.value) {
            return;
        }
        toast.dismiss(alertRef.value);
        alertRef.value = null;
    }

    function updateAlert() {
        if (lastStatusText.value === statusText.value) {
            return;
        }
        lastStatusText.value = statusText.value;

        if (!statusText.value) {
            if (alertRef.value) {
                dismissAlert();
                alertRef.value = toast.success(t('status.title'), {
                    description: `${formatDateFilter(lastStatusTime.value, 'short')}: All Systems Operational`,
                    position: 'bottom-right',
                    action: {
                        label: 'Open',
                        onClick: () => openStatusPage()
                    }
                });
            }
            return;
        }

        dismissAlert();
        alertRef.value = toast.warning(t('status.title'), {
            description: `${formatDateFilter(lastStatusTime.value, 'short')}: ${statusText.value}`,
            duration: Infinity,
            closeButton: true,
            position: 'bottom-right',
            action: {
                label: 'Open',
                onClick: () => openStatusPage()
            }
        });
    }

    function openStatusPage() {
        openExternalLink('https://status.vrchat.com');
    }

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
            updateAlert();
            return;
        }
        const data = JSON.parse(response.data);
        lastStatusTime.value = new Date(data.page.updated_at);
        if (data.status.description === 'All Systems Operational') {
            lastStatus.value = '';
            pollingInterval.value = 15 * 60 * 1000; // 15 minutes
            updateAlert();
            return;
        }
        lastStatus.value = data.status.description;
        pollingInterval.value = 2 * 60 * 1000; // 2 minutes
        updateAlert();
        getVrcStatusSummary();
    }

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
        updateAlert();
    }

    // ran from Cef and Electron when browser is focused
    function onBrowserFocus() {
        if (Date.now() - lastTimeFetched.value > 60 * 1000) {
            getVrcStatus();
        }
    }

    function init() {
        getVrcStatus();
        setInterval(() => {
            if (Date.now() - lastTimeFetched.value > pollingInterval.value) {
                getVrcStatus();
            }
        }, 60 * 1000);
    }

    init();

    return {
        lastStatus,
        statusText,
        onBrowserFocus,
        getVrcStatus
    };
});
