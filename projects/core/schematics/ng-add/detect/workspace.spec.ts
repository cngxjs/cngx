import { type workspaces } from '@angular-devkit/core';
import { readWorkspace } from '@schematics/angular/utility';
import { describe, expect, it } from 'vitest';

import { createFixtureTree } from '../../testing/run-schematic';
import {
  angularVersionOf,
  buildOptions,
  globalStylesheet,
  resolveProject,
  sourceLocaleOf,
  styleEntries,
  versionOf,
} from './workspace';

type WorkspaceJson = {
  projects: Record<string, { architect: { build: { options: Record<string, unknown> } } } & Record<string, unknown>>;
} & Record<string, unknown>;

function stockWorkspace(): WorkspaceJson {
  return JSON.parse(createFixtureTree().readText('angular.json')) as WorkspaceJson;
}

async function workspaceOf(angularJson: WorkspaceJson): Promise<workspaces.WorkspaceDefinition> {
  return readWorkspace(createFixtureTree('standalone-app', { 'angular.json': JSON.stringify(angularJson) }));
}

describe('resolveProject', () => {
  it('resolves the named project and refuses an unknown one', async () => {
    const workspace = await workspaceOf(stockWorkspace());
    expect(resolveProject(workspace, 'fixture-app')[0]).toBe('fixture-app');
    expect(() => resolveProject(workspace, 'missing')).toThrow('Project "missing" not found in angular.json.');
  });

  describe('in a workspace with several projects', () => {
    function workspaceWith(defaultProject?: string): WorkspaceJson {
      const workspace = stockWorkspace();
      const app = workspace.projects['fixture-app'];
      workspace.projects = {
        'shared-lib': { ...app, root: 'projects/shared-lib', projectType: 'library' },
        'admin-app': { ...app, root: 'projects/admin-app' },
        'fixture-app': app,
      };
      if (defaultProject !== undefined) {
        workspace['defaultProject'] = defaultProject;
      }
      return workspace;
    }

    it('takes --project first', async () => {
      expect(resolveProject(await workspaceOf(workspaceWith('admin-app')), 'fixture-app')[0]).toBe('fixture-app');
    });

    it('takes defaultProject when --project is unset', async () => {
      expect(resolveProject(await workspaceOf(workspaceWith('fixture-app')), undefined)[0]).toBe('fixture-app');
    });

    it('takes the first application, past a library, without either', async () => {
      expect(resolveProject(await workspaceOf(workspaceWith()), undefined)[0]).toBe('admin-app');
    });
  });

  it('refuses a library project', async () => {
    const workspace = stockWorkspace();
    workspace.projects['fixture-app']['projectType'] = 'library';
    const definition = await workspaceOf(workspace);
    expect(() => resolveProject(definition, undefined)).toThrow(
      'Project "fixture-app" is a library; cngx ng-add sets up an application.',
    );
  });
});

describe('versionOf', () => {
  it('reads the Angular version from the declared @angular/core range', () => {
    expect(versionOf('~21.2.3')).toBe('21.2.3');
    expect(versionOf('21.2.5')).toBe('21.2.5');
    expect(versionOf('>=21.2.0 <22.0.0')).toBe('21.2.0');
    expect(versionOf('^19')).toBe('19.0.0');
    expect(versionOf(undefined)).toBeUndefined();
  });

  it.each(['catalog:', 'workspace:*', 'latest', 'next', '21.x', 'npm:@angular/core@21'])(
    'reads no version from %s',
    (range) => {
      expect(versionOf(range)).toBeUndefined();
    },
  );
});

describe('angularVersionOf', () => {
  const installed = (version: string) => (path: string) =>
    path === 'node_modules/@angular/core/package.json' ? JSON.stringify({ name: '@angular/core', version }) : undefined;

  it('prefers the installed @angular/core over the declared range', () => {
    expect(angularVersionOf(installed('21.2.5'), 'catalog:')).toBe('21.2.5');
    expect(angularVersionOf(installed('21.3.0-rc.1'), '^21.2.0')).toBe('21.3.0-rc.1');
  });

  it('falls back to the declared range without an installed package', () => {
    const none = () => undefined;
    expect(angularVersionOf(none, '~21.2.3')).toBe('21.2.3');
    expect(angularVersionOf(none, 'workspace:*')).toBeUndefined();
  });

  it('ignores an installed manifest it cannot read', () => {
    expect(angularVersionOf(() => '{ not json', '^21.2.0')).toBe('21.2.0');
  });
});

describe('globalStylesheet', () => {
  async function entriesOf(styles: readonly unknown[]): Promise<readonly string[]> {
    const workspace = stockWorkspace();
    const build = workspace.projects['fixture-app'].architect.build;
    build.options = { ...build.options, styles };
    const project = (await workspaceOf(workspace)).projects.get('fixture-app');
    return project === undefined ? [] : styleEntries(buildOptions(project));
  }

  it('reads the global stylesheet from the first build style entry', async () => {
    expect(globalStylesheet(await entriesOf([{ input: 'src/styles.scss', bundleName: 'styles' }]))).toBe(
      'src/styles.scss',
    );
  });

  it('reads no stylesheet when the build has no style entry', async () => {
    expect(globalStylesheet(await entriesOf([]))).toBeUndefined();
  });
});

describe('sourceLocaleOf', () => {
  it('reads the i18n source locale in both workspace shapes', async () => {
    const localeOf = async (sourceLocale: unknown): Promise<string | undefined> => {
      const workspace = stockWorkspace();
      workspace.projects['fixture-app']['i18n'] = { sourceLocale };
      const project = (await workspaceOf(workspace)).projects.get('fixture-app');
      return project === undefined ? undefined : sourceLocaleOf(project);
    };
    expect(await localeOf('ar')).toBe('ar');
    expect(await localeOf({ code: 'he', baseHref: '/he/' })).toBe('he');
  });
});
