vi.mock('../../../views/Feed/Feed.vue', () => ({
    default: {}
}));
vi.mock('../../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../../plugins/router', () => ({
    default: { push: vi.fn() }
}));

import { buildLegacyInstanceTag } from '../instance';

const base = {
    instanceName: '12345',
    userId: 'usr_test',
    accessType: 'public',
    region: 'US West'
};

describe('buildLegacyInstanceTag', () => {
    test('public instance with US West region', () => {
        expect(buildLegacyInstanceTag(base)).toBe('12345~region(us)');
    });

    test('public instance with US East region', () => {
        expect(buildLegacyInstanceTag({ ...base, region: 'US East' })).toBe(
            '12345~region(use)'
        );
    });

    test('public instance with Europe region', () => {
        expect(buildLegacyInstanceTag({ ...base, region: 'Europe' })).toBe(
            '12345~region(eu)'
        );
    });

    test('public instance with Japan region', () => {
        expect(buildLegacyInstanceTag({ ...base, region: 'Japan' })).toBe(
            '12345~region(jp)'
        );
    });

    test('friends+ adds hidden tag', () => {
        expect(
            buildLegacyInstanceTag({ ...base, accessType: 'friends+' })
        ).toBe('12345~hidden(usr_test)~region(us)');
    });

    test('friends adds friends tag', () => {
        expect(buildLegacyInstanceTag({ ...base, accessType: 'friends' })).toBe(
            '12345~friends(usr_test)~region(us)'
        );
    });

    test('invite adds private tag and canRequestInvite', () => {
        expect(buildLegacyInstanceTag({ ...base, accessType: 'invite+' })).toBe(
            '12345~private(usr_test)~canRequestInvite~region(us)'
        );
    });

    test('invite (no +) adds private tag without canRequestInvite', () => {
        expect(buildLegacyInstanceTag({ ...base, accessType: 'invite' })).toBe(
            '12345~private(usr_test)~region(us)'
        );
    });

    test('group adds group and groupAccessType tags', () => {
        expect(
            buildLegacyInstanceTag({
                ...base,
                accessType: 'group',
                groupId: 'grp_abc',
                groupAccessType: 'plus'
            })
        ).toBe('12345~group(grp_abc)~groupAccessType(plus)~region(us)');
    });

    test('group with ageGate appends ~ageGate', () => {
        expect(
            buildLegacyInstanceTag({
                ...base,
                accessType: 'group',
                groupId: 'grp_abc',
                groupAccessType: 'members',
                ageGate: true
            })
        ).toBe(
            '12345~group(grp_abc)~groupAccessType(members)~ageGate~region(us)'
        );
    });

    test('ageGate ignored for non-group access types', () => {
        expect(buildLegacyInstanceTag({ ...base, ageGate: true })).toBe(
            '12345~region(us)'
        );
    });

    test('strict appended for invite access type', () => {
        expect(
            buildLegacyInstanceTag({
                ...base,
                accessType: 'invite',
                strict: true
            })
        ).toBe('12345~private(usr_test)~region(us)~strict');
    });

    test('strict appended for friends access type', () => {
        expect(
            buildLegacyInstanceTag({
                ...base,
                accessType: 'friends',
                strict: true
            })
        ).toBe('12345~friends(usr_test)~region(us)~strict');
    });

    test('strict ignored for public access type', () => {
        expect(buildLegacyInstanceTag({ ...base, strict: true })).toBe(
            '12345~region(us)'
        );
    });

    test('strict ignored for friends+ access type', () => {
        expect(
            buildLegacyInstanceTag({
                ...base,
                accessType: 'friends+',
                strict: true
            })
        ).toBe('12345~hidden(usr_test)~region(us)');
    });

    test('empty instanceName produces no leading segment', () => {
        expect(buildLegacyInstanceTag({ ...base, instanceName: '' })).toBe(
            '~region(us)'
        );
    });

    test('unknown region produces no region tag', () => {
        expect(buildLegacyInstanceTag({ ...base, region: 'Mars' })).toBe(
            '12345'
        );
    });
});
