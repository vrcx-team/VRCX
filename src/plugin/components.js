import AvatarInfo from '../components/AvatarInfo.vue';
import CountdownTimer from '../components/CountdownTimer.vue';
import DataTable from '../components/DataTable.vue';
import DisplayName from '../components/DisplayName.vue';
import InstanceInfo from '../components/InstanceInfo.vue';
import InviteYourself from '../components/InviteYourself.vue';
import LastJoin from '../components/LastJoin.vue';
import Launch from '../components/Launch.vue';
import Location from '../components/Location.vue';
import LocationWorld from '../components/LocationWorld.vue';
import NativeTooltip from '../components/NativeTooltip.vue';
import Timer from '../components/Timer.vue';

export function initComponents(app) {
    app.component('Location', Location);
    app.component('NativeTooltip', NativeTooltip);
    app.component('Timer', Timer);
    app.component('InstanceInfo', InstanceInfo);
    app.component('LastJoin', LastJoin);
    app.component('CountdownTimer', CountdownTimer);
    app.component('AvatarInfo', AvatarInfo);
    app.component('DisplayName', DisplayName);
    app.component('InviteYourself', InviteYourself);
    app.component('Launch', Launch);
    app.component('LocationWorld', LocationWorld);
    app.component('DataTable', DataTable);
}
