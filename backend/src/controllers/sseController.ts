/**
 * GET /api/stream
 * Server-Sent Events endpoint.
 * Emits: heartbeat (every 30s), status-changed, scores-updated.
 *
 * Works without Redis: falls back to an in-process EventEmitter so
 * the scheduler can still fire events on the same process.
 */
import { Request, Response } from 'express';
import { EventEmitter } from 'events';

// In-process bus — used as fallback when Redis pub/sub is unavailable
export const sseBus = new EventEmitter();
sseBus.setMaxListeners(200); // allow many concurrent SSE clients

export async function streamEvents(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  const clientId = Date.now().toString(36);
  console.log(`[SSE] Client connected: ${clientId}`);

  const send = (event: string, data: unknown) => {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      // client disconnected mid-write — handled below
    }
  };

  // Heartbeat keeps the connection alive and gives the chip a tick
  const heartbeatInterval = setInterval(() => {
    send('heartbeat', { ts: new Date().toISOString() });
  }, 30_000);

  // Relay pipeline events emitted by the scheduler
  const onStatusChanged  = (payload: unknown) => send('status-changed',  payload);
  const onScoresUpdated  = (payload: unknown) => send('scores-updated',   payload);

  sseBus.on('status-changed',  onStatusChanged);
  sseBus.on('scores-updated',  onScoresUpdated);

  // Initial bootstrap event so the client knows the connection is healthy
  send('heartbeat', { ts: new Date().toISOString(), bootstrap: true });

  // Clean up when the client disconnects
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    sseBus.off('status-changed',  onStatusChanged);
    sseBus.off('scores-updated',  onScoresUpdated);
    console.log(`[SSE] Client disconnected: ${clientId}`);
  });
}
