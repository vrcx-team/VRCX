import { defineStore } from 'pinia';
import webApiService from '../service/webapi';
import { ref, computed } from 'vue';
import { ElNotification } from 'element-plus';
import { openExternalLink } from '../shared/utils';

export const useVrcStatusStore = defineStore('VrcStatus', () => {
    const vrcStatusApiUrl = 'https://status.vrchat.com/api/v2';

    const lastStatus = ref('');
    const lastStatusSummary = ref('');
    const lastTimeFetched = ref(0);
    const pollingInterval = ref(0);
    const alertRef = ref(null);

    const lastStatusText = ref('');
    const statusText = computed(() => {
        if (lastStatus.value && lastStatusSummary.value) {
            return `${lastStatus.value}: ${lastStatusSummary.value}`;
        }
        return lastStatus.value;
    });

    function updateAlert() {
        if (lastStatusText.value === statusText.value) {
            return;
        }
        lastStatusText.value = statusText.value;

        if (!statusText.value) {
            if (alertRef.value) {
                alertRef.value.close();
                alertRef.value = ElNotification({
                    title: 'VRChat Status',
                    message: 'All Systems Operational',
                    type: 'success',
                    duration: 0,
                    showClose: true,
                    onClick: () => {
                        openStatusPage();
                    }
                });
            }
            return;
        }

        alertRef.value?.close();
        alertRef.value = ElNotification({
            title: 'VRChat Status',
            message: statusText.value,
            type: 'warning',
            duration: 0,
            showClose: true,
            onClick: () => {
                openStatusPage();
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
        const data = JSON.parse(response.data);
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
