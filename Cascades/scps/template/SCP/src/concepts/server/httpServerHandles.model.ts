/**
 * httpServerHandles.model · THE CLEAN EXIT · step 0 (C984)
 *
 * THE GAP THIS CLOSES: `app.listen()` returns the `http.Server`, but `server.principle.ts` discarded
 * BOTH return values (`:100` main · `:129` reflected) and the concept held only
 * `server?: Application` (`server.concept.ts:16`). An Express Application cannot be closed — only
 * the http.Server it created can. **There was nothing closable in the process at all**, so no
 * graceful-exit path could have worked no matter how it was written.
 *
 * WHY A MODULE REGISTRY RATHER THAN CONCEPT STATE: the graceful exit runs at PROCESS teardown, and
 * Muxium teardown is ASYNCHRONOUS (`close: (exit?) => void` returns void and merely dispatches into
 * RxJS — measured C980). A handle we must close ON THE WAY OUT cannot live somewhere that requires
 * the Muxium to still be alive to read it. Same reasoning as the C977 watcher singleton, and the
 * same shape deliberately — one place to look for "what is this process still holding".
 */

import type { Server } from 'node:http';

type HeldServer = { label: string; port: number; server: Server };

const held: HeldServer[] = [];

/** Register a live listener. Called at each `listen()` site with its returned handle. */
export function holdHttpServer(label: string, port: number, server: Server): void {
  held.push({ label, port, server });
}

/** What this process is still listening on — the Concluder surface. */
export function httpServerReport(): { label: string; port: number; listening: boolean }[] {
  return held.map((h) => ({ label: h.label, port: h.port, listening: h.server.listening }));
}

/**
 * Close every listener. Resolves when each has closed or its bounded wait elapsed.
 *
 * `server.close()` stops ACCEPTING but does NOT drop established keep-alive sockets — an idle
 * browser connection can hold the process open indefinitely. `closeAllConnections()` (Node 18.2+)
 * is what actually forces them down; it is called when present and skipped honestly when not, so
 * an older runtime degrades to "stops accepting" rather than throwing.
 */
export async function closeAllHttpServers(timeoutMs = 2_000): Promise<number> {
  let closed = 0;
  await Promise.all(
    held.map(
      (h) =>
        new Promise<void>((resolve) => {
          if (!h.server.listening) return resolve();
          const done = (): void => {
            closed += 1;
            resolve();
          };
          // Bounded: a listener that will not close must never hold the exit open, because the
          // whole point of this path is that SIGKILL is the fallback, not the norm.
          const timer = setTimeout(resolve, timeoutMs);
          timer.unref?.();
          try {
            (h.server as unknown as { closeAllConnections?: () => void }).closeAllConnections?.();
          } catch {
            /* older runtime — close() alone still stops accepting */
          }
          h.server.close(() => {
            clearTimeout(timer);
            done();
          });
        }),
    ),
  );
  return closed;
}
