<template>
    <div>
        <WristOverlaySettings @open-feed-filters="showWristFeedFiltersDialog" />
        <FeedFiltersDialog v-model:feedFiltersDialogMode="feedFiltersDialogMode" />
    </div>
</template>

<script setup>
    import { ref } from 'vue';

    import FeedFiltersDialog from '../../dialogs/FeedFiltersDialog.vue';
    import WristOverlaySettings from '../WristOverlaySettings.vue';

    const feedFiltersDialogMode = ref('');

    function showWristFeedFiltersDialog() {
        feedFiltersDialogMode.value = 'wrist';
    }
</script>
