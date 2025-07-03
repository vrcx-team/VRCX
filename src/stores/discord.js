import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useDiscordStore = defineStore('Discord', () => {
    const state = reactive({});

    return { state };
});
