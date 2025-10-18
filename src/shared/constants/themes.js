import amoled from '../../assets/scss/themes/theme.amoled.scss?url';
import dark from '../../assets/scss/themes/theme.dark.scss?url';
import darkblue from '../../assets/scss/themes/theme.darkblue.scss?url';
import material3 from '../../assets/scss/themes/theme.material3.scss?url';

export const THEME_CONFIG = {
    system: {
        cssFile: '',
        isDark: 'system',
        name: 'System'
    },
    light: {
        cssFile: '',
        isDark: false,
        name: 'Light'
    },
    dark: { cssFile: dark, isDark: true, name: 'Dark' },
    darkblue: {
        cssFile: darkblue,
        isDark: true,
        name: 'Dark Blue'
    },
    amoled: {
        cssFile: amoled,
        isDark: true,
        name: 'Amoled'
    },
    // darkvanillaold: {
    //     cssFile: darkvanillaold,
    //     isDark: true,
    //     name: 'Dark Vanilla Old'
    // },
    // darkvanilla: {
    //     cssFile: darkvanilla,
    //     isDark: true,
    //     name: 'Dark Vanilla'
    // },
    // pink: {
    //     cssFile: pink,
    //     isDark: true,
    //     name: 'Pink'
    // },
    material3: {
        cssFile: material3,
        isDark: true,
        name: 'Material 3'
    }
};
