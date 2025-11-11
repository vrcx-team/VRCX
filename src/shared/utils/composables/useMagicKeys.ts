// stolen & adapted from https://github.com/vueuse/vueuse/blob/main/packages/core/useMagicKeys/index.ts
import {
    computed,
    reactive,
    shallowRef,
    toValue,
    getCurrentInstance,
    type ComputedRef,
    type MaybeRefOrGetter
} from 'vue';

/* -------------------------------------------------------------------------- */
/*                           Helper Implementations                           */
/* -------------------------------------------------------------------------- */

/** No-operation placeholder */
function noop() {}

/** Safe default for window */
const defaultWindow: Window | undefined =
    typeof window !== 'undefined' ? window : undefined;

/**
 * Vue-only equivalent of useEventListener from VueUse.
 * Automatically unwraps refs and cleans up on unmount.
 */
function useEventListener(
    target: MaybeRefOrGetter<EventTarget | null | undefined>,
    event: string,
    listener: (evt: Event) => void,
    options?: boolean | AddEventListenerOptions
) {
    const el = toValue(target) ?? defaultWindow;
    if (!el) return noop;

    el.addEventListener(event, listener, options);
    const cleanup = () => el.removeEventListener(event, listener, options);

    // If inside a component, cleanup on unmount
    if (typeof window !== 'undefined') {
        // best effort cleanup hook
        const vm = (getCurrentInstance?.() as any)?.proxy;
        vm?.$onUnmounted?.(cleanup);
    }

    return cleanup;
}

export const DefaultMagicKeysAliasMap: Record<string, string> = {
    ctrl: 'control',
    cmd: 'meta',
    option: 'alt',
    esc: 'escape',
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
    plus: '+',
    minus: '-'
};

/* -------------------------------------------------------------------------- */
/*                              Type Declarations                             */
/* -------------------------------------------------------------------------- */

export interface UseMagicKeysOptions<Reactive extends boolean> {
    reactive?: Reactive;
    target?: MaybeRefOrGetter<EventTarget>;
    aliasMap?: Record<string, string>;
    passive?: boolean;
    exactMatch?: boolean;
    onEventFired?: (e: KeyboardEvent) => void | boolean;
}

export interface MagicKeysInternal {
    current: Set<string>;
}

export type UseMagicKeysReturn<Reactive extends boolean> = Readonly<
    Record<string, Reactive extends true ? boolean : ComputedRef<boolean>> &
        MagicKeysInternal
>;

/* -------------------------------------------------------------------------- */
/*                               useMagicKeys()                               */
/* -------------------------------------------------------------------------- */

export function useMagicKeys<T extends boolean = false>(
    options: UseMagicKeysOptions<T> = {}
): UseMagicKeysReturn<T> {
    const {
        reactive: useReactive = false,
        target = defaultWindow,
        aliasMap = DefaultMagicKeysAliasMap,
        passive = true,
        exactMatch = false,
        onEventFired = noop
    } = options;

    const current = reactive(new Set<string>());
    const obj = {
        toJSON() {
            return {};
        },
        current
    };

    const refs: Record<string, any> = useReactive ? reactive(obj) : obj;
    const metaDeps = new Set<string>();
    const depsMap = new Map<string, Set<string>>([
        ['Meta', metaDeps],
        ['Shift', new Set<string>()],
        ['Alt', new Set<string>()]
    ]);
    const usedKeys = new Set<string>();

    function setRefs(key: string, value: boolean) {
        if (key in refs) {
            if (useReactive) refs[key] = value;
            else refs[key].value = value;
        }
    }

    function reset() {
        current.clear();
        for (const key of usedKeys) setRefs(key, false);
    }

    function updateDeps(value: boolean, e: KeyboardEvent, keys: string[]) {
        if (!value || typeof e.getModifierState !== 'function') return;
        for (const [modifier, depsSet] of depsMap) {
            if (e.getModifierState(modifier)) {
                keys.forEach((key) => depsSet.add(key));
                break;
            }
        }
    }

    function clearDeps(value: boolean, key: string) {
        if (value) return;
        const depsMapKey = `${key[0].toUpperCase()}${key.slice(1)}`;
        const deps = depsMap.get(depsMapKey);
        if (!['shift', 'alt'].includes(key) || !deps) return;

        const depsArray = Array.from(deps);
        const depsIndex = depsArray.indexOf(key);
        depsArray.forEach((depKey, index) => {
            if (index >= depsIndex) {
                current.delete(depKey);
                setRefs(depKey, false);
            }
        });
        deps.clear();
    }

    function updateRefs(e: KeyboardEvent, value: boolean) {
        const key = e.key?.toLowerCase();
        const code = e.code?.toLowerCase();
        const values = [code, key].filter(Boolean) as string[];

        if (key) {
            if (value) current.add(key);
            else current.delete(key);
        }

        for (const val of values) {
            usedKeys.add(val);
            setRefs(val, value);
        }

        updateDeps(value, e, [...current, ...values]);
        clearDeps(value, key!);

        // macOS Meta key bug fix
        if (key === 'meta' && !value) {
            metaDeps.forEach((depKey) => {
                current.delete(depKey);
                setRefs(depKey, false);
            });
            metaDeps.clear();
        }
    }

    useEventListener(
        target,
        'keydown',
        (e: KeyboardEvent) => {
            updateRefs(e, true);
            return onEventFired(e);
        },
        { passive }
    );

    useEventListener(
        target,
        'keyup',
        (e: KeyboardEvent) => {
            updateRefs(e, false);
            return onEventFired(e);
        },
        { passive }
    );

    useEventListener(defaultWindow, 'blur', reset, { passive });
    useEventListener(defaultWindow, 'focus', reset, { passive });

    const proxy = new Proxy(refs, {
        get(target, prop, rec) {
            if (typeof prop !== 'string') return Reflect.get(target, prop, rec);
            let name = prop.toLowerCase();

            if (name in aliasMap) name = aliasMap[name];

            if (!(name in refs)) {
                if (/[+_-]/.test(name)) {
                    const keys = name
                        .split(/[+_-]/g)
                        .map((i) => i.trim())
                        .map((k) => aliasMap[k] || k);
                    refs[name] = computed(() => {
                        const comboPressed = keys
                            .map((k) => toValue(proxy[k]))
                            .every(Boolean);

                        if (exactMatch) {
                            if (!comboPressed) return false;

                            // disallow any other pressed key
                            // normalize keys to lowercase to match `current`
                            const pressedKeys = Array.from(current).map((k) =>
                                k.toLowerCase()
                            );

                            const extraPressed = pressedKeys.some(
                                (k) => !keys.includes(k)
                            );

                            return !extraPressed;
                        } else {
                            return comboPressed;
                        }
                    });
                } else {
                    refs[name] = shallowRef(false);
                }
            }

            const r = Reflect.get(target, name, rec);
            return useReactive ? toValue(r) : r;
        }
    });

    return proxy as UseMagicKeysReturn<T>;
}
