import type { Session } from './session';

class SessionRegistry {
  private sessions: Map<string, Session> = new Map();

  register(id: string, session: Session): void {
    this.sessions.set(id, session);
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  has(id: string): boolean {
    return this.sessions.has(id);
  }

  list(): Session[] {
    return Array.from(this.sessions.values());
  }

  listIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  remove(id: string): void {
    this.sessions.delete(id);
  }

  size(): number {
    return this.sessions.size;
  }

  disposeAll(): void {
    for (const session of this.sessions.values()) {
      try {
        session.dispose();
      } catch (err) {
        console.error('[SessionRegistry] dispose error:', err);
      }
    }
    this.sessions.clear();
  }

  // D-GTC · the awaitable soft-close of EVERY session (the Diameter to disposeAll's hard/sync
  // reap). Fans gracefulClose() out across all sessions in parallel (Ctrl-C flush + bounded
  // onExit await per pty) so the quit funnel can wait for CC transcripts to flush BEFORE
  // disposeAll(). Each gracefulClose never hangs; a per-session throw is caught so one wedged
  // pty never blocks the fan-out. Does NOT clear the map — disposeAll() runs after this.
  async gracefulCloseAll(graceMs = 5000): Promise<void> {
    await Promise.all(
      Array.from(this.sessions.values()).map((session) =>
        session.gracefulClose(graceMs).catch((err) => {
          console.error('[SessionRegistry] gracefulClose error:', err);
        })
      )
    );
  }
}

export const sessionRegistry = new SessionRegistry();
export type { SessionRegistry };
