import { format } from 'prettier';
import { describe, expect, it } from 'vitest';

import { createFixtureTree, type FixtureName, readFixture } from '../../testing/run-schematic';
import {
  appShellOf,
  appShellSpecOf,
  FEEDBACK_SPEC_IMPORT,
  FEEDBACK_SPEC_PROVIDERS,
  inlineTemplateOf,
} from './app-shell';
import { type Read } from './workspace';

function readerOf(name: FixtureName, overrides: Readonly<Record<string, string>> = {}): Read {
  const tree = createFixtureTree(name, overrides);
  return (path) => (tree.exists(path) ? tree.readText(path) : undefined);
}

const NGMODULE_MAIN = `import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`;

const NGMODULE = `import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { App } from './app';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App]
})
export class AppModule { }
`;

const NGMODULE_APP = `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fixture-app');
}
`;

const INLINE_APP = `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: \`<router-outlet />\`,
})
export class App {}
`;

const PRETTIERRC = JSON.parse(readFixture('scaffold-21')['.prettierrc']) as Record<string, unknown>;

// The stock spec as the spec step leaves it: the import after the last import,
// the providers right after `imports: [App],`.
function providedSpec(stock: string): string {
  return stock
    .replace("import { App } from './app';\n", `import { App } from './app';\n${FEEDBACK_SPEC_IMPORT}\n`)
    .replace('      imports: [App],\n', `      imports: [App],\n      providers: [${FEEDBACK_SPEC_PROVIDERS}],\n`);
}

describe('appShellOf', () => {
  it('follows bootstrapApplication to the root component of the standalone app', () => {
    expect(appShellOf(readerOf('standalone-app'), 'src/main.ts', true, 'fixture-app')).toEqual({
      componentFile: 'src/app/app.ts',
      className: 'App',
      template: { kind: 'file', path: 'src/app/app.html' },
      importsHost: { file: 'src/app/app.ts', kind: 'component', className: 'App' },
      specPath: 'src/app/app.spec.ts',
      spec: 'absent',
      outlets: { kind: 'editable', elements: [], classes: [], routerOutlet: true },
    });
  });

  it('follows bootstrapModule to the bootstrap component and takes the NgModule as the imports host', () => {
    const read = readerOf('standalone-app', {
      'src/main.ts': NGMODULE_MAIN,
      'src/app/app-module.ts': NGMODULE,
      'src/app/app.ts': NGMODULE_APP,
    });

    expect(appShellOf(read, 'src/main.ts', false, 'fixture-app')).toMatchObject({
      componentFile: 'src/app/app.ts',
      className: 'App',
      template: { kind: 'file', path: 'src/app/app.html' },
      importsHost: { file: 'src/app/app-module.ts', kind: 'ng-module', className: 'AppModule' },
    });
  });

  it('reads an inline template', () => {
    const read = readerOf('standalone-app', { 'src/app/app.ts': INLINE_APP });

    expect(appShellOf(read, 'src/main.ts', true, 'fixture-app')?.template).toEqual({ kind: 'inline' });
  });

  it('resolves a templateUrl relative to the component file', () => {
    const read = readerOf('standalone-app', {
      'src/app/app.ts': readFixture('standalone-app')['src/app/app.ts'].replace("'./app.html'", "'../views/root.html'"),
      'src/views/root.html': '<router-outlet />\n',
    });

    expect(appShellOf(read, 'src/main.ts', true, 'fixture-app')?.template).toEqual({
      kind: 'file',
      path: 'src/views/root.html',
    });
  });

  it('picks the bootstrapped App, never the app-shell component it renders', () => {
    const shell = appShellOf(readerOf('existing-tailwind-app'), 'src/main.ts', true, 'tailwind-app');

    expect(shell).toMatchObject({ componentFile: 'src/app/app.ts', className: 'App' });
  });

  it('follows a re-exported class to the file declaring it', () => {
    const read = readerOf('standalone-app', {
      'src/main.ts': readFixture('standalone-app')['src/main.ts'].replace("'./app/app'", "'./app'"),
      'src/app/index.ts': "export { App } from './app';\n",
    });

    expect(appShellOf(read, 'src/main.ts', true, 'fixture-app')).toMatchObject({
      componentFile: 'src/app/app.ts',
      template: { kind: 'file', path: 'src/app/app.html' },
    });
  });

  it('follows a re-export through the AST when a comment names the class', () => {
    const read = readerOf('standalone-app', {
      'src/main.ts': readFixture('standalone-app')['src/main.ts'].replace("'./app/app'", "'./app'"),
      'src/app/index.ts': "// export class App lived here before the split\n// export { App } from './old';\nexport * from './app';\n",
    });

    expect(appShellOf(read, 'src/main.ts', true, 'fixture-app')).toMatchObject({
      componentFile: 'src/app/app.ts',
      template: { kind: 'file', path: 'src/app/app.html' },
    });
  });

  it('gives up on a bootstrap it cannot follow', () => {
    const viaAlias = readerOf('standalone-app', {
      'src/main.ts': "import { bootstrapApplication } from '@angular/platform-browser';\nimport { App } from '@app/root';\n\nbootstrapApplication(App);\n",
    });
    const viaCall = readerOf('standalone-app', {
      'src/main.ts': "import { bootstrapApplication } from '@angular/platform-browser';\n\nbootstrapApplication(rootComponent());\n",
    });

    expect(appShellOf(viaAlias, 'src/main.ts', true, 'fixture-app')).toBeUndefined();
    expect(appShellOf(viaCall, 'src/main.ts', true, 'fixture-app')).toBeUndefined();
  });

  it('gives up on a missing template file or a component without a template', () => {
    const missing = readerOf('standalone-app', {
      'src/app/app.ts': readFixture('standalone-app')['src/app/app.ts'].replace("'./app.html'", "'./gone.html'"),
    });
    const none = readerOf('standalone-app', {
      'src/app/app.ts': "import { Component } from '@angular/core';\n\n@Component({ selector: 'app-root' })\nexport class App {}\n",
    });

    expect(appShellOf(missing, 'src/main.ts', true, 'fixture-app')).toBeUndefined();
    expect(appShellOf(none, 'src/main.ts', true, 'fixture-app')).toBeUndefined();
  });

  it('finds the decorator through the AST when a template or a comment says class', () => {
    const inTemplate = readerOf('standalone-app', {
      'src/app/app.ts': INLINE_APP.replace('`<router-outlet />`', '`<p>The class list</p><router-outlet />`'),
    });
    const inComment = readerOf('standalone-app', {
      'src/app/app.ts': INLINE_APP.replace('export class App {}', '// the class App below is the root\nexport class App {}'),
    });

    expect(appShellOf(inTemplate, 'src/main.ts', true, 'fixture-app')).toMatchObject({
      template: { kind: 'inline' },
      outlets: { kind: 'editable', routerOutlet: true },
    });
    expect(appShellOf(inComment, 'src/main.ts', true, 'fixture-app')).toMatchObject({
      template: { kind: 'inline' },
      outlets: { kind: 'editable', routerOutlet: true },
    });
  });

  it('blocks the outlets of a component decorator that takes no object literal', () => {
    const read = readerOf('standalone-app', {
      'src/app/app.ts': "import { Component } from '@angular/core';\nimport { ROOT } from './root';\n\n@Component(ROOT)\nexport class App {}\n",
    });

    expect(appShellOf(read, 'src/main.ts', true, 'fixture-app')).toMatchObject({
      template: { kind: 'unread' },
      outlets: { kind: 'blocked', reason: 'the @Component decorator of App in src/app/app.ts takes no object literal' },
    });
  });

  it('reads the stock spec of the zoneless and the zone scaffold', () => {
    for (const name of ['scaffold-21', 'scaffold-21-zone'] as const) {
      expect(appShellOf(readerOf(name), 'src/main.ts', true, 'fixture-app')?.spec).toBe('stock');
    }
  });
});

describe('appShellOf outlets', () => {
  function outletsOf(overrides: Readonly<Record<string, string>>) {
    return appShellOf(readerOf('scaffold-21', overrides), 'src/main.ts', true, 'fixture-app')?.outlets;
  }

  it('reads the outlets in the template and the outlet classes imported into the component', () => {
    const app = readFixture('scaffold-21')['src/app/app.ts']
      .replace("import { RouterOutlet } from '@angular/router';", "import { RouterOutlet } from '@angular/router';\nimport { CngxToastOutlet } from '@cngx/ui/feedback';")
      .replace('imports: [RouterOutlet],', 'imports: [RouterOutlet, CngxToastOutlet, CngxBannerOutlet],');

    expect(outletsOf({ 'src/app/app.ts': app, 'src/app/app.html': '@if (on) { <cngx-banner-outlet /> }\n<router-outlet />\n' })).toEqual({
      kind: 'editable',
      elements: ['cngx-banner-outlet'],
      classes: ['CngxToastOutlet'],
      routerOutlet: true,
    });
  });

  it('reads a component without an imports property as editable', () => {
    const app = readFixture('scaffold-21')['src/app/app.ts'].replace('  imports: [RouterOutlet],\n', '');

    expect(outletsOf({ 'src/app/app.ts': app })).toMatchObject({ kind: 'editable', classes: [] });
  });

  it('blocks a template that does not parse, imports that are not a literal and an outlet name bound elsewhere', () => {
    const stock = readFixture('scaffold-21')['src/app/app.ts'];

    expect(outletsOf({ 'src/app/app.html': '<div>@if (</div>\n' })).toEqual({
      kind: 'blocked',
      reason: 'src/app/app.html does not parse as an Angular template',
    });
    expect(outletsOf({ 'src/app/app.ts': stock.replace('imports: [RouterOutlet],', 'imports: SHARED,') })).toEqual({
      kind: 'blocked',
      reason: 'the imports of App in src/app/app.ts are not an array literal',
    });
    expect(
      outletsOf({ 'src/app/app.ts': `import { CngxToastOutlet } from './toasts';\n${stock}` }),
    ).toEqual({ kind: 'blocked', reason: 'CngxToastOutlet in src/app/app.ts is bound to something other than @cngx/ui/feedback' });
  });

  it('blocks an inline template that interpolates', () => {
    const read = readerOf('standalone-app', { 'src/app/app.ts': INLINE_APP.replace('<router-outlet />', '${OUTLET}') });

    expect(appShellOf(read, 'src/main.ts', true, 'fixture-app')?.outlets).toMatchObject({ kind: 'blocked' });
  });

  it('blocks a quoted inline template that lacks an outlet, but not one that holds both', () => {
    const quoted = INLINE_APP.replace('`<router-outlet />`', "'<router-outlet />'");
    const placed = INLINE_APP.replace('`<router-outlet />`', '"<cngx-banner-outlet /><router-outlet /><cngx-toast-outlet />"');

    expect(appShellOf(readerOf('standalone-app', { 'src/app/app.ts': quoted }), 'src/main.ts', true, 'fixture-app')?.outlets).toEqual({
      kind: 'blocked',
      reason: 'the inline template of App is a quoted string, which cngx does not rewrite into a multi-line template',
    });
    expect(appShellOf(readerOf('standalone-app', { 'src/app/app.ts': placed }), 'src/main.ts', true, 'fixture-app')?.outlets).toMatchObject({
      kind: 'editable',
      elements: ['cngx-banner-outlet', 'cngx-toast-outlet'],
    });
  });
});

describe('inlineTemplateOf', () => {
  it('finds the text of a backtick or quoted inline template', () => {
    const quoted = "@Component({ selector: 'x', template: '<p>it\\'s</p>' })\nexport class App {}\n";

    expect(inlineTemplateOf(INLINE_APP, 'App')).toMatchObject({ text: '<router-outlet />', quoted: false });
    expect(inlineTemplateOf(quoted, 'App')).toMatchObject({ text: "<p>it\\'s</p>", quoted: true });
    expect(inlineTemplateOf(readFixture('scaffold-21')['src/app/app.ts'], 'App')).toBeUndefined();
  });
});

describe('appShellSpecOf', () => {
  const zoneless = readFixture('scaffold-21')['src/app/app.spec.ts'];
  const zone = readFixture('scaffold-21-zone')['src/app/app.spec.ts'];

  it('reads the stock spec for its own project name only', () => {
    expect(appShellSpecOf(zoneless, 'fixture-app')).toBe('stock');
    expect(appShellSpecOf(zone, 'fixture-app')).toBe('stock');
    expect(appShellSpecOf(zoneless, 'other-app')).toBe('custom');
  });

  it('reads a CRLF checkout of the stock spec as stock', () => {
    expect(appShellSpecOf(zoneless.replace(/\n/g, '\r\n'), 'fixture-app')).toBe('stock');
  });

  it('reads the stock spec with the feedback providers as provided, raw and formatted', async () => {
    for (const stock of [zoneless, zone]) {
      const provided = providedSpec(stock);
      const formatted = await format(provided, { ...PRETTIERRC, filepath: 'src/app/app.spec.ts' });

      expect(appShellSpecOf(provided, 'fixture-app')).toBe('provided');
      expect(appShellSpecOf(formatted, 'fixture-app')).toBe('provided');
    }
  });

  it('reads one changed character as custom', () => {
    expect(appShellSpecOf(zoneless.replace('should create the app', 'should create the App'), 'fixture-app')).toBe('custom');
    expect(appShellSpecOf(providedSpec(zoneless).replace('withBanners())', 'withBanners() )'), 'fixture-app')).toBe(
      'custom',
    );
  });

  it('reads the providers added twice as custom', () => {
    const twice = providedSpec(zoneless).replace(
      '      imports: [App],\n',
      `      imports: [App],\n      providers: [${FEEDBACK_SPEC_PROVIDERS}],\n`,
    );

    expect(appShellSpecOf(twice, 'fixture-app')).toBe('custom');
  });

  it('reads no spec as absent', () => {
    expect(appShellSpecOf(undefined, 'fixture-app')).toBe('absent');
  });
});
