import { type workspaces } from '@angular-devkit/core';
import { SchematicsException } from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';
import { describe, expect, it } from 'vitest';

import { parseVersion } from '../../engine';
import { createFixtureTree } from '../../testing/run-schematic';
import {
  angularVersionOf,
  applicationsOf,
  buildOptions,
  globalStylesheet,
  hasBuildTarget,
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

    it('lists every application, never a library', async () => {
      expect(applicationsOf(await workspaceOf(workspaceWith()))).toEqual(['admin-app', 'fixture-app']);
    });
  });

  it('names an angular.json without projects', async () => {
    const workspace = stockWorkspace();
    workspace.projects = {};
    const definition = await workspaceOf(workspace);
    expect(() => resolveProject(definition, undefined)).toThrow(SchematicsException);
    expect(() => resolveProject(definition, undefined)).toThrow('angular.json lists no projects.');
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

describe('hasBuildTarget', () => {
  it('tells a project with a build target from one without', async () => {
    const workspace = stockWorkspace();
    const withTarget = (await workspaceOf(workspace)).projects.get('fixture-app');
    workspace.projects['fixture-app'].architect = {} as never;
    const without = (await workspaceOf(workspace)).projects.get('fixture-app');

    expect(withTarget !== undefined && hasBuildTarget(withTarget)).toBe(true);
    expect(without !== undefined && hasBuildTarget(without)).toBe(false);
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

  it('reads a wildcard minor as its lowest version, like ~21', () => {
    expect(versionOf('21.x')).toBe('21.0.0');
    expect(versionOf('21.2.x')).toBe('21.2.0');
  });

  it.each(['catalog:', 'workspace:*', 'latest', 'next', 'npm:@angular/core@21'])(
    'reads no version from %s',
    (range) => {
      expect(versionOf(range)).toBeUndefined();
    },
  );

  it.each(['^21.2.0', '~21', '>=21.2 <22', '21.x', '21.3.0-rc.1', 'catalog:', 'workspace:*', 'latest'])(
    'agrees with parseVersion on %s',
    (range) => {
      const parsed = parseVersion(range);
      const expected =
        parsed === undefined
          ? undefined
          : `${parsed.major}.${parsed.minor}.${parsed.patch}${parsed.prerelease.length === 0 ? '' : `-${parsed.prerelease.join('.')}`}`;
      expect(versionOf(range)).toBe(expected);
    },
  );
});

describe('angularVersionOf', () => {
  const installed = (version: string) => (path: string) =>
    path === 'node_modules/@angular/core/package.json' ? JSON.stringify({ name: '@angular/core', version }) : undefined;

  it('prefers the installed @angular/core over the declared range', () => {
    expect(angularVersionOf(installed('21.2.5'), 'catalog:')).toEqual({ version: '21.2.5', source: 'installed' });
    expect(angularVersionOf(installed('21.3.0-rc.1'), '^21.2.0')).toEqual({
      version: '21.3.0-rc.1',
      source: 'installed',
    });
  });

  it('falls back to the declared range without an installed package', () => {
    const none = () => undefined;
    expect(angularVersionOf(none, '~21.2.3')).toEqual({ version: '21.2.3', source: 'range' });
    expect(angularVersionOf(none, 'workspace:*')).toEqual({ version: undefined, source: undefined });
  });

  it('marks an installed manifest it cannot read and falls back to the range', () => {
    expect(angularVersionOf(() => '{ not json', '^21.2.0')).toEqual({ version: '21.2.0', source: 'unreadable' });
    expect(angularVersionOf(() => JSON.stringify({ name: '@angular/core' }), 'catalog:')).toEqual({
      version: undefined,
      source: 'unreadable',
    });
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

  it('skips a style entry the build does not inject', async () => {
    const entries = await entriesOf([{ input: 'src/print.scss', inject: false }, 'src/styles.css']);
    expect(entries).toEqual(['src/styles.css']);
    expect(globalStylesheet(entries)).toBe('src/styles.css');
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
