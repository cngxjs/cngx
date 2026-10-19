import { readWorkspace } from '@schematics/angular/utility';
import { format } from 'prettier';
import { describe, expect, it } from 'vitest';

import { createFixtureTree, type FixtureName, readFixture } from '../../testing/run-schematic';
import { detectProject } from './detect';
import { matchesScaffoldEntry, starterFingerprintLine, starterFingerprintOf, withStarterFavicon } from './scaffold';

type Files = Readonly<Record<string, string>>;

const PRETTIERRC = JSON.parse(readFixture('scaffold-21')['.prettierrc']) as Record<string, unknown>;
const STOCK = readFixture('scaffold-21');

async function factsOf(fixture: FixtureName, files: Files = {}, remove: readonly string[] = []) {
  const tree = createFixtureTree(fixture, files);
  for (const path of remove) {
    tree.delete(path);
  }
  return detectProject(tree, await readWorkspace(tree));
}

async function formatted(content: string, path: string): Promise<string> {
  return format(content, { ...PRETTIERRC, filepath: path });
}

// One character changed in the middle of the file, the welcome page included.
function oneChanged(content: string): string {
  const at = Math.floor(content.length / 2);
  return `${content.slice(0, at)}${content[at] === 'x' ? 'y' : 'x'}${content.slice(at + 1)}`;
}

const CSS_FILES = { component: 'src/app/app.ts', template: 'src/app/app.html', stylesheet: 'src/app/app.css' };

describe('scaffoldOf', () => {
  it.each([
    ['scaffold-21', true, 'src/app/app.css', 'routing-css'],
    ['scaffold-21-routing-off', false, 'src/app/app.css', 'no-routing-css'],
    ['scaffold-21-zone', true, 'src/app/app.css', 'routing-css'],
    ['scaffold-21-scss', true, 'src/app/app.scss', 'routing-scss'],
  ] as const)('reads %s as the untouched scaffold', async (fixture, routing, stylesheet, variant) => {
    const facts = await factsOf(fixture);

    expect(facts.scaffold).toEqual({
      kind: 'untouched',
      files: { ...CSS_FILES, stylesheet },
      routing,
      variant,
      names: { project: 'fixture-app', selector: 'app-root' },
    });
  });

  it.each(['scaffold-21', 'scaffold-21-routing-off', 'scaffold-21-scss'] as const)(
    'reads %s as untouched after the CLI Prettier pass',
    async (fixture) => {
      const files = readFixture(fixture);
      const stylesheet = fixture === 'scaffold-21-scss' ? 'src/app/app.scss' : 'src/app/app.css';
      const facts = await factsOf(fixture, {
        'src/app/app.ts': await formatted(files['src/app/app.ts'], 'src/app/app.ts'),
        'src/app/app.html': await formatted(files['src/app/app.html'], 'src/app/app.html'),
        [stylesheet]: await formatted(files[stylesheet], stylesheet),
      });

      expect(facts.scaffold.kind).toBe('untouched');
    },
  );

  it('reads CRLF line endings as the untouched scaffold', async () => {
    const crlf = (path: string) => STOCK[path].replace(/\n/g, '\r\n');
    const facts = await factsOf('scaffold-21', { 'src/app/app.ts': crlf('src/app/app.ts'), 'src/app/app.html': crlf('src/app/app.html') });

    expect(facts.scaffold.kind).toBe('untouched');
  });

  it.each([
    ['app.ts', { 'src/app/app.ts': oneChanged(STOCK['src/app/app.ts']) }],
    ['the middle of the welcome page', { 'src/app/app.html': oneChanged(STOCK['src/app/app.html']) }],
    ['app.css', { 'src/app/app.css': ' ' }],
    ['an extra import', { 'src/app/app.ts': `import { NgClass } from '@angular/common';\n${STOCK['src/app/app.ts']}` }],
    ['the routing-off template with routing on', { 'src/app/app.html': readFixture('scaffold-21-routing-off')['src/app/app.html'] }],
    ['an inline template', { 'src/app/app.ts': STOCK['src/app/app.ts'].replace("templateUrl: './app.html'", 'template: `<router-outlet />`') }],
    ['an inline style', { 'src/app/app.ts': STOCK['src/app/app.ts'].replace("styleUrl: './app.css'", 'styles: []') }],
    ['a Less stylesheet', { 'src/app/app.ts': STOCK['src/app/app.ts'].replace('app.css', 'app.less'), 'src/app/app.less': '' }],
    ['another project name', { 'src/app/app.ts': STOCK['src/app/app.ts'].replace("signal('fixture-app')", "signal('other-app')") }],
    ['another selector', { 'src/app/app.ts': STOCK['src/app/app.ts'].replace("'app-root'", "'app-shell'") }],
  ])('reads one change in %s as custom', async (_name, files) => {
    expect((await factsOf('scaffold-21', files)).scaffold).toEqual({ kind: 'custom' });
  });

  it('reads a scaffold without its stylesheet as custom', async () => {
    expect((await factsOf('scaffold-21', {}, ['src/app/app.css'])).scaffold).toEqual({ kind: 'custom' });
  });

  it('reads an NgModule root as custom', async () => {
    const facts = await factsOf('scaffold-21', {
      'src/main.ts': "import { platformBrowser } from '@angular/platform-browser';\nimport { AppModule } from './app/app-module';\n\nplatformBrowser().bootstrapModule(AppModule);\n",
      'src/app/app-module.ts': "import { NgModule } from '@angular/core';\nimport { App } from './app';\n\n@NgModule({ declarations: [App], bootstrap: [App] })\nexport class AppModule {}\n",
    });

    expect(facts.scaffold).toEqual({ kind: 'custom' });
  });

  it('reads a scaffold without a prefix in angular.json as custom', async () => {
    const angular = STOCK['angular.json'].replace('      "prefix": "app",\n', '');
    expect((await factsOf('scaffold-21', { 'angular.json': angular })).scaffold).toEqual({ kind: 'custom' });
  });

  it('reads files that each record a starter fingerprint as a starter, also after Prettier', async () => {
    const files = {
      'src/app/app.ts': `${starterFingerprintLine('0000000a', 'block')}\nexport class App {}\n`,
      'src/app/app.html': `${starterFingerprintLine('0000000b', 'html')}\n<h1>Hello</h1>\n`,
      'src/app/app.css': `${starterFingerprintLine('0000000c', 'block')}\n:host{display:block}\n`,
    };
    const component = STOCK['src/app/app.ts'].replace('export class App', `${files['src/app/app.ts'].split('\n')[0]}\nexport class App`);
    const facts = await factsOf('scaffold-21', { ...files, 'src/app/app.ts': component });
    const pretty = await factsOf('scaffold-21', {
      'src/app/app.ts': await formatted(component, 'src/app/app.ts'),
      'src/app/app.html': await formatted(files['src/app/app.html'], 'src/app/app.html'),
      'src/app/app.css': await formatted(files['src/app/app.css'], 'src/app/app.css'),
    });

    for (const scaffold of [facts.scaffold, pretty.scaffold]) {
      expect(scaffold).toEqual({
        kind: 'starter',
        files: CSS_FILES,
        fingerprints: { component: '0000000a', template: '0000000b', stylesheet: '0000000c' },
        selector: 'app-root',
      });
    }
  });

  it('reads a starter with one file lacking its fingerprint as custom', async () => {
    const facts = await factsOf('scaffold-21', {
      'src/app/app.ts': STOCK['src/app/app.ts'].replace('export class App', '/* cngx:fingerprint 0000000a */\nexport class App'),
      'src/app/app.html': '<!-- cngx:fingerprint 0000000b -->\n',
    });

    expect(facts.scaffold).toEqual({ kind: 'custom' });
  });
});

describe('starterFingerprintOf', () => {
  it('reads the block and the HTML form on a line of their own, CRLF included', () => {
    expect(starterFingerprintOf('a\n/* cngx:fingerprint 1234abcd */\r\nb')).toBe('1234abcd');
    expect(starterFingerprintOf('<!-- cngx:fingerprint 1234abcd -->\n')).toBe('1234abcd');
    expect(starterFingerprintOf('const x = 1; /* cngx:fingerprint 1234abcd */\n')).toBeUndefined();
  });
});

describe('indexHtmlStateOf', () => {
  const index = STOCK['src/index.html'];

  it.each([
    ['the stock file', index, 'untouched'],
    ['the stock file after Prettier', undefined, 'untouched'],
    ['one changed character', index.replace('<title>FixtureApp</title>', '<title>FixtureAp</title>'), 'custom'],
    ['the starter link', withStarterFavicon(index), 'starter'],
    ['the starter link next to the stock one', withStarterFavicon(index).replace('</head>', '  <link rel="icon" type="image/x-icon" href="favicon.ico">\n</head>'), 'custom'],
  ] as const)('reads %s', async (_name, content, state) => {
    const html = content ?? (await formatted(index, 'src/index.html'));
    expect((await factsOf('scaffold-21', { 'src/index.html': html })).indexHtml).toEqual({ path: 'src/index.html', state });
  });

  it('reads the starter link after Prettier', async () => {
    const html = await formatted(withStarterFavicon(index), 'src/index.html');

    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="favicon.svg" />');
    expect((await factsOf('scaffold-21', { 'src/index.html': html })).indexHtml.state).toBe('starter');
    expect(withStarterFavicon(await formatted(index, 'src/index.html'))).toBe(html);
  });

  it('reads a missing index.html as absent', async () => {
    expect((await factsOf('scaffold-21', {}, ['src/index.html'])).indexHtml).toEqual({ path: 'src/index.html', state: 'absent' });
  });
});

describe('matchesScaffoldEntry', () => {
  const names = { project: 'fixture-app', selector: 'app-root' };

  it('matches a file only against the catalog entry of its own variant', () => {
    const routingOff = readFixture('scaffold-21-routing-off')['src/app/app.html'];

    expect(matchesScaffoldEntry(STOCK['src/app/app.html'], { file: 'app.html', variant: 'routing' }, names)).toBe(true);
    expect(matchesScaffoldEntry(routingOff, { file: 'app.html', variant: 'routing' }, names)).toBe(false);
    expect(matchesScaffoldEntry(STOCK['src/index.html'], { file: 'index.html', variant: 'default' }, names)).toBe(true);
    expect(matchesScaffoldEntry(STOCK['src/index.html'], { file: 'index.html', variant: 'default' }, { ...names, project: 'other' })).toBe(false);
  });
});

describe('faviconOf', () => {
  it('names favicon.svg in the public folder ng new lists and fingerprints what is there', async () => {
    expect((await factsOf('scaffold-21')).favicon).toEqual({ path: 'public/favicon.svg', fingerprint: undefined });
    expect((await factsOf('scaffold-21', { 'public/favicon.svg': '<svg/>' })).favicon?.fingerprint).toMatch(/^[0-9a-f]{8}$/);
  });

  it('names none when the build copies no public folder as a whole', async () => {
    const angular = STOCK['angular.json'].replace('"glob": "**/*"', '"glob": "*.ico"');

    expect((await factsOf('scaffold-21', { 'angular.json': angular })).favicon).toBeUndefined();
  });
});
