import Noty from 'noty';

export function initNoty(isVrOverlay = false) {
    if (isVrOverlay) {
        Noty.overrideDefaults({
            animation: {
                open: 'animate__animated animate__fadeIn',
                close: 'animate__animated animate__zoomOut'
            },
            layout: 'topCenter',
            theme: 'relax',
            timeout: 3000
        });
    } else {
        Noty.overrideDefaults({
            animation: {
                open: 'animate__animated animate__bounceInLeft',
                close: 'animate__animated animate__bounceOutLeft'
            },
            layout: 'bottomLeft',
            theme: 'mint',
            timeout: 2000
        });
    }
}
