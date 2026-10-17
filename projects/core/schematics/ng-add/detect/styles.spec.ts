import { describe, expect, it } from 'vitest';

import { createProvenanceStamp, type PackageManifest, parseManifest } from '../../engine';
import { createFixtureTree } from '../../testing/run-schematic';
import { detectMaterial, detectTailwind, existingCngxTheme, importsCngxStylesheet } from './styles';
import { globalStylesheet, type Read } from './workspace';

const MAP_API_THEME = `@use '@angular/material' as mat;

html {
  height: 100%;
  @include mat.theme((
    color: (
      primary: mat.$azure-palette,
      tertiary: mat.$blue-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}
`;

const DEFINE_THEME = `@use '@angular/material' as mat;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$violet-palette),
  density: (scale: -2),
));

html {
  @include mat.all-component-themes($theme);
}
`;

const M2_THEME = `@use '@angular/material' as mat;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $primary)));
@include mat.all-component-themes($theme);
`;

function readerOf(files: Readonly<Record<string, string>>): Read {
  return (path) => files[path];
}

function withPackage(dependencies: Record<string, string>): PackageManifest {
  const manifest = JSON.parse(createFixtureTree().readText('package.json')) as { dependencies: Record<string, string> };
  return parseManifest(JSON.stringify({ ...manifest, dependencies: { ...manifest.dependencies, ...dependencies } }));
}

const STOCK = parseManifest(createFixtureTree().readText('package.json'));

describe('detectMaterial', () => {
  const material = withPackage({ '@angular/material': '^21.2.0' });

  it('reads the map API from the global stylesheet of an scss app', () => {
    expect(detectMaterial(readerOf({ 'src/styles.scss': MAP_API_THEME }), material, ['src/styles.scss'])).toEqual({
      present: true,
      themeShape: 'map-api',
      themePath: 'src/styles.scss',
      themeVariable: undefined,
      density: 0,
    });
  });

  it('reads the map API from the separate theme file Material writes for a css app', () => {
    const entries = ['src/material-theme.scss', 'src/styles.css'];
    const read = readerOf({ 'src/material-theme.scss': MAP_API_THEME.replace('density: 0', 'density: -2') });
    expect(globalStylesheet(entries)).toBe('src/styles.css');
    expect(detectMaterial(read, material, entries)).toEqual({
      present: true,
      themeShape: 'map-api',
      themePath: 'src/material-theme.scss',
      themeVariable: undefined,
      density: -2,
    });
  });

  it('honours a custom @use namespace', () => {
    const content = MAP_API_THEME.replace("as mat;", 'as material;').replace('@include mat.theme', '@include material.theme');
    expect(detectMaterial(readerOf({ 'src/styles.scss': content }), material, ['src/styles.scss']).themeShape).toBe(
      'map-api',
    );
  });

  it('reads a define-theme object and its density scale', () => {
    expect(detectMaterial(readerOf({ 'src/styles.scss': DEFINE_THEME }), material, ['src/styles.scss'])).toEqual({
      present: true,
      themeShape: 'define-theme',
      themePath: 'src/styles.scss',
      themeVariable: 'theme',
      density: -2,
    });
  });

  it('reads an M2 theme', () => {
    const facts = detectMaterial(readerOf({ 'src/styles.scss': M2_THEME }), material, ['src/styles.scss']);
    expect(facts.themeShape).toBe('m2');
    expect(facts.themeVariable).toBe('theme');
  });

  it('reads a prebuilt theme entry', () => {
    const entries = ['@angular/material/prebuilt-themes/azure-blue.css', 'src/styles.css'];
    expect(detectMaterial(readerOf({}), material, entries)).toEqual({
      present: true,
      themeShape: 'prebuilt',
      themePath: '@angular/material/prebuilt-themes/azure-blue.css',
      themeVariable: undefined,
      density: 0,
    });
    expect(globalStylesheet(entries)).toBe('src/styles.css');
  });

  it('reports no theme when Material is installed but unthemed', () => {
    expect(detectMaterial(readerOf({ 'src/styles.css': '' }), material, ['src/styles.css'])).toEqual({
      present: true,
      themeShape: 'none',
      themePath: undefined,
      themeVariable: undefined,
      density: 0,
    });
  });
});

describe('cngx theme wiring', () => {
  it('sees cngx.css imported by a global stylesheet or listed as a style entry', () => {
    expect(
      importsCngxStylesheet(readerOf({ 'src/styles.css': "@import '@cngx/themes/cngx.css';\n" }), ['src/styles.css']),
    ).toBe(true);
    expect(importsCngxStylesheet(readerOf({}), ['@cngx/themes/cngx.css', 'src/styles.css'])).toBe(true);
    const inThemeFile = readerOf({ 'src/material-theme.scss': `@import '@cngx/themes/cngx.css';\n${DEFINE_THEME}` });
    expect(importsCngxStylesheet(inThemeFile, ['src/material-theme.scss', 'src/styles.css'])).toBe(true);
  });

  it('sees cngx.css imported one local partial deep', () => {
    const cngx = "@import '@cngx/themes/cngx.css';\n";
    const through = (partial: string, statement: string) =>
      importsCngxStylesheet(readerOf({ 'src/styles.scss': statement, [partial]: cngx }), ['src/styles.scss']);
    expect(through('src/styles/_vendor.scss', "@use 'styles/vendor';\n")).toBe(true);
    expect(through('src/vendor.scss', "@import './vendor';\n")).toBe(true);
    expect(through('src/vendor.css', "@import url('vendor.css');\n")).toBe(true);
    expect(through('src/vendor.css', "@import 'vendor';\n")).toBe(true);
    const twoDeep = readerOf({
      'src/styles.scss': "@use 'a';\n",
      'src/_a.scss': "@use 'b';\n",
      'src/_b.scss': cngx,
    });
    expect(importsCngxStylesheet(twoDeep, ['src/styles.scss'])).toBe(false);
  });

  it('finds a generated theme file or a stylesheet already using the Material bridge', () => {
    const generated = createFixtureTree('standalone-app', { 'src/cngx-theme.css': '' });
    expect(existingCngxTheme(generated, readerOf({}), 'src', ['src/styles.css'])).toBe('src/cngx-theme.css');
    const bridged = readerOf({ 'src/styles.scss': `${DEFINE_THEME}@use '@cngx/themes/material/theme' as cngx-material;\n` });
    expect(existingCngxTheme(createFixtureTree(), bridged, 'src', ['src/styles.scss'])).toBe('src/styles.scss');
  });

  it('reads a commented-out Material bridge as no cngx theme', () => {
    const commented = readerOf({ 'src/styles.scss': `${DEFINE_THEME}// @use '@cngx/themes/material/theme' as cngx-material;\n` });

    expect(existingCngxTheme(createFixtureTree(), commented, 'src', ['src/styles.scss'])).toBeUndefined();
  });
});

describe('detectTailwind', () => {
  const tailwind = (content: string, range = '^4.1.12') =>
    detectTailwind(readerOf({ 'src/styles.scss': content }), withPackage({ tailwindcss: range }), ['src/styles.scss']);

  it('reads a v4 import in the global stylesheet as layered', () => {
    expect(tailwind("@import 'tailwindcss';\n")).toEqual({
      major: 4,
      layered: true,
      orderTarget: 'src/styles.scss',
      orderDeclared: false,
      layersFile: 'absent',
    });
  });

  it('reads v3 directives as unlayered', () => {
    const directives = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';
    expect(tailwind(directives, '^3.4.17')).toMatchObject({ major: 3, layered: false });
  });

  it('reads no Tailwind when the app does not declare it', () => {
    expect(detectTailwind(readerOf({ 'src/styles.css': "@import 'tailwindcss';\n" }), STOCK, ['src/styles.css'])).toBeUndefined();
  });

  it('sees the layer order file imported, but not an inline layer statement', () => {
    expect(tailwind("@import './cngx-layers.css';\n@import 'tailwindcss';\n")?.orderDeclared).toBe(true);
    expect(tailwind("@import url('cngx-layers.css'); @import url(tailwindcss);\n")).toMatchObject({
      layered: true,
      orderDeclared: true,
    });
    expect(tailwind("@layer theme, base, cngx, components, utilities;\n@import 'tailwindcss';\n")?.orderDeclared).toBe(
      false,
    );
  });

  it('reads Tailwind from any global stylesheet and targets the first one in the build', () => {
    const read = readerOf({
      'src/theme/material.scss': DEFINE_THEME,
      'src/tailwind.css': "@import 'tailwindcss';\n",
      'src/styles.scss': '',
    });
    const entries = ['src/theme/material.scss', 'src/tailwind.css', 'src/styles.scss'];

    expect(detectTailwind(read, withPackage({ tailwindcss: '^4.1.12' }), entries)).toMatchObject({
      layered: true,
      orderTarget: 'src/theme/material.scss',
    });
  });

  it('tells a generated layer order file from one someone else wrote', () => {
    const withLayers = (layers: string) =>
      detectTailwind(
        readerOf({ 'src/styles.scss': "@import 'tailwindcss';\n", 'src/cngx-layers.css': layers }),
        withPackage({ tailwindcss: '^4.1.12' }),
        ['src/styles.scss'],
      );
    const stamp = createProvenanceStamp('ng-add theme', '0.1.0');
    expect(withLayers(`${stamp}@layer theme, base, cngx, components, utilities;\n`)?.layersFile).toBe('generated');
    expect(withLayers('@layer a, b;\n')?.layersFile).toBe('foreign');
  });

  it('falls back to the import shape for a range without a version', () => {
    expect(tailwind("@import 'tailwindcss';\n", 'latest')?.major).toBe(4);
  });
});
