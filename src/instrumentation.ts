// Next.js instrumentation hook — runs once on server startup in the Node.js runtime.
// Starts the background NATS subscriber that keeps the Prisma DB in sync with
// treasury-api payment events (treasury.payment.succeeded).

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (!process.env.EVENTS_NATS_URL) return;

  try {
    const { startTreasuryEventSubscriber } = await import('./lib/treasury-subscriber');
    await startTreasuryEventSubscriber();
  } catch (err) {
    // Non-fatal: the app runs fine without the subscriber; the sync endpoint is a fallback.
    console.warn('[instrumentation] treasury subscriber startup error (non-fatal):', err);
  }
}
