import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const applyThemeColor = vi.fn(() => Promise.resolve());
const initThemeColor = vi.fn(() => Promise.resolve());

vi.mock('@/shared/utils/base/ui', () => ({
    useThemeColor: () => ({
        themeColors: ref([{ key: 'blue', label: 'Blue', swatch: '#00f' }]),
        currentThemeColor: ref('blue'),
        isApplyingThemeColor: ref(false),
        applyThemeColor,
        initThemeColor
    })
}));

import { useNavTheme } from '../useNavTheme';

describe('useNavTheme', () => {
    it('updates theme mode and table density through appearance store', () => {
        const setThemeMode = vi.fn();
        const setTableDensity = vi.fn();
        const toggleThemeMode = vi.fn();

        const { handleThemeSelect, handleTableDensitySelect, handleThemeToggle } = useNavTheme({
            t: (key) => key,
            appearanceSettingsStore: {
                setThemeMode,
                setTableDensity,
                toggleThemeMode
            }
        });

        handleThemeSelect('dark');
        handleTableDensitySelect('compact');
        handleThemeToggle();

        expect(setThemeMode).toHaveBeenCalledWith('dark');
        expect(setTableDensity).toHaveBeenCalledWith('compact');
        expect(toggleThemeMode).toHaveBeenCalledTimes(1);
    });

    it('forwards theme color apply request', async () => {
        const { handleThemeColorSelect } = useNavTheme({
            t: (key) => key,
            appearanceSettingsStore: {
                setThemeMode: vi.fn(),
                setTableDensity: vi.fn(),
                toggleThemeMode: vi.fn()
            }
        });

        await handleThemeColorSelect({ key: 'blue' });

        expect(applyThemeColor).toHaveBeenCalledWith('blue');
    });
});
