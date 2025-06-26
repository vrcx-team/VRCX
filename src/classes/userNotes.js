import { userRequest } from '../api';
import database from '../service/database.js';
import utils from '../classes/utils';
import * as workerTimers from 'worker-timers';

const userNotes = {
    lastNoteCheck: null,
    lastDbNoteDate: null,
    notes: new Map(),

    async init() {
        this.lastNoteCheck = new Date();
        this.lastDbNoteDate = null;
        this.notes.clear();
        try {
            // todo: get users from store
            const users = window.API.cachedUsers;
            const dbNotes = await database.getAllUserNotes();
            for (const note of dbNotes) {
                this.notes.set(note.userId, note.note);
                const user = users.get(note.userId);
                if (user) {
                    user.note = note.note;
                }
                if (
                    !this.lastDbNoteDate ||
                    this.lastDbNoteDate < note.createdAt
                ) {
                    this.lastDbNoteDate = note.createdAt;
                }
            }
            await this.getLatestUserNotes();
        } catch (error) {
            console.error('Error initializing user notes:', error);
        }
    },

    async getLatestUserNotes() {
        this.lastNoteCheck = new Date();
        const params = {
            offset: 0,
            n: 10 // start light
        };
        const newNotes = new Map();
        let done = false;
        try {
            for (let i = 0; i < 100; i++) {
                params.offset = i * params.n;
                const args = await userRequest.getUserNotes(params);
                for (const note of args.json) {
                    if (
                        this.lastDbNoteDate &&
                        this.lastDbNoteDate > note.createdAt
                    ) {
                        done = true;
                    }
                    if (
                        !this.lastDbNoteDate ||
                        this.lastDbNoteDate < note.createdAt
                    ) {
                        this.lastDbNoteDate = note.createdAt;
                    }
                    note.note = utils.replaceBioSymbols(note.note);
                    newNotes.set(note.targetUserId, note);
                }
                if (done || args.json.length === 0) {
                    break;
                }
                params.n = 100; // crank it after first run
                await new Promise((resolve) => {
                    workerTimers.setTimeout(resolve, 1000);
                });
            }
        } catch (error) {
            console.error('Error fetching user notes:', error);
        }
        // todo: get users from store
        const users = window.API.cachedUsers;

        for (const note of newNotes.values()) {
            const newNote = {
                userId: note.targetUserId,
                displayName: note.targetUser?.displayName || note.targetUserId,
                note: note.note,
                createdAt: note.createdAt
            };
            await database.addUserNote(newNote);
            this.notes.set(note.targetUserId, note.note);
            const user = users.get(note.targetUserId);
            if (user) {
                user.note = note.note;
            }
        }
    },

    async checkNote(userId, newNote) {
        // last check was more than than 5 minutes ago
        if (
            !this.lastNoteCheck ||
            this.lastNoteCheck.getTime() + 5 * 60 * 1000 > Date.now()
        ) {
            return;
        }
        const existingNote = this.notes.get(userId);
        if (typeof existingNote !== 'undefined' && !newNote) {
            console.log('deleting note', userId);
            this.notes.delete(userId);
            await database.deleteUserNote(userId);
            return;
        }
        if (typeof existingNote === 'undefined' || existingNote !== newNote) {
            console.log('detected note change', userId, newNote);
            await this.getLatestUserNotes();
        }
    }
};

export { userNotes };
