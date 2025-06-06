import configRepository from '../service/config';

async function generateHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    return hashHex;
}
const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'
].join('|');
const deviceId_catch = {}
export default async function () {
    if (deviceId_catch.deviceId) {
        return deviceId_catch.deviceId;
    }
    const deviceId = await configRepository.getString('VRCX_DEVICE_ID', '');
    if (deviceId === '') {
        const hash = await generateHash(raw);
        await configRepository.setString('VRCX_DEVICE_ID', hash);
        deviceId_catch.deviceId = hash;
        return hash;
    }
    deviceId_catch.deviceId = deviceId;
    return deviceId_catch.deviceId;
}
