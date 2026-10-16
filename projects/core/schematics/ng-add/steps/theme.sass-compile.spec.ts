import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { compileString, type FileImporter } from 'sass';
import { describe, expect, it } from 'vitest';

import { createFixtureTree, readFixture, runRule } from '../../testing/run-schematic';
import { ngAdd } from '../index';

const ROOT = join(__dirname, '..', '..', '..', '..', '..');

// The published `@cngx/themes` package is `projects/themes` in this repo.
const THEMES: FileImporter = {
  findFileUrl(url) {
    return url.startsWith('@cngx/themes/')
      ? new URL(url.slice('@cngx/themes/'.length), pathToFileURL(join(ROOT, 'projects', 'themes') + '/'))
      : null;
  },
};

function compile(source: string): string {
  return compileString(source, {
    loadPaths: [join(ROOT, 'node_modules')],
    importers: [THEMES],
    url: pathToFileURL(join(ROOT, 'src', 'styles.scss')),
  }).css;
}

function scssApp(stylesheet: string): Record<string, string> {
  const workspace = JSON.parse(readFixture('standalone-app')['angular.json']) as {
    projects: Record<string, Record<string, any>>;
  };
  workspace.projects['fixture-app']['architect'].build.options.styles = ['src/styles.scss'];
  const manifest = JSON.parse(readFixture('standalone-app')['package.json']) as Record<string, any>;
  manifest['dependencies'] = { ...manifest['dependencies'], '@angular/material': '^21.2.0', '@angular/cdk': '^21.2.0' };
  return {
    'angular.json': JSON.stringify(workspace, null, 2),
    'package.json': JSON.stringify(manifest, null, 2),
    'src/styles.scss': stylesheet,
  };
}

const MAP_API = `@use '@angular/material' as mat;

html {
  @include mat.theme((color: (primary: mat.$azure-palette), typography: Roboto, density: 0));
}
`;

const DEFINE_THEME = `@use '@angular/material' as mat;

$theme: mat.define-theme((color: (theme-type: light, primary: mat.$violet-palette)));

html {
  @include mat.all-component-themes($theme);
}
`;

const M2_THEME = `@use '@angular/material' as mat;

$theme: mat.m2-define-light-theme((
  color: (primary: mat.m2-define-palette(mat.$m2-indigo-palette), accent: mat.m2-define-palette(mat.$m2-pink-palette)),
));

html {
  @include mat.all-component-themes($theme);
}
`;

describe('the Material bridge compiles', () => {
  it.each([
    ['a mat.theme() map', MAP_API],
    ['a define-theme object', DEFINE_THEME],
    ['an M2 object', M2_THEME],
  ])('for %s', async (_, stylesheet) => {
    const run = await runRule(ngAdd({ theme: 'material' }), createFixtureTree('standalone-app', scssApp(stylesheet)));

    expect(() => compile(run.tree.readContent('src/styles.scss'))).not.toThrow();
    if (run.tree.exists('src/cngx-theme.scss')) {
      expect(() => compile(run.tree.readContent('src/cngx-theme.scss'))).not.toThrow();
    }
  });
});
