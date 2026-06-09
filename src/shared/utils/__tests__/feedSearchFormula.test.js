import {
    tokenize,
    parseExpression,
    extractKeywords,
    evaluateCondition
} from '../feedSearchFormula';

describe('feedSearchFormula', () => {
    describe('tokenize', () => {
        test('tokenizes simple search', () => {
            expect(tokenize('hello world')).toEqual([
                { type: 'VALUE', value: 'hello' },
                { type: 'VALUE', value: 'world' }
            ]);
        });

        test('tokenizes AND operator', () => {
            expect(tokenize('a&b')).toEqual([
                { type: 'VALUE', value: 'a' },
                { type: 'AND' },
                { type: 'VALUE', value: 'b' }
            ]);
        });

        test('tokenizes OR operator', () => {
            expect(tokenize('a|b')).toEqual([
                { type: 'VALUE', value: 'a' },
                { type: 'OR' },
                { type: 'VALUE', value: 'b' }
            ]);
        });

        test('tokenizes NOT operator', () => {
            expect(tokenize('!a')).toEqual([
                { type: 'NOT' },
                { type: 'VALUE', value: 'a' }
            ]);
        });

        test('tokenizes NOT EQUALS operator', () => {
            expect(tokenize('a!=b')).toEqual([
                { type: 'VALUE', value: 'a' },
                { type: 'NOT' },
                { type: 'EQUALS' },
                { type: 'VALUE', value: 'b' }
            ]);
        });

        test('tokenizes comparison operators', () => {
            expect(tokenize('a>b')).toEqual([
                { type: 'VALUE', value: 'a' },
                { type: 'GT' },
                { type: 'VALUE', value: 'b' }
            ]);
            expect(tokenize('a<b')).toEqual([
                { type: 'VALUE', value: 'a' },
                { type: 'LT' },
                { type: 'VALUE', value: 'b' }
            ]);
            expect(tokenize('a>=b')).toEqual([
                { type: 'VALUE', value: 'a' },
                { type: 'GE' },
                { type: 'VALUE', value: 'b' }
            ]);
            expect(tokenize('a<=b')).toEqual([
                { type: 'VALUE', value: 'a' },
                { type: 'LE' },
                { type: 'VALUE', value: 'b' }
            ]);
            expect(tokenize('a=b')).toEqual([
                { type: 'VALUE', value: 'a' },
                { type: 'EQUALS' },
                { type: 'VALUE', value: 'b' }
            ]);
        });

        test('tokenizes parentheses', () => {
            expect(tokenize('(a&b)')).toEqual([
                { type: 'LPAREN' },
                { type: 'VALUE', value: 'a' },
                { type: 'AND' },
                { type: 'VALUE', value: 'b' },
                { type: 'RPAREN' }
            ]);
        });

        test('tokenizes arrays', () => {
            expect(tokenize('[a,b,c]')).toEqual([
                { type: 'LBRACKET' },
                { type: 'VALUE', value: 'a' },
                { type: 'COMMA' },
                { type: 'VALUE', value: 'b' },
                { type: 'COMMA' },
                { type: 'VALUE', value: 'c' },
                { type: 'RBRACKET' }
            ]);
        });

        test('tokenizes quoted strings', () => {
            expect(tokenize('"hello world"')).toEqual([
                { type: 'VALUE', value: 'hello world' }
            ]);
            expect(tokenize("'hello world'")).toEqual([
                { type: 'VALUE', value: 'hello world' }
            ]);
        });

        test('tokenizes time with space', () => {
            expect(tokenize('time=2024/04/26 07:18')).toEqual([
                { type: 'VALUE', value: 'time' },
                { type: 'EQUALS' },
                { type: 'VALUE', value: '2024/04/26 07:18' }
            ]);
        });
    });

    describe('parseExpression', () => {
        test('parses simple text', () => {
            const tokens = tokenize('hello');
            const ast = parseExpression(tokens, 'hello');
            expect(ast).toEqual({ type: 'TEXT', value: 'hello' });
        });

        test('parses field expression', () => {
            const tokens = tokenize('name=test');
            const ast = parseExpression(tokens, 'name=test');
            expect(ast).toEqual({
                type: 'FIELD',
                field: 'name',
                op: 'EQUALS',
                value: 'test'
            });
        });

        test('parses AND expression', () => {
            const tokens = tokenize('a&b');
            const ast = parseExpression(tokens, 'a&b');
            expect(ast).toEqual({
                type: 'AND',
                left: { type: 'TEXT', value: 'a' },
                right: { type: 'TEXT', value: 'b' }
            });
        });

        test('parses OR expression', () => {
            const tokens = tokenize('a|b');
            const ast = parseExpression(tokens, 'a|b');
            expect(ast).toEqual({
                type: 'OR',
                left: { type: 'TEXT', value: 'a' },
                right: { type: 'TEXT', value: 'b' }
            });
        });

        test('parses NOT expression', () => {
            const tokens = tokenize('!a');
            const ast = parseExpression(tokens, '!a');
            expect(ast).toEqual({
                type: 'NOT',
                expr: { type: 'TEXT', value: 'a' }
            });
        });

        test('parses NOT field expression', () => {
            const tokens = tokenize('name!=test');
            const ast = parseExpression(tokens, 'name!=test');
            expect(ast).toEqual({
                type: 'NOT',
                expr: {
                    type: 'FIELD',
                    field: 'name',
                    value: 'test'
                }
            });
        });

        test('parses array as OR', () => {
            const tokens = tokenize('[a,b,c]');
            const ast = parseExpression(tokens, '[a,b,c]');
            expect(ast).toEqual({
                type: 'OR',
                left: {
                    type: 'OR',
                    left: { type: 'TEXT', value: 'a' },
                    right: { type: 'TEXT', value: 'b' }
                },
                right: { type: 'TEXT', value: 'c' }
            });
        });

        test('parses field with array', () => {
            const tokens = tokenize('name=[a,b]');
            const ast = parseExpression(tokens, 'name=[a,b]');
            expect(ast).toEqual({
                type: 'OR',
                left: {
                    type: 'FIELD',
                    field: 'name',
                    op: 'EQUALS',
                    value: 'a'
                },
                right: {
                    type: 'FIELD',
                    field: 'name',
                    op: 'EQUALS',
                    value: 'b'
                }
            });
        });

        test('throws for invalid field', () => {
            const tokens = tokenize('invalid=test');
            expect(() => parseExpression(tokens, 'invalid=test')).toThrow();
        });

        test('throws for empty input', () => {
            expect(() => parseExpression([], '')).toThrow();
        });

        test('throws for unclosed parenthesis', () => {
            const tokens = tokenize('(a&b');
            expect(() => parseExpression(tokens, '(a&b')).toThrow({
                type: 'unclosed_parenthesis'
            });
        });

        test('handles extra right parenthesis at end', () => {
            const tokens = tokenize('a&b)');
            const ast = parseExpression(tokens, 'a&b)');
            expect(ast).toEqual({
                type: 'AND',
                left: { type: 'TEXT', value: 'a' },
                right: { type: 'TEXT', value: 'b' }
            });
        });

        test('handles extra right parenthesis in middle', () => {
            const tokens = tokenize('a)&b');
            const ast = parseExpression(tokens, 'a)&b');
            expect(ast).toBeDefined();
        });

        test('throws for unclosed array', () => {
            const tokens = tokenize('[a,b');
            expect(() => parseExpression(tokens, '[a,b')).toThrow({
                type: 'unclosed_array'
            });
        });

        test('handles empty field value gracefully', () => {
            const tokens = tokenize('name=');
            const ast = parseExpression(tokens, 'name=');
            expect(ast).toEqual({
                type: 'FIELD',
                field: 'name',
                op: 'EQUALS',
                value: ''
            });
        });

        test('handles empty array', () => {
            const tokens = tokenize('name=[]');
            const ast = parseExpression(tokens, 'name=[]');
            expect(ast).toEqual({
                type: 'FIELD',
                field: 'name',
                op: 'EQUALS',
                value: ''
            });
        });
    });

    describe('extractKeywords', () => {
        test('extracts from TEXT', () => {
            const tokens = tokenize('hello');
            const ast = parseExpression(tokens, 'hello');
            expect(extractKeywords(ast)).toEqual(['hello']);
        });

        test('extracts from FIELD', () => {
            const tokens = tokenize('name=test world=home');
            const ast = parseExpression(tokens, 'name=test world=home');
            expect(extractKeywords(ast)).toEqual(['test', 'home']);
        });

        test('skips special fields', () => {
            const tokens = tokenize('type=GPS time=2024-04-26');
            const ast = parseExpression(tokens, 'type=GPS time=2024-04-26');
            expect(extractKeywords(ast)).toEqual([]);
        });

        test('extracts from AND/OR', () => {
            const tokens = tokenize('a&(b|c)');
            const ast = parseExpression(tokens, 'a&(b|c)');
            expect(extractKeywords(ast)).toEqual(['a', 'b', 'c']);
        });
    });

    describe('evaluateCondition', () => {
        const testRow = {
            displayName: 'TestUser',
            worldName: 'TestWorld',
            location: 'wrld_1234:instance_5678',
            status: 'Online',
            statusDescription: 'Testing',
            avatarName: 'TestAvatar',
            bio: 'Test bio',
            previousBio: 'Old bio',
            type: 'GPS',
            groupName: 'TestGroup',
            created_at: '2024-04-26T12:00:00.000Z'
        };

        test('returns true for MATCH_ALL', () => {
            expect(evaluateCondition({ type: 'MATCH_ALL' }, testRow)).toBe(
                true
            );
        });

        test('evaluates TEXT match', () => {
            const tokens = tokenize('TestUser');
            const ast = parseExpression(tokens, 'TestUser');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('evaluates TEXT no match', () => {
            const tokens = tokenize('NonExistent');
            const ast = parseExpression(tokens, 'NonExistent');
            expect(evaluateCondition(ast, testRow)).toBe(false);
        });

        test('evaluates FIELD name', () => {
            const tokens = tokenize('name=TestUser');
            const ast = parseExpression(tokens, 'name=TestUser');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('evaluates FIELD world', () => {
            const tokens = tokenize('world=TestWorld');
            const ast = parseExpression(tokens, 'world=TestWorld');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('evaluates FIELD type exact', () => {
            const tokens = tokenize('type=GPS');
            const ast = parseExpression(tokens, 'type=GPS');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('evaluates FIELD time equals', () => {
            const tokens = tokenize('time=2024/04/26');
            const ast = parseExpression(tokens, 'time=2024/04/26');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('evaluates FIELD time range', () => {
            const tokens = tokenize('time=2024/04/25~2024/04/27');
            const ast = parseExpression(tokens, 'time=2024/04/25~2024/04/27');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('evaluates AND', () => {
            const tokens = tokenize('TestUser&TestWorld');
            const ast = parseExpression(tokens, 'TestUser&TestWorld');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('evaluates OR', () => {
            const tokens = tokenize('TestUser|NonExistent');
            const ast = parseExpression(tokens, 'TestUser|NonExistent');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('evaluates NOT', () => {
            const tokens = tokenize('!NonExistent');
            const ast = parseExpression(tokens, '!NonExistent');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('evaluates invalid time gracefully', () => {
            const tokens = tokenize('time=invalid-date');
            const ast = parseExpression(tokens, 'time=invalid-date');
            expect(evaluateCondition(ast, testRow)).toBe(false);
        });

        test('handles null/undefined row gracefully', () => {
            const tokens = tokenize('Test');
            const ast = parseExpression(tokens, 'Test');
            expect(evaluateCondition(ast, null)).toBe(false);
            expect(evaluateCondition(ast, undefined)).toBe(false);
        });

        test('handles row with missing fields gracefully', () => {
            const tokens = tokenize('name=Test');
            const ast = parseExpression(tokens, 'name=Test');
            const emptyRow = {};
            expect(evaluateCondition(ast, emptyRow)).toBe(false);
        });

        test('handles NOT with invalid field', () => {
            const tokens = tokenize('!invalid=test');
            expect(() => parseExpression(tokens, '!invalid=test')).toThrow();
        });

        test('handles quoted string matching', () => {
            const tokens = tokenize('"TestUser"');
            const ast = parseExpression(tokens, '"TestUser"');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('handles time with minus operator (using lt)', () => {
            const tokens = tokenize('time<2024/04/27');
            const ast = parseExpression(tokens, 'time<2024/04/27');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('handles comparison operators', () => {
            const tokens = tokenize('time>2024/04/25');
            const ast = parseExpression(tokens, 'time>2024/04/25');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('handles time with HH format (equals)', () => {
            const tokens = tokenize('time=2024/04/26 12');
            const ast = parseExpression(tokens, 'time=2024/04/26 12');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('handles time with HH:mm format (equals)', () => {
            const tokens = tokenize('time=2024/04/26 12:00');
            const ast = parseExpression(tokens, 'time=2024/04/26 12:00');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('handles time with HH:mm:ss format (equals)', () => {
            const tokens = tokenize('time=2024/04/26 12:00:00');
            const ast = parseExpression(tokens, 'time=2024/04/26 12:00:00');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('handles time with comparison operators (HH only)', () => {
            const tokens = tokenize('time>=2024/04/26 12');
            const ast = parseExpression(tokens, 'time>=2024/04/26 12');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('handles time with comparison operators (HH:mm)', () => {
            const tokens = tokenize('time>2024/04/26 11:59');
            const ast = parseExpression(tokens, 'time>2024/04/26 11:59');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('handles time with comparison operators (HH:mm:ss)', () => {
            const tokens = tokenize('time<2024/04/26 12:01');
            const ast = parseExpression(tokens, 'time<2024/04/26 12:01');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('handles exact type match', () => {
            const tokens = tokenize('type=GPS');
            const ast = parseExpression(tokens, 'type=GPS');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        test('handles type mismatch', () => {
            const tokens = tokenize('type=Offline');
            const ast = parseExpression(tokens, 'type=Offline');
            expect(evaluateCondition(ast, testRow)).toBe(false);
        });

        test('handles empty array', () => {
            const tokens = tokenize('[]');
            const ast = parseExpression(tokens, '[]');
            expect(evaluateCondition(ast, testRow)).toBe(true);
        });

        describe('invalid expressions', () => {
            test.each(['&', '|', '=', '>', '<', '=test', 'name&', 'name|'])(
                'throws for %s',
                (input) => {
                    const tokens = tokenize(input);
                    expect(() => parseExpression(tokens, input)).toThrow();
                }
            );
        });

        describe('time matching', () => {
            const testRow = { created_at: '2024-04-15T12:00:00.000Z' };

            test('handles year-only match (time=2024)', () => {
                const tokens = tokenize('time=2024');
                const ast = parseExpression(tokens, 'time=2024');
                expect(evaluateCondition(ast, testRow)).toBe(true);
            });

            test('handles month-only match (time=2024/04)', () => {
                const tokens = tokenize('time=2024/04');
                const ast = parseExpression(tokens, 'time=2024/04');
                expect(evaluateCondition(ast, testRow)).toBe(true);
            });

            test('handles day-only match (time=2024/04/15)', () => {
                const tokens = tokenize('time=2024/04/15');
                const ast = parseExpression(tokens, 'time=2024/04/15');
                expect(evaluateCondition(ast, testRow)).toBe(true);
            });

            test('handles year comparison (time>2024)', () => {
                const tokens = tokenize('time>2024');
                const ast = parseExpression(tokens, 'time>2024');
                expect(
                    evaluateCondition(ast, {
                        created_at: '2025-01-01T00:00:00.000Z'
                    })
                ).toBe(true);
            });

            test('handles month comparison (time>2024/04)', () => {
                const tokens = tokenize('time>2024/04');
                const ast = parseExpression(tokens, 'time>2024/04');
                expect(
                    evaluateCondition(ast, {
                        created_at: '2024-05-01T00:00:00.000Z'
                    })
                ).toBe(true);
            });
        });
    });
});
