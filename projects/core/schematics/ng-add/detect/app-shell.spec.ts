import { format } from 'prettier';
import { describe, expect, it } from 'vitest';

import { createFixtureTree, type FixtureName, readFixture } from '../../testing/run-schematic';
import { appShellOf, appShellSpecOf, FEEDBACK_SPEC_IMPORT, FEEDBACK_SPEC_PROVIDERS } from './app-shell';
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
      importsHost: { file: 'src/app/app.ts', kind: 'component' },
      specPath: 'src/app/app.spec.ts',
      spec: 'absent',
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
      importsHost: { file: 'src/app/app-module.ts', kind: 'ng-module' },
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

  it('reads the stock spec of the zoneless and the zone scaffold', () => {
    for (const name of ['scaffold-21', 'scaffold-21-zone'] as const) {
      expect(appShellOf(readerOf(name), 'src/main.ts', true, 'fixture-app')?.spec).toBe('stock');
    }
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
