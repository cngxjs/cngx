// Real-timer proof that both fetch paths give up. Contract row: "network
// blackholed (no answer)" in the cli-core plan's snapshot-source matrix - gh and
// fetch each abort after SNAPSHOT_FETCH_TIMEOUT_MS and the result is `network`.
// The timeout is injected at 200 ms; the stand-ins are a node child that never
// exits (for gh) and a local HTTP server that never responds (for HTTPS).

import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { classifyGhFailure, createDefaultDeps, fetchSnapshot, SNAPSHOT_FETCH_TIMEOUT_MS } from './snapshot-fetch.js';

describe('snapshot fetch timeouts', () => {
  let silent: Server;
  let silentUrl: string;

  beforeAll(async () => {
    silent = createServer(() => undefined);
    await new Promise<void>((resolve) => silent.listen(0, '127.0.0.1', resolve));
    silentUrl = `http://127.0.0.1:${(silent.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    silent.closeAllConnections();
    await new Promise<void>((resolve) => silent.close(() => resolve()));
  });

  it('kills a hung gh child and classifies it as network', async () => {
    const { runGh } = createDefaultDeps({ timeoutMs: 200, ghBinary: process.execPath });
    const started = Date.now();

    const error = await runGh(['-e', 'setInterval(() => {}, 1e9)']).then(
      () => null,
      (rejection: unknown) => rejection,
    );

    expect(error).not.toBeNull();
    expect(classifyGhFailure(error).reason).toBe('network');
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('aborts a silent HTTPS endpoint and returns network', async () => {
    const deps = {
      ...createDefaultDeps({ timeoutMs: 200, releaseBaseUrl: silentUrl }),
      runGh: async () => {
        throw Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' });
      },
    };
    const started = Date.now();

    const result = await fetchSnapshot('0.2.0', deps);

    expect(result).toMatchObject({ ok: false, reason: 'network' });
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('releases the connection of a non-200 response instead of leaving its body unread', async () => {
    let closed!: () => void;
    const connectionClosed = new Promise<void>((resolve) => (closed = resolve));
    const streaming = createServer((_req, res) => {
      res.on('close', closed);
      res.writeHead(503);
      res.write('x'.repeat(1024));
    });
    await new Promise<void>((resolve) => streaming.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(streaming.address() as AddressInfo).port}`;
    const { httpGet } = createDefaultDeps({ timeoutMs: 5000 });

    try {
      expect(await httpGet(url)).toEqual({ status: 503, body: '' });
      await connectionClosed;
    } finally {
      streaming.closeAllConnections();
      await new Promise<void>((resolve) => streaming.close(() => resolve()));
    }
  });

  it('uses a 15 s production timeout', () => {
    expect(SNAPSHOT_FETCH_TIMEOUT_MS).toBe(15_000);
    expect(createDefaultDeps().timeoutMs).toBe(SNAPSHOT_FETCH_TIMEOUT_MS);
  });
});
