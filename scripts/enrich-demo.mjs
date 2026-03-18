// Usage: node scripts/enrich-demo.mjs --component <Name> [--fixture <name>]
import { readFile, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// DemoSpec schema (inlined for prompt context)
// ---------------------------------------------------------------------------

const DEMO_SPEC_SCHEMA = `
export interface DemoSpec {
  title: string;
  description?: string;
  controls?: ControlSpec[];
  sections: [SectionSpec, ...SectionSpec[]];
}

export type ControlSpec =
  | { key: string; type: 'bool'; label: string; default?: boolean }
  | { key: string; type: 'text'; label: string; default?: string; placeholder?: string }
  | { key: string; type: 'number'; label: string; default?: number; min?: number; max?: number; step?: number }
  | { key: string; type: 'range'; label: string; min: number; max: number; default: number; step?: number }
  | { key: string; type: 'select'; label: string; options: { label: string; value: string }[]; default: string };

export interface SectionSpec {
  title: string;
  subtitle?: string;
  template: string;
  setup?: string;
  imports?: string[];
}
`.trim();

// ---------------------------------------------------------------------------
// buildPrompt
// ---------------------------------------------------------------------------

/**
 * @param {{ name, selector, description, inputsClass, outputsClass, sourceCode }} componentMeta
 * @param {Array<{ name, path, exports }>} existingFixtures
 * @param {Array<{ name, content }>} referenceStories
 * @returns {string}
 */
export function buildPrompt(componentMeta, existingFixtures, referenceStories) {
  const fixtureInventory =
    existingFixtures.length > 0
      ? existingFixtures
          .map((f) => `  - ${f.name}: exports [${f.exports.join(', ')}] (${f.path})`)
          .join('\n')
      : '  (none)';

  const refStoriesBlock = referenceStories
    .map((s) => `### Reference story: ${s.name}\n\`\`\`ts\n${s.content}\n\`\`\``)
    .join('\n\n');

  return [
    `## Task`,
    `Write a DemoSpec story file for the Angular component/directive \`${componentMeta.name}\`.`,
    `Selector: \`${componentMeta.selector}\``,
    ``,
    `## DemoSpec Schema`,
    `\`\`\`ts`,
    DEMO_SPEC_SCHEMA,
    `\`\`\``,
    ``,
    `## Component metadata`,
    `Name: ${componentMeta.name}`,
    `Selector: ${componentMeta.selector}`,
    `Description: ${componentMeta.description ?? '(none)'}`,
    ``,
    `Inputs:`,
    ...(componentMeta.inputsClass ?? []).map(
      (inp) => `  - ${inp.name}: ${inp.type} (default: ${inp.defaultValue ?? 'undefined'})`,
    ),
    ``,
    `Outputs:`,
    ...(componentMeta.outputsClass ?? []).map((out) => `  - ${out.name}`),
    ``,
    `## Component source code`,
    `\`\`\`ts`,
    componentMeta.sourceCode,
    `\`\`\``,
    ``,
    `## Available fixtures`,
    fixtureInventory,
    ``,
    refStoriesBlock,
    ``,
    `## Instructions`,
    `- Write a complete DemoSpec story covering the main use cases.`,
    `- If complex data is needed (e.g. Node<T>[], T[]), create a fixture and reference it.`,
    `- Respond ONLY with structured blocks — no prose outside the blocks.`,
    `- Format:`,
    `  <story>`,
    `  // story.ts content`,
    `  </story>`,
    ``,
    `  <fixture name="fixture-name">`,
    `  // fixture content (only if needed)`,
    `  </fixture>`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// parseEnrichResponse
// ---------------------------------------------------------------------------

/**
 * @param {string} response  raw Claude API response text
 * @returns {{ story: string, fixtures: Map<string, string> }}
 */
export function parseEnrichResponse(response) {
  const storyMatch = response.match(/<story>([\s\S]*?)<\/story>/);
  if (!storyMatch) {
    throw new Error('No <story> block found in response');
  }

  const story = storyMatch[1].trim();

  const fixtures = new Map();
  for (const match of response.matchAll(/<fixture name="([^"]+)">([\s\S]*?)<\/fixture>/g)) {
    fixtures.set(match[1], match[2].trim());
  }

  return { story, fixtures };
}

// ---------------------------------------------------------------------------
// writeEnrichOutput
// ---------------------------------------------------------------------------

/**
 * @param {{ story: string, fixtures: Map<string, string> }} parsed
 * @param {{ storyPath: string, fixturesDir: string, fixturesIndex: string }} paths
 */
export async function writeEnrichOutput(parsed, paths) {
  // Write (overwrite) the story file
  await writeFile(paths.storyPath, parsed.story);

  // Write each fixture (refuse to overwrite existing)
  for (const [name, content] of parsed.fixtures) {
    const fixturePath = join(paths.fixturesDir, `${name}.fixture.ts`);

    let exists = false;
    try {
      await access(fixturePath);
      exists = true;
    } catch {
      // ENOENT — file does not exist
    }

    if (exists) {
      throw new Error(
        `Fixture already exists: ${name}.fixture.ts. Delete it manually if you want to regenerate.`,
      );
    }

    await writeFile(fixturePath, content);

    // Append re-export to fixtures/index.ts
    const indexContent = await readFile(paths.fixturesIndex, 'utf8');
    await writeFile(paths.fixturesIndex, `${indexContent}export * from './${name}.fixture';\n`);
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function loadCompodocJson() {
  const compodocPath = join(WORKSPACE_ROOT, '.compodoc', 'documentation.json');
  const raw = await readFile(compodocPath, 'utf8');
  return JSON.parse(raw);
}

function findComponentMeta(compodocData, componentName) {
  for (const section of ['directives', 'components', 'classes', 'injectables']) {
    const found = (compodocData[section] ?? []).find((c) => c.name === componentName);
    if (found) return found;
  }
  return null;
}

async function loadReferenceStories(demosRoot, count = 2) {
  const { readdir } = await import('node:fs/promises');
  const stories = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (stories.length >= count) return;
      if (entry.isDirectory()) {
        await walk(join(dir, entry.name));
      } else if (entry.name.endsWith('.story.ts')) {
        const content = await readFile(join(dir, entry.name), 'utf8');
        stories.push({ name: entry.name.replace('.story.ts', ''), content });
      }
    }
  }
  await walk(demosRoot);
  return stories;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.component) {
    console.error('Usage: node scripts/enrich-demo.mjs --component <Name> [--fixture <name>]');
    process.exit(1);
  }

  const DEMOS_ROOT = join(WORKSPACE_ROOT, 'dev-app', 'src', 'app', 'demos');
  const FIXTURES_DIR = join(WORKSPACE_ROOT, 'dev-app', 'src', 'app', 'fixtures');
  const FIXTURES_INDEX = join(FIXTURES_DIR, 'index.ts');

  (async () => {
    const compodocData = await loadCompodocJson();
    const componentMeta = findComponentMeta(compodocData, args.component);
    if (!componentMeta) {
      console.error(`Component not found in compodoc: ${args.component}`);
      process.exit(1);
    }

    const referenceStories = await loadReferenceStories(DEMOS_ROOT);
    const prompt = buildPrompt(componentMeta, [], referenceStories);

    // Call Claude API
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const parsed = parseEnrichResponse(responseText);

    // Determine story path
    // Find the demo folder matching the component selector heuristic
    const compName = args.component.replace(/^Cngx/, '').toLowerCase();
    const storyPath = join(DEMOS_ROOT, '**', `${compName}-demo`, `${compName}-demo.story.ts`);

    console.log('Generated story:');
    console.log(parsed.story);
    if (parsed.fixtures.size > 0) {
      console.log('\nGenerated fixtures:');
      for (const [name] of parsed.fixtures) {
        console.log(`  - ${name}.fixture.ts`);
      }
    }
    console.log('\nReview the output above, then commit.');
  })().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
