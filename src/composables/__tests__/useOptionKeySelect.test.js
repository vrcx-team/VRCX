import { describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useOptionKeySelect } from '../useOptionKeySelect';

const OPTIONS = {
    alphabetical: { value: 'alphabetical', name: 'sort.alphabetical' },
    members: { value: 'members', name: 'sort.members' },
    recent: { value: 'recent', name: 'sort.recent' }
};

describe('useOptionKeySelect', () => {
    describe('selectedKey', () => {
        test('returns the key when current value is an exact reference match', () => {
            const current = ref(OPTIONS.members);
            const { selectedKey } = useOptionKeySelect(
                OPTIONS,
                () => current.value,
                vi.fn()
            );
            expect(selectedKey.value).toBe('members');
        });

        test('returns the key when matching by value property', () => {
            const current = ref({
                value: 'alphabetical',
                name: 'sort.alphabetical'
            });
            const { selectedKey } = useOptionKeySelect(
                OPTIONS,
                () => current.value,
                vi.fn()
            );
            expect(selectedKey.value).toBe('alphabetical');
        });

        test('returns the key when matching by name property only', () => {
            const current = ref({ value: 'different', name: 'sort.recent' });
            const { selectedKey } = useOptionKeySelect(
                OPTIONS,
                () => current.value,
                vi.fn()
            );
            expect(selectedKey.value).toBe('recent');
        });

        test('returns empty string when no match is found', () => {
            const current = ref({ value: 'unknown', name: 'sort.unknown' });
            const { selectedKey } = useOptionKeySelect(
                OPTIONS,
                () => current.value,
                vi.fn()
            );
            expect(selectedKey.value).toBe('');
        });

        test('returns empty string when current value is null', () => {
            const { selectedKey } = useOptionKeySelect(
                OPTIONS,
                () => null,
                vi.fn()
            );
            expect(selectedKey.value).toBe('');
        });

        test('returns empty string when current value is undefined', () => {
            const { selectedKey } = useOptionKeySelect(
                OPTIONS,
                () => undefined,
                vi.fn()
            );
            expect(selectedKey.value).toBe('');
        });

        test('is reactive to changes in the getter', () => {
            const current = ref(OPTIONS.alphabetical);
            const { selectedKey } = useOptionKeySelect(
                OPTIONS,
                () => current.value,
                vi.fn()
            );
            expect(selectedKey.value).toBe('alphabetical');

            current.value = OPTIONS.recent;
            expect(selectedKey.value).toBe('recent');
        });

        test('returns the first matching key when multiple options could match', () => {
            const dupeOptions = {
                first: { value: 'shared', name: 'sort.shared' },
                second: { value: 'shared', name: 'sort.shared' }
            };
            const current = ref({ value: 'shared', name: 'sort.shared' });
            const { selectedKey } = useOptionKeySelect(
                dupeOptions,
                () => current.value,
                vi.fn()
            );
            expect(selectedKey.value).toBe('first');
        });
    });

    describe('selectByKey', () => {
        test('calls onSelect with the correct option when key exists', () => {
            const onSelect = vi.fn();
            const { selectByKey } = useOptionKeySelect(
                OPTIONS,
                () => null,
                onSelect
            );

            selectByKey('members');
            expect(onSelect).toHaveBeenCalledWith(OPTIONS.members);
        });

        test('does not call onSelect when key does not exist', () => {
            const onSelect = vi.fn();
            const { selectByKey } = useOptionKeySelect(
                OPTIONS,
                () => null,
                onSelect
            );

            selectByKey('nonexistent');
            expect(onSelect).not.toHaveBeenCalled();
        });

        test('does not call onSelect when key is empty string', () => {
            const onSelect = vi.fn();
            const { selectByKey } = useOptionKeySelect(
                OPTIONS,
                () => null,
                onSelect
            );

            selectByKey('');
            expect(onSelect).not.toHaveBeenCalled();
        });

        test('passes the full option object, not just the value', () => {
            const onSelect = vi.fn();
            const { selectByKey } = useOptionKeySelect(
                OPTIONS,
                () => null,
                onSelect
            );

            selectByKey('recent');
            expect(onSelect).toHaveBeenCalledWith({
                value: 'recent',
                name: 'sort.recent'
            });
        });
    });

    describe('edge cases', () => {
        test('works with empty options map', () => {
            const onSelect = vi.fn();
            const { selectedKey, selectByKey } = useOptionKeySelect(
                {},
                () => null,
                onSelect
            );
            expect(selectedKey.value).toBe('');

            selectByKey('anything');
            expect(onSelect).not.toHaveBeenCalled();
        });

        test('works with numeric keys in options map', () => {
            const numericOptions = {
                0: { value: 'zero', name: 'sort.zero' },
                1: { value: 'one', name: 'sort.one' }
            };
            const current = ref(numericOptions[1]);
            const { selectedKey } = useOptionKeySelect(
                numericOptions,
                () => current.value,
                vi.fn()
            );
            expect(selectedKey.value).toBe('1');
        });

        test('handles option with missing value property gracefully', () => {
            const partialOptions = {
                noValue: { name: 'sort.noValue' }
            };
            const current = ref({ name: 'sort.noValue' });
            const { selectedKey } = useOptionKeySelect(
                partialOptions,
                () => current.value,
                vi.fn()
            );
            expect(selectedKey.value).toBe('noValue');
        });
    });
});
