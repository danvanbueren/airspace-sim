import {createNoOpFeedAdapter} from './SensorFeedAdapter'

/**
 * Backend-compatible stub. Replace scan() with WebSocket/SSE ingestion later.
 */
export function createRemoteFeedAdapter() {
    return {
        ...createNoOpFeedAdapter(),
        connect() {
            return Promise.resolve({status: 'stub'})
        },
        disconnect() {},
    }
}
