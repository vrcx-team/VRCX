const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

// All plaintext stays between Electron's main process and the .NET API backend.
/** @param {string} directory @param {any} safeStorage @param {any} webApi @param {string} platform */
function createAuthSessionVault(directory, safeStorage, webApi, platform = process.platform) {
    function fileFor(userId) {
        if (!/^usr_[A-Za-z0-9_-]{1,80}$/.test(userId)) throw new Error('Invalid user ID.');
        return path.join(directory, `${userId}.bin`);
    }

    function requireEncryption() {
        if (
            !safeStorage.isEncryptionAvailable() ||
            (platform === 'linux' && safeStorage.getSelectedStorageBackend?.() === 'basic_text')
        ) {
            throw new Error('Secure session storage is unavailable.');
        }
    }

    return {
        async save(userId) {
            const file = fileFor(userId);
            requireEncryption();
            const plaintext = await webApi.ExportExternalSession(userId);
            const encrypted = safeStorage.encryptString(plaintext);
            await fs.mkdir(directory, { recursive: true, mode: 0o700 });
            const temp = `${file}.${crypto.randomUUID()}`;
            try {
                await fs.writeFile(temp, encrypted, { mode: 0o600, flag: 'wx' });
                await fs.rename(temp, file);
            } finally {
                await fs.rm(temp, { force: true });
            }
            return true;
        },
        async load(userId) {
            const file = fileFor(userId);
            try {
                requireEncryption();
            } catch {
                return '{"status":"unavailable","error":"storage_unavailable"}';
            }
            try {
                const encrypted = await fs.readFile(file);
                if (encrypted.length > 32768) throw new Error('Invalid session file.');
                return await webApi.RestoreExternalSession(safeStorage.decryptString(encrypted), userId);
            } catch (error) {
                return error.code === 'ENOENT'
                    ? '{"status":"reauthorize"}'
                    : '{"status":"unavailable","error":"storage_unavailable"}';
            }
        },
        async remove(userId) {
            await fs.rm(fileFor(userId), { force: true });
        }
    };
}

module.exports = { createAuthSessionVault };
