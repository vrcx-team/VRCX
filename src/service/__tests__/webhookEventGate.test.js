import { describe, expect, test } from 'vitest';

import { shouldEmitWebhookEventRuntime } from '../webhookEventGate';

describe('shouldEmitWebhookEventRuntime', () => {
    test('blocks favorite.avatar.added during favorites initialization', () => {
        expect(
            shouldEmitWebhookEventRuntime('favorite.avatar.added', {
                isFavoritesLoaded: false,
                isFriendsLoaded: true
            })
        ).toBe(false);
    });

    test('allows favorite.avatar.added after favorites initialization', () => {
        expect(
            shouldEmitWebhookEventRuntime('favorite.avatar.added', {
                isFavoritesLoaded: true,
                isFriendsLoaded: true
            })
        ).toBe(true);
    });

    test('blocks friend avatar/note/time events during friends initialization', () => {
        for (const event of [
            'friend.time_together_updated',
            'friend.note_updated',
            'friend.avatar_changed'
        ]) {
            expect(
                shouldEmitWebhookEventRuntime(event, {
                    isFavoritesLoaded: true,
                    isFriendsLoaded: false
                })
            ).toBe(false);
        }
    });

    test('does not block unrelated events', () => {
        expect(
            shouldEmitWebhookEventRuntime('friend.status_changed', {
                isFavoritesLoaded: false,
                isFriendsLoaded: false
            })
        ).toBe(true);
    });
});
