import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { openExternalLink } from '../shared/utils';

import webApiService from '../services/webapi';

import * as workerTimers from 'worker-timers';

export const useVrcStatusStore = defineStore('VrcStatus', () => {
    const vrcStatusApiUrl = 'https://status.vrchat.com/api/v2';

    const lastStatus = ref('');
    const lastStatusTime = ref(null);
    const lastStatusSummary = ref('');
    const lastTimeFetched = ref(0);
    const pollingInterval = ref(0);

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
    function openStatusPage() {
        openExternalLink('https://status.vrchat.com');
    }

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
        openStatusPage,
        onBrowserFocus,
        getVrcStatus
    };
});
