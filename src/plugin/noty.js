import Noty from 'noty';

Noty.overrideDefaults({
    animation: {
        open: 'animate__animated animate__bounceInLeft',
        close: 'animate__animated animate__bounceOutLeft'
    },
    layout: 'bottomLeft',
    theme: 'mint',
    timeout: 6000
});
