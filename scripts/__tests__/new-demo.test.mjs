import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDemoStub } from '../new-demo.mjs';

// ---------------------------------------------------------------------------
// createDemoStub — integration tests with real filesystem
// ---------------------------------------------------------------------------

describe('createDemoStub', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'cngx-new-demo-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('creates story file in correct location', async () => {
    await createDemoStub({ lib: 'common', category: 'behaviors', name: 'ripple' }, tmpDir);
    const storyPath = join(tmpDir, 'common', 'behaviors', 'ripple-demo', 'ripple-demo.story.ts');
    await expect(access(storyPath)).resolves.toBeUndefined();
  });

  it('creates story file with capitalised title', async () => {
    await createDemoStub({ lib: 'common', category: 'behaviors', name: 'ripple' }, tmpDir);
    const storyPath = join(tmpDir, 'common', 'behaviors', 'ripple-demo', 'ripple-demo.story.ts');
    const content = await readFile(storyPath, 'utf8');
    expect(content).toContain("title: 'Ripple'");
  });

  it('creates story file without category (flat lib structure)', async () => {
    await createDemoStub({ lib: 'data-display', name: 'treetable' }, tmpDir);
    const storyPath = join(tmpDir, 'data-display', 'treetable-demo', 'treetable-demo.story.ts');
    await expect(access(storyPath)).resolves.toBeUndefined();
  });

  it('stub has TODO comment in template', async () => {
    await createDemoStub({ lib: 'common', category: 'behaviors', name: 'ripple' }, tmpDir);
    const storyPath = join(tmpDir, 'common', 'behaviors', 'ripple-demo', 'ripple-demo.story.ts');
    const content = await readFile(storyPath, 'utf8');
    expect(content).toContain('TODO');
  });

  it('stub imports only DemoSpec type', async () => {
    await createDemoStub({ lib: 'common', category: 'behaviors', name: 'ripple' }, tmpDir);
    const storyPath = join(tmpDir, 'common', 'behaviors', 'ripple-demo', 'ripple-demo.story.ts');
    const content = await readFile(storyPath, 'utf8');
    expect(content).toContain("import type { DemoSpec }");
    // Must not import from Angular or any library
    expect(content).not.toContain("from '@angular");
    expect(content).not.toContain("from '@cngx");
  });

  it('stub has at least one section', async () => {
    await createDemoStub({ lib: 'common', category: 'behaviors', name: 'ripple' }, tmpDir);
    const storyPath = join(tmpDir, 'common', 'behaviors', 'ripple-demo', 'ripple-demo.story.ts');
    const content = await readFile(storyPath, 'utf8');
    expect(content).toContain('sections:');
  });

  it('stub includes default controls from compodocMeta when provided', async () => {
    const compodocMeta = {
      inputsClass: [
        { name: 'disabled', type: 'boolean', defaultValue: 'false' },
      ],
    };
    await createDemoStub({ lib: 'ui', name: 'button', compodocMeta }, tmpDir);
    const storyPath = join(tmpDir, 'ui', 'button-demo', 'button-demo.story.ts');
    const content = await readFile(storyPath, 'utf8');
    expect(content).toContain('controls:');
    expect(content).toContain('disabled');
  });

  it('throws when demo folder already exists', async () => {
    await createDemoStub({ lib: 'common', category: 'behaviors', name: 'ripple' }, tmpDir);
    await expect(
      createDemoStub({ lib: 'common', category: 'behaviors', name: 'ripple' }, tmpDir),
    ).rejects.toThrow();
  });
});
