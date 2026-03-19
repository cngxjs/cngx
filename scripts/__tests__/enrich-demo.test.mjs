import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildPrompt, parseEnrichResponse, writeEnrichOutput } from '../enrich-demo.mjs';

// ---------------------------------------------------------------------------
// buildPrompt
// ---------------------------------------------------------------------------

describe('buildPrompt', () => {
  const componentMeta = {
    name: 'CngxSort',
    selector: '[cngxSort]',
    description: 'Applies sort state to a host element.',
    inputsClass: [{ name: 'active', type: 'string | undefined', defaultValue: 'undefined' }],
    outputsClass: [],
    sourceCode: 'export class CngxSort { ... }',
  };

  const existingFixtures = [
    { name: 'people', path: 'fixtures/people.fixture.ts', exports: ['PEOPLE', 'Person'] },
  ];

  const referenceStories = [
    {
      name: 'filter',
      content: "import type { DemoSpec } from '...'; export const STORY: DemoSpec = { ... };",
    },
  ];

  it('contains the DemoSpec schema definition', () => {
    const prompt = buildPrompt(componentMeta, existingFixtures, referenceStories);
    expect(prompt).toContain('DemoSpec');
    expect(prompt).toContain('sections');
  });

  it('contains the component source code', () => {
    const prompt = buildPrompt(componentMeta, existingFixtures, referenceStories);
    expect(prompt).toContain(componentMeta.sourceCode);
  });

  it('contains the fixture inventory', () => {
    const prompt = buildPrompt(componentMeta, existingFixtures, referenceStories);
    expect(prompt).toContain('people');
    expect(prompt).toContain('PEOPLE');
  });

  it('contains the reference story', () => {
    const prompt = buildPrompt(componentMeta, existingFixtures, referenceStories);
    expect(prompt).toContain(referenceStories[0].content);
  });

  it('contains the component name and selector', () => {
    const prompt = buildPrompt(componentMeta, existingFixtures, referenceStories);
    expect(prompt).toContain('CngxSort');
    expect(prompt).toContain('[cngxSort]');
  });

  it('works with empty fixtures list', () => {
    const prompt = buildPrompt(componentMeta, [], referenceStories);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// parseEnrichResponse
// ---------------------------------------------------------------------------

describe('parseEnrichResponse', () => {
  it('extracts story block', () => {
    const response = `
<story>
import type { DemoSpec } from '../dev-tools/demo-spec';
export const STORY: DemoSpec = { title: 'Sort', sections: [] };
</story>
    `.trim();

    const result = parseEnrichResponse(response);
    expect(result.story).toContain("title: 'Sort'");
  });

  it('extracts single fixture block with name', () => {
    const response = `
<story>export const STORY = {};</story>

<fixture name="employees-tree">
export const EMPLOYEES_TREE = [];
</fixture>
    `.trim();

    const result = parseEnrichResponse(response);
    expect(result.fixtures.get('employees-tree')).toContain('EMPLOYEES_TREE');
  });

  it('extracts multiple fixture blocks', () => {
    const response = `
<story>export const STORY = {};</story>
<fixture name="people">export const PEOPLE = [];</fixture>
<fixture name="employees-tree">export const EMPLOYEES_TREE = [];</fixture>
    `.trim();

    const result = parseEnrichResponse(response);
    expect(result.fixtures.size).toBe(2);
    expect(result.fixtures.has('people')).toBe(true);
    expect(result.fixtures.has('employees-tree')).toBe(true);
  });

  it('returns empty fixtures Map when no fixture blocks', () => {
    const response = '<story>export const STORY = {};</story>';
    const result = parseEnrichResponse(response);
    expect(result.fixtures.size).toBe(0);
  });

  it('throws when story block is missing', () => {
    const response = '<fixture name="foo">export const FOO = [];</fixture>';
    expect(() => parseEnrichResponse(response)).toThrow();
  });

  it('story content does not include the XML tags', () => {
    const response = '<story>const x = 1;</story>';
    const result = parseEnrichResponse(response);
    expect(result.story).not.toContain('<story>');
    expect(result.story).not.toContain('</story>');
  });
});

// ---------------------------------------------------------------------------
// writeEnrichOutput — integration tests with real filesystem
// ---------------------------------------------------------------------------

describe('writeEnrichOutput', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'cngx-enrich-'));
    // Create fixtures dir with an empty index.ts
    await mkdir(join(tmpDir, 'fixtures'), { recursive: true });
    await writeFile(join(tmpDir, 'fixtures', 'index.ts'), '// fixtures\n');
    // Create demo dir
    await mkdir(join(tmpDir, 'demos', 'common', 'behaviors', 'sort-demo'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  const paths = (dir) => ({
    storyPath: join(dir, 'demos', 'common', 'behaviors', 'sort-demo', 'sort-demo.story.ts'),
    fixturesDir: join(dir, 'fixtures'),
    fixturesIndex: join(dir, 'fixtures', 'index.ts'),
  });

  it('writes story.ts file', async () => {
    const parsed = { story: "export const STORY = { title: 'Sort', sections: [] };", fixtures: new Map() };
    await writeEnrichOutput(parsed, paths(tmpDir));
    const content = await readFile(paths(tmpDir).storyPath, 'utf8');
    expect(content).toContain("title: 'Sort'");
  });

  it('writes new fixture files', async () => {
    const parsed = {
      story: "export const STORY = {};",
      fixtures: new Map([['people', 'export const PEOPLE = [];']]),
    };
    await writeEnrichOutput(parsed, paths(tmpDir));
    const fixturePath = join(tmpDir, 'fixtures', 'people.fixture.ts');
    const content = await readFile(fixturePath, 'utf8');
    expect(content).toContain('PEOPLE');
  });

  it('updates fixtures/index.ts with new export', async () => {
    const parsed = {
      story: "export const STORY = {};",
      fixtures: new Map([['people', "export const PEOPLE = [];\nexport interface Person {}"]]),
    };
    await writeEnrichOutput(parsed, paths(tmpDir));
    const index = await readFile(paths(tmpDir).fixturesIndex, 'utf8');
    expect(index).toContain("from './people.fixture'");
  });

  it('overwrites existing story.ts (with no error)', async () => {
    const p = paths(tmpDir);
    await writeFile(p.storyPath, 'old content');
    const parsed = { story: 'new content', fixtures: new Map() };
    await expect(writeEnrichOutput(parsed, p)).resolves.not.toThrow();
    const content = await readFile(p.storyPath, 'utf8');
    expect(content).toBe('new content');
  });

  it('does not overwrite existing fixture file — throws instead', async () => {
    const existingPath = join(tmpDir, 'fixtures', 'people.fixture.ts');
    await writeFile(existingPath, 'existing content');
    const parsed = {
      story: "export const STORY = {};",
      fixtures: new Map([['people', 'new content']]),
    };
    await expect(writeEnrichOutput(parsed, paths(tmpDir))).rejects.toThrow();
  });
});
