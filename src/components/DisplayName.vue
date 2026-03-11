<template>
    <span @click="openUserDialog" class="cursor-pointer">{{ username }}</span>
</template>

<script setup>
    import { ref, watch } from 'vue';

    import { queryRequest } from '../api';
    import { showUserDialog } from '../coordinators/userCoordinator';

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

    /**
     *
     */
    async function parse() {
        username.value = props.userid;
        if (props.hint) {
            username.value = props.hint;
        } else if (props.userid) {
            const args = await queryRequest.fetch('user.dialog', { userId: props.userid });
            if (args?.json?.displayName) {
                username.value = args.json.displayName;
            }
        }
    }

    /**
     *
     */
    function openUserDialog() {
        showUserDialog(props.userid);
    }

    watch([() => props.userid, () => props.location, () => props.forceUpdateKey], parse, { immediate: true });
</script>
