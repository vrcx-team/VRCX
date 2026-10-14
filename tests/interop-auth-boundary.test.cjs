const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture() {
    const calls = [];
    class WebApi {
        ExportExternalSession(...args) {
            calls.push(['export', ...args]);
            return 'private-session';
        }
        RestoreExternalSession(...args) {
            calls.push(['restore', ...args]);
            return 'restored';
        }
        GetExternalLoginState(...args) {
            calls.push(['state', ...args]);
            return 'waiting';
        }
    }
    const source = fs.readFileSync(path.join(__dirname, '../src-electron/InteropApi.js'), 'utf8');
    const module = { exports: {} };
    vm.runInNewContext(source, {
        module,
        console: { log() {}, error() {} },
        require(name) {
            assert.equal(name, 'node-api-dotnet/net10.0');
            return { VRCX: { WebApi } };
        }
    });
    return { interop: new module.exports(), calls };
}

test('renderer bridge cannot export or restore plaintext session data', () => {
    const { interop, calls } = fixture();
    for (const method of ['ExportExternalSession', 'RestoreExternalSession']) {
        assert.throws(() => interop.callMethod('WebApi', method, ['usr_test']), /restricted/);
    }
    assert.deepEqual(calls, []);
});

test('renderer bridge still supports login status polling', () => {
    const { interop, calls } = fixture();
    assert.equal(interop.callMethod('WebApi', 'GetExternalLoginState', ['operation']), 'waiting');
    assert.deepEqual(calls, [['state', 'operation']]);
});

test('boxed names and invalid arguments cannot bypass the bridge restriction', () => {
    const { interop, calls } = fixture();
    for (const [className, methodName, args] of [
        [new String('WebApi'), 'ExportExternalSession', []],
        ['WebApi', new String('ExportExternalSession'), []],
        ['WebApi', 'GetExternalLoginState', null]
    ]) {
        assert.throws(() => interop.callMethod(className, methodName, args), /Invalid/);
    }
    assert.deepEqual(calls, []);
});

test('main-process vault retains direct backend access', () => {
    const { interop, calls } = fixture();
    const backend = interop.getDotNetObject('WebApi');
    assert.equal(backend.ExportExternalSession('usr_test'), 'private-session');
    assert.equal(backend.RestoreExternalSession('encrypted-by-vault', 'usr_test'), 'restored');
    assert.equal(calls.length, 2);
});
