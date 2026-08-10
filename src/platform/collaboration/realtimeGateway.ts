import type { RealtimeChannel } from '@supabase/supabase-js';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/realtime-js';
import type { IdentityId, ListId } from '../../core/domain/ids';
import { identityIdSchema } from '../../core/domain/ids';
import { requireSupabaseClient } from './supabaseClient';

export class CollaborationRealtimeGateway {
    #listChannel: RealtimeChannel | null = null;
    #onInvalidate: (() => void) | null = null;
    #onPresence: ((ids: ReadonlySet<IdentityId>) => void) | null = null;
    #userChannel: RealtimeChannel | null = null;
    #userId: IdentityId | null = null;

    async connect(options: {
        onInvalidate: () => void;
        onPresence: (ids: ReadonlySet<IdentityId>) => void;
        signal: AbortSignal;
        userId: IdentityId;
    }): Promise<void> {
        await this.disconnect();
        const supabase = requireSupabaseClient();
        this.#onInvalidate = options.onInvalidate;
        this.#onPresence = options.onPresence;
        this.#userId = options.userId;
        this.#userChannel = supabase
            .channel(`user:${options.userId}`, { config: { private: true } })
            .on('broadcast', { event: '*' }, () => options.onInvalidate())
            .subscribe();
        options.signal.addEventListener('abort', () => void this.disconnect(), {
            once: true,
        });
    }

    async setActiveList(listId: ListId | null): Promise<void> {
        const supabase = requireSupabaseClient();
        if (this.#listChannel) {
            await supabase.removeChannel(this.#listChannel);
            this.#listChannel = null;
        }
        this.#onPresence?.(new Set());
        if (!listId || !this.#userId) return;
        const channel = supabase.channel(`list:${listId}`, {
            config: {
                presence: { key: this.#userId },
                private: true,
            },
        });
        channel
            .on('broadcast', { event: '*' }, () => this.#onInvalidate?.())
            .on('presence', { event: 'sync' }, () => {
                const ids = new Set<IdentityId>();
                Object.keys(channel.presenceState()).forEach(value => {
                    const parsed = identityIdSchema.safeParse(value);
                    if (parsed.success) ids.add(parsed.data);
                });
                this.#onPresence?.(ids);
            })
            .subscribe(status => {
                if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
                    void channel.track({ activeAt: new Date().toISOString() });
                }
            });
        this.#listChannel = channel;
    }

    async disconnect(): Promise<void> {
        const supabase = requireSupabaseClient();
        const channels = [this.#listChannel, this.#userChannel].filter(
            (channel): channel is RealtimeChannel => channel !== null
        );
        this.#listChannel = null;
        this.#userChannel = null;
        this.#userId = null;
        this.#onInvalidate = null;
        this.#onPresence = null;
        await Promise.all(
            channels.map(channel => supabase.removeChannel(channel))
        );
    }
}
