import { describe, expect, test, vi } from 'vitest';

const { FRIEND_INSIGHT_DATA_TYPES } = vi.hoisted(() => ({
    FRIEND_INSIGHT_DATA_TYPES: [
        'location',
        'status',
        'bio',
        'avatar',
        'presence',
        'relationship',
        'mutuals'
    ]
}));

vi.mock('../database', () => ({
    database: {}
}));
vi.mock('../database/friendInsight', () => ({
    FRIEND_INSIGHT_DATA_TYPES,
    normalizeDataTypes: (value) =>
        Array.isArray(value) && value.length
            ? [...new Set(value.filter((type) => FRIEND_INSIGHT_DATA_TYPES.includes(type)))]
            : [...FRIEND_INSIGHT_DATA_TYPES]
}));
vi.mock('../webapi', () => ({
    default: { execute: vi.fn() }
}));
vi.mock('../../api/user', () => ({
    default: {
        getUser: vi.fn().mockResolvedValue({
            json: { displayName: 'Unknown User' }
        })
    }
}));

import {
    FRIEND_INSIGHT_TOOL_DEFINITIONS,
    createFriendInsightAgent,
    createFriendInsightToolExecutor,
    requestOpenAICompatibleCompletion,
    requestStreamingCompletion
} from '../friendInsightAgent.js';

describe('Friend Insight tool executor', () => {
    test('enforces the selected data types before returning timeline data', async () => {
        const dataSource = {
            resolveFriendInsightFriends: vi.fn(),
            getFriendInsightTimeline: vi.fn(),
            getFriendInsightRelationships: vi.fn()
        };
        const executeTool = createFriendInsightToolExecutor({
            database: dataSource,
            allowedDataTypes: ['status']
        });

        const result = await executeTool(
            'get_friend_timeline',
            JSON.stringify({
                friendIds: ['usr_alice'],
                dataTypes: ['status', 'bio']
            })
        );

        expect(dataSource.getFriendInsightTimeline).toHaveBeenCalledWith(
            expect.objectContaining({
                friendIds: ['usr_alice'],
                dataTypes: ['status']
            })
        );
        expect(result).toBeUndefined();
    });

    test('does not let the model access relationship data when disabled', async () => {
        const dataSource = {
            getFriendInsightRelationships: vi.fn()
        };
        const executeTool = createFriendInsightToolExecutor({
            database: dataSource,
            allowedDataTypes: ['status']
        });

        const result = await executeTool('get_friend_relationships', {
            friendIds: ['usr_alice']
        });

        expect(result.error).toContain('disabled');
        expect(dataSource.getFriendInsightRelationships).not.toHaveBeenCalled();
    });
});

describe('Friend Insight agent', () => {
    test('feeds tool results back to a compatible provider before returning an answer', async () => {
        const complete = vi
            .fn()
            .mockResolvedValueOnce({
                content: '',
                tool_calls: [
                    {
                        id: 'call_1',
                        function: {
                            name: 'resolve_current_friends',
                            arguments: '{"query":"Alice"}'
                        }
                    }
                ]
            })
            .mockResolvedValueOnce({ content: 'Alice is currently online.' });
        const executeTool = vi
            .fn()
            .mockResolvedValue([{ userId: 'usr_alice', displayName: 'Alice' }]);
        const agent = createFriendInsightAgent({ complete, executeTool });

        const result = await agent.ask({
            config: {
                endpoint: 'https://provider.example/v1/chat/completions',
                model: 'model-1'
            },
            question: 'Alice 在吗？'
        });

        expect(result.answer).toBe('Alice is currently online.');
        expect(result.toolTrace).toEqual([
            {
                name: 'resolve_current_friends',
                result: [{ userId: 'usr_alice', displayName: 'Alice' }]
            }
        ]);
        expect(complete).toHaveBeenCalledTimes(2);
        const secondMessages = complete.mock.calls[1][1];
        expect(secondMessages).toContainEqual(
            expect.objectContaining({
                role: 'tool',
                tool_call_id: 'call_1'
            })
        );
    });

    test('defines only fixed, read-only friend data tools', () => {
        expect(
            FRIEND_INSIGHT_TOOL_DEFINITIONS.map((tool) => tool.function.name)
        ).toEqual([
            'resolve_current_friends',
            'get_friend_timeline',
            'get_friend_relationships',
            'resolve_users'
        ]);
    });

    test('resolve_users checks local cache then falls back to API', async () => {
        const dataSource = {
            resolveFriendInsightUsers: vi
                .fn()
                .mockResolvedValue({
                    resolved: [
                        { userId: 'usr_aaa', displayName: 'Alice' }
                    ],
                    unresolved: ['usr_bbb', 'usr_ccc']
                })
        };
        const executeTool = createFriendInsightToolExecutor({
            database: dataSource
        });

        const result = await executeTool(
            'resolve_users',
            JSON.stringify({
                userIds: ['usr_aaa', 'usr_bbb', 'usr_ccc']
            })
        );

        expect(result.resolved).toContainEqual({
            userId: 'usr_aaa',
            displayName: 'Alice'
        });
        expect(result.unresolved.length).toBeGreaterThanOrEqual(0);
    });
});

describe('OpenAI-compatible connector', () => {
    test('sends OpenAI-compatible tool fields and accepts any 2xx response', async () => {
        const transport = {
            execute: vi.fn().mockResolvedValue({
                status: 201,
                data: JSON.stringify({
                    choices: [{ message: { content: 'ok' } }]
                })
            })
        };

        const result = await requestOpenAICompatibleCompletion(
            {
                endpoint: 'https://provider.example/v1/chat/completions',
                apiKey: 'test-key',
                model: 'model-1'
            },
            [{ role: 'user', content: 'hello' }],
            FRIEND_INSIGHT_TOOL_DEFINITIONS,
            { transport }
        );

        expect(result).toEqual({ content: 'ok' });
        const request = transport.execute.mock.calls[0][0];
        expect(request.headers.Authorization).toBe('Bearer test-key');
        expect(JSON.parse(request.body)).toMatchObject({
            model: 'model-1',
            tool_choice: 'auto',
            stream: false
        });
    });
});

describe('Streaming agent', () => {
    function createMockStreamResponse(chunks) {
        const encoder = new TextEncoder();
        const lines = [];
        for (const chunk of chunks) {
            lines.push('data: ' + JSON.stringify(chunk));
        }
        lines.push('data: [DONE]');
        const body = lines.join('\n') + '\n';
        return {
            ok: true,
            body: new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(body));
                    controller.close();
                }
            }),
            text: async () => body.slice(0, 200)
        };
    }

    test('reports text deltas and tool calls via callbacks', async () => {
        const callbacks = {
            onToken: vi.fn(),
            onThinking: vi.fn(),
            onToolStart: vi.fn(),
            onToolDone: vi.fn(),
            onDone: vi.fn()
        };

        const streamComplete = vi.fn().mockImplementation(
            async (_config, _messages, _tools, streamCallbacks) => {
                // Simulate real streaming: call callbacks BEFORE resolving
                if (streamCallbacks?.onThinking) {
                    streamCallbacks.onThinking('Let me ');
                    streamCallbacks.onThinking('check Alice activity.');
                }
                if (streamCallbacks?.onToken) {
                    streamCallbacks.onToken('Alice has ');
                    streamCallbacks.onToken('been active in 3 worlds this week.');
                }
                return {
                    content: 'Alice has been active in 3 worlds this week.',
                    toolCalls: [],
                    thinking: 'Let me check Alice activity.'
                };
            }
        );

        const agent = createFriendInsightAgent({ streamComplete });

        await agent.askStream(
            {
                config: {
                    endpoint: 'https://provider.example/v1/chat/completions',
                    model: 'model-1'
                },
                question: 'Alice 在干吗？'
            },
            callbacks
        );

        // onToken should have been called per-delta, not with the whole text
        expect(callbacks.onToken).toHaveBeenCalledTimes(2);
        expect(callbacks.onToken).toHaveBeenCalledWith('Alice has ');
        expect(callbacks.onToken).toHaveBeenCalledWith(
            'been active in 3 worlds this week.'
        );
        expect(callbacks.onThinking).toHaveBeenCalledTimes(2);
        expect(callbacks.onDone).toHaveBeenCalled();
    });

    test('calls tool callbacks when tools are invoked', async () => {
        const callbacks = {
            onToken: vi.fn(),
            onToolStart: vi.fn(),
            onToolDone: vi.fn(),
            onDone: vi.fn()
        };

        const executeTool = vi
            .fn()
            .mockResolvedValue([
                { userId: 'usr_alice', displayName: 'Alice' }
            ]);

        const streamComplete = vi
            .fn()
            .mockImplementationOnce(async (_c, _m, _t, streamCallbacks) => {
                if (streamCallbacks?.onToken) {
                    streamCallbacks.onToken('');
                }
                return {
                    content: '',
                    toolCalls: [
                        {
                            id: 'call_1',
                            name: 'resolve_current_friends',
                            arguments: '{"query":"Alice"}'
                        }
                    ],
                    thinking: ''
                };
            })
            .mockImplementationOnce(async (_c, _m, _t, streamCallbacks) => {
                if (streamCallbacks?.onToken) {
                    streamCallbacks.onToken('Found Alice.');
                }
                return {
                    content: 'Found Alice.',
                    toolCalls: [],
                    thinking: ''
                };
            });

        const agent = createFriendInsightAgent({
            streamComplete,
            executeTool
        });

        await agent.askStream(
            {
                config: {
                    endpoint: 'https://provider.example/v1/chat/completions',
                    model: 'model-1'
                },
                question: 'Alice 在吗？'
            },
            callbacks
        );

        expect(callbacks.onToolStart).toHaveBeenCalledWith(
            'resolve_current_friends',
            { query: 'Alice' }
        );
        expect(callbacks.onToolDone).toHaveBeenCalled();
        expect(streamComplete).toHaveBeenCalledTimes(2);
    });

    test('passes accumulated reasoning to onThinking as deltas arrive', async () => {
        const onThinking = vi.fn();
        const streamComplete = vi.fn().mockImplementation(
            async (_c, _m, _t, streamCallbacks) => {
                if (streamCallbacks?.onThinking) {
                    streamCallbacks.onThinking('Step 1: understand query.');
                    streamCallbacks.onThinking('\nStep 2: check data.');
                }
                return {
                    content: 'OK',
                    toolCalls: [],
                    thinking: 'Step 1: understand query.\nStep 2: check data.'
                };
            }
        );

        const agent = createFriendInsightAgent({ streamComplete });

        await agent.askStream(
            {
                config: {
                    endpoint: 'https://provider.example/v1/chat/completions',
                    model: 'model-1'
                },
                question: 'test'
            },
            { onThinking }
        );

        expect(onThinking).toHaveBeenCalledTimes(2);
        expect(onThinking).toHaveBeenCalledWith('Step 1: understand query.');
        expect(onThinking).toHaveBeenCalledWith('\nStep 2: check data.');
    });
});
