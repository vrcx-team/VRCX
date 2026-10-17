import type { Avatar, Balance } from 'vrchat';
import type { Json, MarketplaceAvatarSearchParams } from '../types/vrcx';
import { request } from '../services/request';
import { useUserStore } from '../stores';

type MarketplaceAvatarSearchResponse = {
    hasNext: boolean;
    totalCount: number;
    results: Json<Avatar>[];
};

const marketplaceReq = {
    searchAvatars(
        params: MarketplaceAvatarSearchParams
    ): Promise<{ json: MarketplaceAvatarSearchResponse; params: MarketplaceAvatarSearchParams }> {
        const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
        return request('avatars', {
            method: 'GET',
            params: query
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    purchaseListing(params: { listingId: string; totalPrice: number; quantity: number }) {
        return request('economy/purchase/listing', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getVRChatCredits(): Promise<{ json: Json<Balance> }> {
        return request(`user/${useUserStore().currentUser.id}/economy/balance`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    }
};

export default marketplaceReq;
