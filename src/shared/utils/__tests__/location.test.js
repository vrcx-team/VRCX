import { parseLocation, displayLocation } from '../location';

describe('Location Utils', () => {
    describe('parseLocation', () => {
        test('parses simple world ID', () => {
            const worldId = 'wrld_12345678-1234-1234-1234-123456789012';
            const result = parseLocation(worldId);
            expect(result.worldId).toBe(worldId);
            expect(result.instanceId).toBe('');
            expect(result.isOffline).toBe(false);
            expect(result.isPrivate).toBe(false);
            expect(result.isTraveling).toBe(false);
            expect(result.isRealInstance).toBe(true);
            expect(result.accessType).toBe(''); // No instance means no access type
        });

        test('parses world with basic instance', () => {
            const location = 'wrld_12345:67890';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.instanceId).toBe('67890');
            expect(result.instanceName).toBe('67890');
            expect(result.accessType).toBe('public');
            expect(result.isRealInstance).toBe(true);
        });

        test('parses instance with region', () => {
            const location = 'wrld_12345:67890~region(us)';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.instanceId).toBe('67890~region(us)');
            expect(result.instanceName).toBe('67890');
            expect(result.region).toBe('us');
            expect(result.accessType).toBe('public');
        });

        test('parses private instance', () => {
            const location = 'wrld_12345:instance~private(usr_12345)';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.accessType).toBe('invite');
            expect(result.privateId).toBe('usr_12345');
            expect(result.userId).toBe('usr_12345');
            expect(result.canRequestInvite).toBe(false);
        });

        test('parses invite+ instance', () => {
            const location =
                'wrld_12345:instance~private(usr_12345)~canRequestInvite';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.accessType).toBe('invite+');
            expect(result.privateId).toBe('usr_12345');
            expect(result.userId).toBe('usr_12345');
            expect(result.canRequestInvite).toBe(true);
        });

        test('parses friends only instance', () => {
            const location = 'wrld_12345:instance~friends(usr_67890)';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.accessType).toBe('friends');
            expect(result.friendsId).toBe('usr_67890');
            expect(result.userId).toBe('usr_67890');
        });

        test('parses friends+ instance', () => {
            const location = 'wrld_12345:instance~hidden(usr_99999)';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.accessType).toBe('friends+');
            expect(result.hiddenId).toBe('usr_99999');
            expect(result.userId).toBe('usr_99999');
        });

        test('parses group instance', () => {
            const location = 'wrld_12345:instance~group(grp_12345)';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.accessType).toBe('group');
            expect(result.groupId).toBe('grp_12345');
            expect(result.accessTypeName).toBe('group');
        });

        test('parses group public instance', () => {
            const location =
                'wrld_12345:instance~group(grp_12345)~groupAccessType(public)';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.accessType).toBe('group');
            expect(result.groupId).toBe('grp_12345');
            expect(result.groupAccessType).toBe('public');
            expect(result.accessTypeName).toBe('groupPublic');
        });

        test('parses instance with strict flag', () => {
            const location = 'wrld_12345:instance~strict';
            const result = parseLocation(location);
            expect(result.strict).toBe(true);
        });

        test('parses instance with ageGate flag', () => {
            const location = 'wrld_12345:instance~ageGate';
            const result = parseLocation(location);
            expect(result.ageGate).toBe(true);
        });

        test('parses complex instance with multiple parameters', () => {
            const location =
                'wrld_12345:67890~region(eu)~private(usr_abc)~canRequestInvite~strict~ageGate';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.instanceName).toBe('67890');
            expect(result.region).toBe('eu');
            expect(result.accessType).toBe('invite+');
            expect(result.privateId).toBe('usr_abc');
            expect(result.canRequestInvite).toBe(true);
            expect(result.strict).toBe(true);
            expect(result.ageGate).toBe(true);
        });

        test('parses instance with shortName in URL', () => {
            const location = 'wrld_12345:67890&shortName=TestInstance';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.instanceId).toBe('67890');
            expect(result.shortName).toBe('TestInstance');
        });

        test('detects special states with variations', () => {
            expect(parseLocation('offline').isOffline).toBe(true);
            expect(parseLocation('offline:offline').isOffline).toBe(true);
            expect(parseLocation('private').isPrivate).toBe(true);
            expect(parseLocation('private:private').isPrivate).toBe(true);
            expect(parseLocation('traveling').isTraveling).toBe(true);
            expect(parseLocation('traveling:traveling').isTraveling).toBe(true);
        });

        test('handles empty and null inputs', () => {
            expect(parseLocation(null).tag).toBe('');
            expect(parseLocation(undefined).tag).toBe('');
            expect(parseLocation('').tag).toBe('');

            [null, undefined, ''].forEach((input) => {
                const result = parseLocation(input);
                expect(result.isOffline).toBe(false);
                expect(result.isPrivate).toBe(false);
                expect(result.isTraveling).toBe(false);
                expect(result.isRealInstance).toBe(false);
            });
        });

        test('handles malformed instance parameters', () => {
            const location =
                'wrld_12345:instance~private()~region~invalid(test';
            const result = parseLocation(location);
            expect(result.worldId).toBe('wrld_12345');
            expect(result.privateId).toBe(''); // Empty parentheses
            expect(result.region).toBe(''); // No parentheses
        });

        test('preserves original tag', () => {
            const originalTag = 'wrld_12345:instance~region(us)';
            const result = parseLocation(originalTag);
            expect(result.tag).toBe(originalTag);
        });
    });

    describe('displayLocation', () => {
        test('shows world name for simple world ID', () => {
            const result = displayLocation('wrld_12345', 'Test World');
            expect(result).toBe('Test World');
        });

        test('handles offline state', () => {
            expect(displayLocation('offline', 'Some World')).toBe('Offline');
            expect(displayLocation('offline:offline', 'Some World')).toBe(
                'Offline'
            );
        });

        test('handles private state', () => {
            expect(displayLocation('private', 'Some World')).toBe('Private');
            expect(displayLocation('private:private', 'Some World')).toBe(
                'Private'
            );
        });

        test('handles traveling state', () => {
            expect(displayLocation('traveling', 'Some World')).toBe(
                'Traveling'
            );
            expect(displayLocation('traveling:traveling', 'Some World')).toBe(
                'Traveling'
            );
        });

        test('shows world with access type for instance', () => {
            const result = displayLocation(
                'wrld_12345:instance~private(usr_123)',
                'Test World'
            );
            expect(result).toBe('Test World invite');
        });

        test('includes group name when provided', () => {
            const result = displayLocation(
                'wrld_12345:instance~group(grp_123)',
                'Test World',
                'My Group'
            );
            expect(result).toBe('Test World group(My Group)');
        });

        test('shows different access types correctly', () => {
            const worldName = 'Test World';

            expect(displayLocation('wrld_12345:instance', worldName)).toBe(
                'Test World public'
            );
            expect(
                displayLocation(
                    'wrld_12345:instance~private(usr_123)',
                    worldName
                )
            ).toBe('Test World invite');
            expect(
                displayLocation(
                    'wrld_12345:instance~private(usr_123)~canRequestInvite',
                    worldName
                )
            ).toBe('Test World invite+');
            expect(
                displayLocation(
                    'wrld_12345:instance~friends(usr_123)',
                    worldName
                )
            ).toBe('Test World friends');
            expect(
                displayLocation(
                    'wrld_12345:instance~hidden(usr_123)',
                    worldName
                )
            ).toBe('Test World friends+');
            expect(
                displayLocation('wrld_12345:instance~group(grp_123)', worldName)
            ).toBe('Test World group');
        });

        test('shows group access types correctly', () => {
            const worldName = 'Test World';
            const groupName = 'Test Group';

            expect(
                displayLocation(
                    'wrld_12345:instance~group(grp_123)~groupAccessType(public)',
                    worldName,
                    groupName
                )
            ).toBe('Test World groupPublic(Test Group)');
            expect(
                displayLocation(
                    'wrld_12345:instance~group(grp_123)~groupAccessType(plus)',
                    worldName,
                    groupName
                )
            ).toBe('Test World groupPlus(Test Group)');
        });

        test('prioritizes group name over access type when both available', () => {
            const result = displayLocation(
                'wrld_12345:instance~private(usr_123)',
                'Test World',
                'Override Group'
            );
            expect(result).toBe('Test World invite(Override Group)');
        });

        test('handles empty or missing world name', () => {
            expect(displayLocation('wrld_12345:instance', '')).toBe(' public');
            expect(displayLocation('wrld_12345:instance', undefined)).toBe(
                'undefined public'
            );
        });

        test('handles empty or missing group name', () => {
            const result = displayLocation(
                'wrld_12345:instance~group(grp_123)',
                'Test World',
                ''
            );
            expect(result).toBe('Test World group');
        });

        test('handles local instances', () => {
            const result = displayLocation('local:12345', 'Local World');
            expect(result).toBe('Local World');
        });

        test('handles malformed location strings', () => {
            expect(displayLocation('invalid-location', 'Test World')).toBe(
                'Test World'
            );
            expect(displayLocation('', 'Test World')).toBe('Test World');
            expect(displayLocation(null, 'Test World')).toBe('Test World');
        });
    });

    describe('integration and edge cases', () => {
        test('parseLocation handles all known access types', () => {
            const testCases = [
                { location: 'wrld_test:public', expectedAccessType: 'public' },
                {
                    location: 'wrld_test:private~private(usr_123)',
                    expectedAccessType: 'invite'
                },
                {
                    location:
                        'wrld_test:private~private(usr_123)~canRequestInvite',
                    expectedAccessType: 'invite+'
                },
                {
                    location: 'wrld_test:friends~friends(usr_123)',
                    expectedAccessType: 'friends'
                },
                {
                    location: 'wrld_test:hidden~hidden(usr_123)',
                    expectedAccessType: 'friends+'
                },
                {
                    location: 'wrld_test:group~group(grp_123)',
                    expectedAccessType: 'group'
                }
            ];

            testCases.forEach(({ location, expectedAccessType }) => {
                const result = parseLocation(location);
                expect(result.accessType).toBe(expectedAccessType);
            });
        });

        test('displayLocation and parseLocation work together consistently', () => {
            const testCases = [
                { location: 'offline', worldName: 'Test', expected: 'Offline' },
                { location: 'private', worldName: 'Test', expected: 'Private' },
                {
                    location: 'traveling',
                    worldName: 'Test',
                    expected: 'Traveling'
                },
                {
                    location: 'wrld_12345',
                    worldName: 'Test World',
                    expected: 'Test World'
                },
                {
                    location: 'wrld_12345:instance',
                    worldName: 'Test World',
                    expected: 'Test World public'
                }
            ];

            testCases.forEach(({ location, worldName, expected }) => {
                const result = displayLocation(location, worldName);
                expect(result).toBe(expected);
            });
        });

        test('parseLocation maintains consistency across parameter order', () => {
            // Different parameter orders should produce same result
            const location1 =
                'wrld_12345:instance~region(us)~private(usr_123)~strict';
            const location2 =
                'wrld_12345:instance~strict~private(usr_123)~region(us)';

            const result1 = parseLocation(location1);
            const result2 = parseLocation(location2);

            expect(result1.region).toBe(result2.region);
            expect(result1.privateId).toBe(result2.privateId);
            expect(result1.strict).toBe(result2.strict);
            expect(result1.accessType).toBe(result2.accessType);
        });

        test('parseLocation handles extremely long world IDs', () => {
            const longWorldId = 'wrld_' + 'a'.repeat(100);
            const result = parseLocation(longWorldId);
            expect(result.worldId).toBe(longWorldId);
            expect(result.isRealInstance).toBe(true);
        });

        test('error recovery with corrupted location strings', () => {
            const corruptedCases = [
                'wrld_12345:',
                'wrld_12345:~',
                'wrld_12345:~~~',
                'wrld_12345:instance~(',
                'wrld_12345:instance~)(',
                'wrld_12345:instance~region((nested))'
            ];

            corruptedCases.forEach((location) => {
                expect(() => {
                    const result = parseLocation(location);
                    expect(typeof result).toBe('object');
                    expect(result.worldId).toBeDefined();
                }).not.toThrow();
            });
        });
    });
});
