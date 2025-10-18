// src/service/queueDrainer.js
// Handles draining of pre-store-init queues for IPC, GameLog, and VR init

/**
 * @typedef {object} WindowWithQueues
 * @property {any[]=} __ipcQueue
 * @property {any[]=} __gameLogQueue
 * @property {any[]=} __vrInitQueue
 */

/** @type {Window & WindowWithQueues} */
const win = window;

/**
 * @param {any} store
 */
export function drainPreInitQueues(store) {
    // Drain any queued IPC packets that arrived before stores were ready
    try {
        if (typeof window !== 'undefined') {
            if (Array.isArray(win.__ipcQueue) && store?.vrcx?.ipcEvent) {
                for (const pkt of win.__ipcQueue) {
                    try { store.vrcx.ipcEvent(pkt); } catch (e) { console.error('IPC queue drain error:', e); }
                }
                win.__ipcQueue = [];
            }
            // Drain any queued GameLog events
            if (Array.isArray(win.__gameLogQueue) && store?.gameLog?.addGameLogEvent) {
                for (const line of win.__gameLogQueue) {
                    try { store.gameLog.addGameLogEvent(line); } catch (e) { console.error('GameLog queue drain error:', e); }
                }
                win.__gameLogQueue = [];
            }
            // Drain deferred VR init triggers
            if (Array.isArray(win.__vrInitQueue) && store?.vr?.vrInit) {
                for (const arg of win.__vrInitQueue) {
                    try { store.vr.vrInit(arg); } catch (e) { console.error('VR init queue drain error:', e); }
                }
                win.__vrInitQueue = [];
            }
        }
    } catch (e) {
        console.error('Failed draining IPC queue:', e);
    }
}
