import { type Rule, type SchematicContext } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { readWorkspace } from '@schematics/angular/utility';
import { describe, expect, it } from 'vitest';

import { addLockstepDependency } from '../engine';
import { createFixtureTree, readFixture, runRule } from './run-schematic';

describe('readFixture', () => {
  it('reads the stock standalone app with posix paths', () => {
    const files = Object.keys(readFixture('standalone-app'));

    expect(files).toEqual(
      expect.arrayContaining(['angular.json', 'package.json', 'src/main.ts', 'src/app/app.config.ts', 'src/styles.css']),
    );
  });

  it('reads the existing tailwind app, dotfiles included', () => {
    expect(Object.keys(readFixture('existing-tailwind-app')).sort()).toEqual([
      '.postcssrc.json',
      '.prettierrc',
      'angular.json',
      'package.json',
      'src/app/app.config.ts',
      'src/app/app.html',
      'src/app/app.routes.ts',
      'src/app/app.ts',
      'src/app/shell/shell.ts',
      'src/index.html',
      'src/main.ts',
      'src/styles.scss',
      'tsconfig.app.json',
      'tsconfig.json',
    ]);
  });

  it('reads the untouched ng new 21 scaffold with its stock spec and welcome page', () => {
    const files = readFixture('scaffold-21');

    expect(Object.keys(files).sort()).toEqual([
      '.prettierrc',
      'angular.json',
      'package.json',
      'src/app/app.config.ts',
      'src/app/app.css',
      'src/app/app.html',
      'src/app/app.routes.ts',
      'src/app/app.spec.ts',
      'src/app/app.ts',
      'src/index.html',
      'src/main.ts',
      'src/styles.css',
    ]);
    expect(files['src/app/app.html']).toContain('End of Placeholder');
    expect(files['src/index.html']).toContain('<link rel="icon" type="image/x-icon" href="favicon.ico">');
    expect(files['src/app/app.html']).toMatch(/<router-outlet \/>\n$/);
    expect(files['src/app/app.spec.ts']).toContain('await fixture.whenStable();');
    expect(files['src/app/app.css']).toBe('');
  });

  it('reads each scaffold variant with only its own difference', () => {
    const stock = readFixture('scaffold-21');
    const routingOff = readFixture('scaffold-21-routing-off');
    const zone = readFixture('scaffold-21-zone');
    const scss = readFixture('scaffold-21-scss');

    expect(routingOff['src/app/app.ts']).toContain('imports: [],');
    expect(routingOff['src/app/app.html']).not.toContain('<router-outlet');
    expect(routingOff['src/app/app.routes.ts']).toBeUndefined();
    expect(zone['src/app/app.spec.ts']).toContain('fixture.detectChanges();');
    expect(zone['src/app/app.spec.ts']).not.toContain('whenStable');
    expect(zone['angular.json']).toContain('"zone.js"');
    expect(zone['src/app/app.ts']).toBe(stock['src/app/app.ts']);
    expect(scss['src/app/app.ts']).toContain("styleUrl: './app.scss'");
    expect(scss['src/app/app.scss']).toBe('');
    expect(scss['src/app/app.css']).toBeUndefined();
    for (const variant of [routingOff, zone, scss]) {
      expect(variant['src/index.html']).toBe(stock['src/index.html']);
    }
  });

  it('reads the ng new 22 scaffold: sorted decorator keys, a split spec chain, every other shell file as on 21', () => {
    const variants = [
      ['scaffold-21', 'scaffold-22'],
      ['scaffold-21-routing-off', 'scaffold-22-routing-off'],
      ['scaffold-21-zone', 'scaffold-22-zone'],
      ['scaffold-21-scss', 'scaffold-22-scss'],
    ] as const;

    for (const [old, name] of variants) {
      const before = readFixture(old);
      const files = readFixture(name);
      expect({ name, files: Object.keys(files).sort() }).toEqual({ name, files: Object.keys(before).sort() });
      expect(files['src/app/app.ts']).toMatch(/@Component\(\{\n {2}imports: .*\n {2}selector: 'app-root',\n {2}styleUrl: .*\n {2}templateUrl: '\.\/app\.html',\n\}\)/);
      expect(files['src/app/app.spec.ts']).toContain('    })\n      .compileComponents();\n');
      for (const path of ['src/app/app.html', 'src/index.html', '.prettierrc', 'angular.json', 'src/main.ts']) {
        expect({ name, path, same: files[path] === before[path] }).toEqual({ name, path, same: true });
      }
    }
  });
});

describe('readFixture ng new --standalone=false', () => {
  it('reads the NgModule scaffold of both CLI majors: an AppModule, and a spec that declares App in its own TestBed', () => {
    for (const name of ['scaffold-21-ngmodule', 'scaffold-22-ngmodule'] as const) {
      const files = readFixture(name);
      expect({ name, module: files['src/app/app-module.ts']?.includes('bootstrap: [App]') }).toEqual({ name, module: true });
      expect({ name, declares: files['src/app/app.spec.ts'].includes('declarations: [\n        App\n      ],') }).toEqual({ name, declares: true });
      expect({ name, config: files['src/app/app.config.ts'] }).toEqual({ name, config: undefined });
    }
  });
});

describe('createFixtureTree', () => {
  it('is a workspace the @schematics/angular utilities can read', async () => {
    const workspace = await readWorkspace(createFixtureTree());

    expect([...workspace.projects.keys()]).toEqual(['fixture-app']);
  });

  it('reads the existing tailwind app as a workspace', async () => {
    const workspace = await readWorkspace(createFixtureTree('existing-tailwind-app'));

    expect([...workspace.projects.keys()]).toEqual(['tailwind-app']);
  });

  it('reads every scaffold variant as a workspace', async () => {
    for (const name of ['scaffold-21', 'scaffold-21-routing-off', 'scaffold-21-zone', 'scaffold-21-scss', 'scaffold-22', 'scaffold-22-routing-off', 'scaffold-22-zone', 'scaffold-22-scss', 'scaffold-21-ngmodule', 'scaffold-22-ngmodule'] as const) {
      const workspace = await readWorkspace(createFixtureTree(name));

      expect([...workspace.projects.keys()]).toEqual(['fixture-app']);
    }
  });

  it('applies overrides on top of the stock files', () => {
    const tree = createFixtureTree('standalone-app', {
      'src/styles.css': 'body {}\n',
      'eslint.config.js': 'module.exports = [];\n',
    });

    expect(tree.readContent('src/styles.css')).toBe('body {}\n');
    expect(tree.files).toContain('/eslint.config.js');
  });
});

describe('runRule', () => {
  it('returns the resulting tree and the log lines', async () => {
    const tree = createFixtureTree('standalone-app', {
      'package.json': JSON.stringify({ dependencies: { '@cngx/core': '^0.0.1' } }),
    });

    const rule: Rule = (_tree, context: SchematicContext) => {
      context.logger.info('pinning @cngx/core');
      return addLockstepDependency('@cngx/core', '0.1.0');
    };

    const run = await runRule(rule, tree);

    expect(JSON.parse(run.tree.readContent('package.json')).dependencies['@cngx/core']).toBe('0.1.0');
    expect(run.logs).toContain('pinning @cngx/core');
  });

  it('records the tasks the rule schedules', async () => {
    const rule: Rule = (_tree, context: SchematicContext) => {
      context.addTask(new NodePackageInstallTask());
    };

    const run = await runRule(rule, createFixtureTree());

    expect(run.tasks).toEqual(['node-package']);
  });
});
