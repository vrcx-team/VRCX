import appCss from '../../app.css?url';
// import appLegacy from '../../assets/scss/themes/app_legacy.scss?url';
// import material3 from '../../assets/scss/themes/theme.material3.scss?url';

export const THEME_CONFIG = {
    system: {
        cssFiles: [appCss],
        isDark: 'system',
        name: 'System'
    },
    light: {
        cssFiles: [appCss],
        isDark: false,
        useDarkClass: false,
        name: 'Light'
    },
    dark: {
        cssFiles: [appCss],
        isDark: true,
        useDarkClass: true,
        name: 'Dark'
    }
    // darkold: {
    //     cssFiles: [appLegacy, dark],
    //     isDark: true,
    //     useDarkClass: false,
    //     name: 'Dark (Old)'
    // },
    // darkblue: {
    //     cssFiles: [appLegacy, darkblue],
    //     isDark: true,
    //     useDarkClass: false,
    //     name: 'Dark Blue'
    // },
    // amoled: {
    //     cssFiles: [appLegacy, amoled],
    //     isDark: true,
    //     useDarkClass: false,
    //     name: 'Amoled'
    // },
    // darkvanillaold: {
    //     cssFiles: [appLegacy, darkvanillaold],
    //     isDark: true,
    //     useDarkClass: false,
    //     name: 'Dark Vanilla Old'
    // },
    // darkvanilla: {
    //     cssFiles: [appLegacy, darkvanilla],
    //     isDark: true,
    //     useDarkClass: false,
    //     name: 'Dark Vanilla'
    // },
    // pink: {
    //     cssFiles: [appLegacy, pink],
    //     isDark: true,
    //     useDarkClass: false,
    //     name: 'Pink'
    // },
    // material3: {
    //     cssFiles: [appLegacy, material3],
    //     isDark: true,
    //     useDarkClass: false,
    //     name: 'Material 3',
    //     fontLinks: [
    //         'https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600&family=Noto+Sans+TC:wght@300;400;500&family=Noto+Sans+SC:wght@300;400;500&family=Noto+Sans+JP:wght@300;400;500&family=Roboto&display=swap',
    //         'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
    //     ]
    // }
};
