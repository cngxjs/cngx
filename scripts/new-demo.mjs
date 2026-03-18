// Usage: node scripts/new-demo.mjs --lib <lib> --name <name> [--category <category>]
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compodocInputsToControls } from './generate-demos.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DEMOS_ROOT = join(__dirname, '..', 'dev-app', 'src', 'app', 'demos');

/** 'data-source' → 'Data Source' */
function kebabToTitle(str) {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function renderControlSpec(ctrl) {
  switch (ctrl.type) {
    case 'bool':
      return `    { key: '${ctrl.key}', type: 'bool', label: '${ctrl.label}', default: ${ctrl.default ?? false} },`;
    case 'text':
      return `    { key: '${ctrl.key}', type: 'text', label: '${ctrl.label}', default: '${ctrl.default ?? ''}' },`;
    case 'number':
      return `    { key: '${ctrl.key}', type: 'number', label: '${ctrl.label}', default: ${ctrl.default ?? 0} },`;
    case 'select': {
      const opts = ctrl.options.map((o) => `{ label: '${o.label}', value: '${o.value}' }`).join(', ');
      return `    { key: '${ctrl.key}', type: 'select', label: '${ctrl.label}', options: [${opts}], default: '${ctrl.default}' },`;
    }
    case 'range':
      return `    { key: '${ctrl.key}', type: 'range', label: '${ctrl.label}', min: ${ctrl.min}, max: ${ctrl.max}, default: ${ctrl.default} },`;
  }
}

function buildStoryStub(options) {
  const { name, compodocMeta } = options;
  const title = kebabToTitle(name);
  const controls = compodocMeta ? compodocInputsToControls(compodocMeta.inputsClass ?? []) : [];
  const demoSpecDepth = options.category ? 4 : 3;
  const backSteps = '../'.repeat(demoSpecDepth);

  const controlsBlock =
    controls.length > 0
      ? [
          `  controls: [`,
          ...controls.map(renderControlSpec),
          `  ],`,
        ].join('\n')
      : null;

  const sectionTemplate = `<div><!-- TODO: add demo template --></div>`;

  return [
    `import type { DemoSpec } from '${backSteps}dev-tools/demo-spec';`,
    ``,
    `export const STORY: DemoSpec = {`,
    `  title: '${title}',`,
    ...(controlsBlock ? [controlsBlock] : []),
    `  sections: [`,
    `    {`,
    `      title: '${title}',`,
    `      // TODO: add subtitle, template, setup, imports`,
    `      template: \`${sectionTemplate}\`,`,
    `    },`,
    `  ],`,
    `};`,
    ``,
  ].join('\n');
}

/**
 * @param {{ lib: string, name: string, category?: string, compodocMeta?: object }} options
 * @param {string} [rootDir]  demos root directory (defaults to dev-app demos)
 */
export async function createDemoStub(options, rootDir = DEFAULT_DEMOS_ROOT) {
  const { lib, name, category } = options;
  const segments = [lib, ...(category ? [category] : []), `${name}-demo`];
  const demoDir = join(rootDir, ...segments);

  // Throw if already exists
  try {
    await access(demoDir);
    throw new Error(`Demo folder already exists: ${demoDir}`);
  } catch (err) {
    if (err.message.startsWith('Demo folder already exists')) throw err;
    // ENOENT — expected, continue
  }

  await mkdir(demoDir, { recursive: true });

  const storyContent = buildStoryStub(options);
  await writeFile(join(demoDir, `${name}-demo.story.ts`), storyContent);

  console.log(`Created: ${segments.join('/')}/${name}-demo.story.ts`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

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
  if (!args.lib || !args.name) {
    console.error('Usage: node scripts/new-demo.mjs --lib <lib> --name <name> [--category <cat>]');
    process.exit(1);
  }
  createDemoStub({ lib: args.lib, name: args.name, category: args.category }).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
