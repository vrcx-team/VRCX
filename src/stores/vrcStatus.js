import { defineStore } from 'pinia';
import webApiService from '../service/webapi';
import { ref } from 'vue';

export const useVrcStatusStore = defineStore('VrcStatus', () => {
    const vrcStatusApiUrl = 'https://status.vrchat.com/api/v2';

    const lastStatus = ref('');
    const lastTimeFetched = ref(0);
    const isAlertClosed = ref(false);
    const pollingInterval = ref(0);

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
            return;
        }
        lastStatus.value = data.status.description;
        pollingInterval.value = 2 * 60 * 1000; // 2 minutes
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
            if (isAlertClosed.value) {
                return;
            }
            if (Date.now() - lastTimeFetched.value > pollingInterval.value) {
                getVrcStatus();
            }
        }, 60 * 1000);
    }

    init();

    return {
        lastStatus,
        isAlertClosed,
        onBrowserFocus,
        getVrcStatus
    };
});
