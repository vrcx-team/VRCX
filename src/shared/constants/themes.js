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
        name: 'Material 3',
        fontLinks: [
            'https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600&family=Noto+Sans+TC:wght@300;400;500&family=Noto+Sans+SC:wght@300;400;500&family=Noto+Sans+JP:wght@300;400;500&family=Roboto&display=swap',
            'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
        ]
    }
};
