import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { loadBundledDocs, loadDocsFromFile, loadLlmDumpFromFile } from './core/data/loader.js';
import { createServer } from './server.js';

const DOCS_FIXTURE = fileURLToPath(new URL('../test/fixtures/documentation.sample.json', import.meta.url));
const NEW_FIXTURE = fileURLToPath(new URL('../test/fixtures/documentation.v-new.sample.json', import.meta.url));
const LLM_FIXTURE = fileURLToPath(new URL('../test/fixtures/llm-context.sample.md', import.meta.url));

describe('createServer', () => {

  it('builds a transport-free server whose instructions ground against the loaded snapshot', async () => {
    const server = createServer({
      docs: loadDocsFromFile(DOCS_FIXTURE),
      llmDump: loadLlmDumpFromFile(LLM_FIXTURE),
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'server-spec', version: '0.0.0' });
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const { tools } = await client.listTools();

    expect(client.getInstructions()).toContain('cngx 0.1.0-rc.6');
    expect(tools).toHaveLength(9);
    await client.close();
  });

  it('answers a version-scoped tool call through the registry adapter', async () => {
    const docs = loadDocsFromFile(DOCS_FIXTURE);
    const server = createServer({ docs, llmDump: null });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'server-spec', version: '0.0.0' });
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({ name: 'get_api', arguments: { name: 'CngxSelect' } });
    const [content] = result.content as { type: string; text: string }[];
    const answer = JSON.parse(content!.text) as { ok: boolean; groundedVersion: string; result: { name: string } };

    expect(answer).toMatchObject({ ok: true, groundedVersion: '0.1.0-rc.6', result: { name: 'CngxSelect' } });
    await client.close();
  });

  // The CLI drops this envelope; the MCP wire keeps it for every name tool, get_story_example included.
  it('answers get_story_example inside the versioned envelope', async () => {
    const docs = loadBundledDocs(fileURLToPath(new URL('../data/', import.meta.url)));
    const server = createServer({ docs, llmDump: null });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'server-spec', version: '0.0.0' });
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const answerFor = async (name: string) => {
      const result = await client.callTool({ name: 'get_story_example', arguments: { name } });
      const [content] = result.content as { type: string; text: string }[];
      return JSON.parse(content!.text) as Record<string, unknown>;
    };
    const found = await answerFor('CngxTreeSelect');
    const unknown = await answerFor('CngxDoesNotExist');

    expect(Object.keys(found)).toEqual(['ok', 'groundedVersion', 'result']);
    expect(found).toMatchObject({ ok: true, groundedVersion: docs.meta.cngxVersion, result: { name: 'CngxTreeSelect' } });
    expect(unknown).toEqual({ ok: true, groundedVersion: docs.meta.cngxVersion, result: null });
    await client.close();
  });

  it('resolves a requested version through the injected resolver deps', async () => {
    const fetchSnapshot = vi.fn(async () => ({ ok: true as const, path: NEW_FIXTURE }));
    const server = createServer({
      docs: loadDocsFromFile(DOCS_FIXTURE),
      llmDump: null,
      resolverDeps: { fetchSnapshot, loadDocs: loadDocsFromFile },
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'server-spec', version: '0.0.0' });
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({ name: 'get_api', arguments: { name: 'CngxSelect', version: '0.2.0' } });
    const [content] = result.content as { type: string; text: string }[];
    const answer = JSON.parse(content!.text) as { ok: boolean; groundedVersion: string };

    expect(answer).toMatchObject({ ok: true, groundedVersion: '0.2.0' });
    expect(fetchSnapshot).toHaveBeenCalledExactlyOnceWith('0.2.0');
    await client.close();
  });
});
