import dark from '../../assets/scss/themes/theme.dark.scss?url';
import darkblue from '../../assets/scss/themes/theme.darkblue.scss?url';
import amoled from '../../assets/scss/themes/theme.amoled.scss?url';
import darkvanillaold from '../../assets/scss/themes/theme.darkvanillaold.scss?url';
import darkvanilla from '../../assets/scss/themes/theme.darkvanilla.scss?url';
import pink from '../../assets/scss/themes/theme.pink.scss?url';
import material3 from '../../assets/scss/themes/theme.material3.scss?url';

export const THEME_CONFIG = {
    system: {
        cssFile: '',
        requiresDarkBase: false,
        isDark: 'system',
        name: 'System'
    },
    light: {
        cssFile: '',
        requiresDarkBase: false,
        isDark: false,
        name: 'Light'
    },
    dark: { cssFile: dark, requiresDarkBase: true, isDark: true, name: 'Dark' },
    darkblue: {
        cssFile: darkblue,
        requiresDarkBase: true,
        isDark: true,
        name: 'Dark Blue'
    },
    amoled: {
        cssFile: amoled,
        requiresDarkBase: true,
        isDark: true,
        name: 'Amoled'
    },
    darkvanillaold: {
        cssFile: darkvanillaold,
        requiresDarkBase: true,
        isDark: true,
        name: 'Dark Vanilla Old'
    },
    darkvanilla: {
        cssFile: darkvanilla,
        requiresDarkBase: true,
        isDark: true,
        name: 'Dark Vanilla'
    },
    pink: {
        cssFile: pink,
        requiresDarkBase: true,
        isDark: true,
        name: 'Pink'
    },
    material3: {
        cssFile: material3,
        requiresDarkBase: true,
        isDark: true,
        name: 'Material 3'
    }
};
