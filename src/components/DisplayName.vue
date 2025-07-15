<template>
    <span @click="showUserDialog" class="x-link">{{ username }}</span>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { userRequest } from '../api';
    import { useUserStore } from '../stores';

    const userStore = useUserStore();

    const props = defineProps({
        userid: String,
        location: String,
        forceUpdateKey: Number,
        hint: {
            type: String,
            default: ''
        }
    });

    const username = ref(props.userid);

    async function parse() {
        username.value = props.userid;
        if (props.hint) {
            username.value = props.hint;
        } else if (props.userid) {
            const args = await userRequest.getCachedUser({ userId: props.userid });
            if (args?.json?.displayName) {
                username.value = args.json.displayName;
            }
        }
    }

    function showUserDialog() {
        userStore.showUserDialog(props.userid);
    }

    watch([() => props.userid, () => props.location, () => props.forceUpdateKey], parse, { immediate: true });
</script>
