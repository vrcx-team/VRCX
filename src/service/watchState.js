import { reactive } from 'vue';
const watchState = reactive({
    isLoggedIn: false,
    isFriendsLoaded: false
});

export { watchState };
