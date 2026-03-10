import { TooltipWrapper } from '../components/ui/tooltip';

import AvatarInfo from '../components/AvatarInfo.vue';
import CountdownTimer from '../components/CountdownTimer.vue';
import DisplayName from '../components/DisplayName.vue';
import Location from '../components/Location.vue';
import LocationWorld from '../components/LocationWorld.vue';
import Timer from '../components/Timer.vue';

export function initComponents(app) {
    app.component('Location', Location);
    app.component('Timer', Timer);
    app.component('CountdownTimer', CountdownTimer);
    app.component('AvatarInfo', AvatarInfo);
    app.component('DisplayName', DisplayName);
    app.component('LocationWorld', LocationWorld);
    app.component('TooltipWrapper', TooltipWrapper);
}
