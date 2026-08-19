// Background NATS subscriber that listens for auth-api's auth.user.deleted event
// (a platform admin hard-deleting/purging a user's SSO account — see auth-api
// AdminPurgeUser) and removes the matching local SiteUser mirror row, so a purged
// user doesn't linger in the Digitika Users page or reappear looking "active".
// Runs in the Next.js Node.js process via instrumentation.ts, same pattern as
// treasury-subscriber.ts. Stream: auth  Subject: auth.user.deleted
// Consumer: codevertex-website-auth-user-deleted

import { prisma } from './db';

interface AuthUserDeletedEnvelope {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  tenant_id: string;
  payload: {
    user_id?: string;
    email?: string;
    primary_tenant_id?: string;
    tenant_ids?: string[];
  };
  timestamp: string;
}

export async function startAuthUserDeletedSubscriber(): Promise<void> {
  const NATS_URL = process.env.EVENTS_NATS_URL;
  if (!NATS_URL) {
    console.log('[auth-user-deleted-subscriber] EVENTS_NATS_URL not set — skipping subscriber');
    return;
  }

  const { connect, StringCodec, AckPolicy, DeliverPolicy } = await import('nats');
  const sc = StringCodec();

  const attemptConnect = async (): Promise<void> => {
    let nc: Awaited<ReturnType<typeof connect>> | null = null;
    try {
      nc = await connect({
        servers: NATS_URL,
        timeout: 5000,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 2000,
      });

      console.log('[auth-user-deleted-subscriber] connected to NATS');

      const jsm = await nc.jetstreamManager();
      const js = nc.jetstream();

      try {
        await jsm.consumers.add('auth', {
          durable_name: 'codevertex-website-auth-user-deleted',
          filter_subject: 'auth.user.deleted',
          ack_policy: AckPolicy.Explicit,
          deliver_policy: DeliverPolicy.New,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes('consumer name already in use') && !msg.includes('existing consumer')) {
          throw err;
        }
      }

      const consumer = await js.consumers.get('auth', 'codevertex-website-auth-user-deleted');
      const messages = await consumer.consume();

      console.log('[auth-user-deleted-subscriber] subscribed to auth.user.deleted');

      (async () => {
        for await (const msg of messages) {
          try {
            const raw = sc.decode(msg.data);
            const event: AuthUserDeletedEnvelope = JSON.parse(raw);

            const userId = event.payload?.user_id;
            if (event.event_type !== 'deleted' || !userId) {
              msg.ack();
              continue;
            }

            const deleted = await prisma.siteUser.deleteMany({ where: { id: userId } });
            if (deleted.count > 0) {
              console.log(`[auth-user-deleted-subscriber] removed purged user ${userId} from local roster`);
            }
            msg.ack();
          } catch (err) {
            console.error('[auth-user-deleted-subscriber] error processing message:', err);
            // Don't ack — JetStream will redeliver
          }
        }
      })().catch((err) => {
        console.error('[auth-user-deleted-subscriber] subscription loop error:', err);
      });

      nc.closed().then(() => {
        console.log('[auth-user-deleted-subscriber] NATS connection closed, reconnecting in 5s...');
        setTimeout(attemptConnect, 5000);
      });
    } catch (err) {
      console.warn('[auth-user-deleted-subscriber] connect failed, retrying in 10s:', err);
      if (nc) {
        nc.close().catch(() => {});
      }
      setTimeout(attemptConnect, 10000);
    }
  };

  attemptConnect().catch(() => {});
}
