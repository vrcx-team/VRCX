const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createAuthSessionVault } = require('../src-electron/auth-session-vault.js');

async function fixture(t, overrides = {}) {
    const root = path.join(__dirname, '../build/test-temp');
    await fs.mkdir(root, { recursive: true });
    const directory = await fs.mkdtemp(path.join(root, 'session-vault-'));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    const storage = {
        isEncryptionAvailable: () => true,
        getSelectedStorageBackend: () => 'gnome_libsecret',
        // Test cipher, deliberately not an assertion of platform crypto behavior.
        encryptString: (text) => Buffer.from(text).map((byte) => byte ^ 0x55),
        decryptString: (bytes) =>
            Buffer.from(bytes)
                .map((byte) => byte ^ 0x55)
                .toString(),
        ...overrides
    };
    const webApi = {
        ExportExternalSession: () => '[{"name":"auth","value":"test-private-session"}]',
        RestoreExternalSession: (text, userId) => JSON.stringify({ status: 'ready', userId, text })
    };
    return { directory, vault: createAuthSessionVault(directory, storage, webApi, 'linux') };
}

test('session files contain encrypted bytes and restore only through the backend', async (t) => {
    const { directory, vault } = await fixture(t);
    await vault.save('usr_test');
    const bytes = await fs.readFile(path.join(directory, 'usr_test.bin'));
    assert.equal(bytes.toString().includes('test-private-session'), false);
    const result = JSON.parse(await vault.load('usr_test'));
    assert.equal(result.status, 'ready');
    assert.equal(result.userId, 'usr_test');
    await vault.remove('usr_test');
    assert.equal(JSON.parse(await vault.load('usr_test')).status, 'reauthorize');
});

test('unavailable and basic_text secret stores never fall back to plaintext', async (t) => {
    for (const overrides of [
        { isEncryptionAvailable: () => false },
        { getSelectedStorageBackend: () => 'basic_text' }
    ]) {
        const { directory, vault } = await fixture(t, overrides);
        await assert.rejects(vault.save('usr_test'), /unavailable/);
        assert.deepEqual(await fs.readdir(directory), []);
    }
});

test('vault rejects paths in place of account IDs', async (t) => {
    const { directory, vault } = await fixture(t);
    for (const id of ['../secret', 'usr_../../secret', '/tmp/file', 'usr_test.bin']) {
        await assert.rejects(vault.save(id), /Invalid user ID/);
        await assert.rejects(vault.load(id), /Invalid user ID/);
        await assert.rejects(vault.remove(id), /Invalid user ID/);
    }
    assert.deepEqual(await fs.readdir(directory), []);
});
