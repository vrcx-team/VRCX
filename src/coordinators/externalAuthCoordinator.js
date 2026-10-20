import { reactive } from 'vue';

export const externalLoginProviders = Object.freeze([
    { id: 'steam', label: 'Steam' },
    { id: 'meta', label: 'Meta' },
    { id: 'google', label: 'Google' },
    { id: 'apple', label: 'Apple' },
    { id: 'discord', label: 'Discord' },
    { id: 'device', label: 'QR code' }
]);

const pendingStates = new Set(['starting', 'waiting', 'validating', 'ready', 'committing', 'cancelling']);

/**
 * Owns UI lifecycle only; secrets and polling of VRChat stay in the backend.
 *
 * @param {{
 *     api: any;
 *     complete: (user: any, provider: string, remember: boolean) => Promise<void>;
 *     busy?: (value: boolean) => void;
 *     prepare?: () => Promise<void>;
 * }} options
 */
export function createExternalAuthController({ api, complete, busy = () => {}, prepare = async () => {} }) {
    const state = reactive({
        status: 'idle',
        operationId: '',
        provider: '',
        error: '',
        user: null,
        verificationUrl: '',
        expiresAt: 0,
        stage: '',
        httpStatus: null,
        responseFields: []
    });
    let generation = 0;
    let rememberSession = false;

    function apply(snapshot) {
        Object.assign(state, snapshot);
        busy(pendingStates.has(state.status));
    }

    async function start(provider, remember = false) {
        if (pendingStates.has(state.status)) return;
        if (provider !== 'device' && !externalLoginProviders.some((p) => p.id === provider)) return;
        const current = ++generation;
        rememberSession = remember;
        apply({
            status: 'starting',
            provider,
            error: '',
            user: null,
            operationId: '',
            verificationUrl: '',
            stage: '',
            httpStatus: null,
            responseFields: []
        });
        try {
            await prepare();
            if (generation !== current) return;
            const snapshot = await api.beginExternalLogin(provider);
            if (generation !== current) return;
            apply(snapshot);
            if (snapshot.status === 'ready') {
                await activate();
                return;
            }
            if (provider !== 'device' && snapshot.status === 'waiting') {
                const opened = await api.openExternalLogin(snapshot.operationId);
                if (generation !== current) return;
                if (!opened) {
                    await api.cancelExternalLogin();
                    if (generation === current) apply({ status: 'failed', error: 'browser_failed' });
                }
            }
        } catch {
            if (generation === current) {
                await api.cancelExternalLogin().catch(() => {});
                if (generation === current) apply({ status: 'failed', error: 'unavailable' });
            }
        }
    }

    async function refresh() {
        if (!state.operationId || !['waiting', 'validating', 'ready'].includes(state.status)) return;
        const current = generation;
        try {
            const snapshot = await api.getExternalLoginState(state.operationId);
            if (current === generation) {
                apply(snapshot);
                if (snapshot.status === 'ready') await activate();
            }
        } catch {
            if (current === generation) apply({ status: 'failed', error: 'unavailable' });
        }
    }

    async function cancel() {
        if (state.status === 'committing') return;
        ++generation;
        apply({ status: 'cancelling', verificationUrl: '', user: null });
        try {
            await api.cancelExternalLogin();
        } catch {
            // Invalidate local callbacks even if the backend connection has closed.
        } finally {
            apply({
                status: 'idle',
                operationId: '',
                provider: '',
                error: '',
                stage: '',
                httpStatus: null,
                responseFields: []
            });
        }
    }

    async function activate() {
        if (state.status !== 'ready' || !state.user?.id) return;
        const current = ++generation;
        const expectedId = state.user.id;
        apply({ status: 'committing' });
        try {
            const user = await api.commitExternalLogin(state.operationId);
            if (current !== generation || user.id !== expectedId) throw new Error('Account mismatch.');
            await complete(user, state.provider, rememberSession);
            apply({ status: 'completed', verificationUrl: '', operationId: '' });
        } catch {
            apply({ status: 'failed', error: 'session_failed', verificationUrl: '' });
        }
    }

    return { state, start, refresh, cancel };
}
