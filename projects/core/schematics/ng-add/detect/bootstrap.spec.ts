import { describe, expect, it } from 'vitest';

import { parseManifest } from '../../engine';
import { createFixtureTree } from '../../testing/run-schematic';
import { maturityOf, rootProvidersPath } from './bootstrap';

const NGMODULE_MAIN = `import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`;

const STOCK = parseManifest(createFixtureTree().readText('package.json'));

function withPackage(dependencies: Record<string, string>) {
  const manifest = JSON.parse(createFixtureTree().readText('package.json')) as { dependencies: Record<string, string> };
  return parseManifest(JSON.stringify({ ...manifest, dependencies: { ...manifest.dependencies, ...dependencies } }));
}

describe('rootProvidersPath', () => {
  it('takes the root NgModule as the provider target of an NgModule bootstrap', () => {
    expect(rootProvidersPath('src/main.ts', NGMODULE_MAIN, false, 'src')).toBe('src/app/app-module.ts');
  });

  it('follows the app config import of main.ts', () => {
    const main = createFixtureTree().readText('src/main.ts').replace("'./app/app.config'", "'./config/root.config'");
    expect(rootProvidersPath('src/main.ts', main, true, 'src')).toBe('src/config/root.config.ts');
  });

  it('keeps main.ts for a providers array written into the bootstrap call', () => {
    const main = "bootstrapApplication(App, { providers: [provideBrowserGlobalErrorListeners()] });\n";
    expect(rootProvidersPath('src/main.ts', main, true, 'src')).toBe('src/main.ts');
  });

  it('falls back to the scaffold path when main.ts names no config', () => {
    expect(rootProvidersPath('src/main.ts', 'bootstrapApplication(App);\n', true, 'src')).toBe('src/app/app.config.ts');
  });
});

describe('maturityOf', () => {
  it('calls an app with another UI library existing', () => {
    for (const library of ['@angular/material', 'primeng', 'tailwindcss', 'bootstrap']) {
      expect(maturityOf(1, withPackage({ [library]: '*' }), [])).toBe('existing');
    }
  });

  it('calls an app with providers beyond the scaffold existing', () => {
    expect(maturityOf(1, STOCK, ['provideBrowserGlobalErrorListeners', 'provideHttpClient'])).toBe('existing');
  });

  it('keeps the scaffold providers fresh', () => {
    expect(maturityOf(1, STOCK, ['provideZoneChangeDetection'])).toBe('fresh');
  });
});
