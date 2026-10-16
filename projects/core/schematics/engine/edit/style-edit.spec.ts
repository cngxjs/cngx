import { describe, expect, it } from 'vitest';

import {
  hasStyleImport,
  insertLeadingStyleImport,
  insertStyleImport,
  isInjectedStyleEntry,
  styleEntryPath,
} from './style-edit';

const CNGX = "@import '@cngx/themes/cngx.css';";
const BRIDGE = "@use '@cngx/themes/material/theme' as cngx-material;";

const MATERIAL_SCSS = `// Global styles
@use '@angular/material' as mat;
@use 'sass:map' with (
  $x: 1
);

html {
  @include mat.theme((color: (primary: mat.$azure-palette)));
}
`;

describe('insertStyleImport', () => {
  it('goes after the last leading module load, before the first rule', () => {
    expect(insertStyleImport(MATERIAL_SCSS, CNGX)).toBe(`// Global styles
@use '@angular/material' as mat;
@use 'sass:map' with (
  $x: 1
);
${CNGX}

html {
  @include mat.theme((color: (primary: mat.$azure-palette)));
}
`);
  });

  it('goes first when the file starts with a rule', () => {
    expect(insertStyleImport('body { margin: 0; }\n', CNGX)).toBe(`${CNGX}\nbody { margin: 0; }\n`);
  });

  it('keeps @charset first', () => {
    expect(insertStyleImport('@charset "UTF-8";\nbody {}\n', CNGX)).toBe(`@charset "UTF-8";\n${CNGX}\nbody {}\n`);
  });

  it('skips comments between imports, including block comments with semicolons', () => {
    const content = "@use 'a';\n/* note; still preamble */\n@import 'b.css';\n.x {}\n";

    expect(insertStyleImport(content, CNGX)).toBe(`@use 'a';\n/* note; still preamble */\n@import 'b.css';\n${CNGX}\n.x {}\n`);
  });

  it('handles an empty file and a last import without trailing newline', () => {
    expect(insertStyleImport('', CNGX)).toBe(`${CNGX}\n`);
    expect(insertStyleImport("@use 'a';", CNGX)).toBe(`@use 'a';\n${CNGX}\n`);
  });

  it('does not touch an import further down the file', () => {
    expect(insertStyleImport(".x {}\n@import 'late.css';\n", CNGX)).toBe(`${CNGX}\n.x {}\n@import 'late.css';\n`);
  });

  it('puts a @use ahead of the first @import', () => {
    const content = `@use '@angular/material' as mat;\n${CNGX}\n\n.x {}\n`;

    expect(insertStyleImport(content, BRIDGE)).toBe(`@use '@angular/material' as mat;\n${BRIDGE}\n${CNGX}\n\n.x {}\n`);
  });

  it('puts an @import after a leading @use', () => {
    expect(insertStyleImport(`${BRIDGE}\n.x {}\n`, CNGX)).toBe(`${BRIDGE}\n${CNGX}\n.x {}\n`);
  });

  it('is idempotent', () => {
    const once = insertStyleImport(MATERIAL_SCSS, CNGX);

    expect(insertStyleImport(once, CNGX)).toBe(once);
  });
});

describe('insertLeadingStyleImport', () => {
  const LAYERS = "@import './cngx-layers.css';";

  it('goes before the first import of a css file', () => {
    const content = `@import 'tailwindcss';\n${CNGX}\n\nbody {}\n`;

    expect(insertLeadingStyleImport(content, LAYERS)).toBe(`${LAYERS}\n@import 'tailwindcss';\n${CNGX}\n\nbody {}\n`);
  });

  it('keeps @charset, @use and @forward in front of it in scss', () => {
    const content = `@charset "UTF-8";\n@use 'sass:map';\n@forward 'tokens';\n@import 'tailwindcss';\n.x {}\n`;

    expect(insertLeadingStyleImport(content, LAYERS)).toBe(
      `@charset "UTF-8";\n@use 'sass:map';\n@forward 'tokens';\n${LAYERS}\n@import 'tailwindcss';\n.x {}\n`,
    );
  });

  it('stays below a leading comment preamble', () => {
    const content = "// Global styles\n/* imports; in order */\n@import 'tailwindcss';\n";

    expect(insertLeadingStyleImport(content, LAYERS)).toBe(
      `// Global styles\n/* imports; in order */\n${LAYERS}\n@import 'tailwindcss';\n`,
    );
  });

  it('falls back to the end of the preamble without an import', () => {
    expect(insertLeadingStyleImport("@use 'a';\n.x {}\n", LAYERS)).toBe(`@use 'a';\n${LAYERS}\n.x {}\n`);
    expect(insertLeadingStyleImport('', LAYERS)).toBe(`${LAYERS}\n`);
  });

  it('is idempotent and leaves the input alone', () => {
    const content = "@import 'tailwindcss';\n";
    const once = insertLeadingStyleImport(content, LAYERS);

    expect(insertLeadingStyleImport(once, LAYERS)).toBe(once);
    expect(content).toBe("@import 'tailwindcss';\n");
  });
});

describe('hasStyleImport', () => {
  it('matches the url regardless of at-rule and quote style', () => {
    expect(hasStyleImport('@use "@cngx/themes/cngx.css";\n', CNGX)).toBe(true);
    expect(hasStyleImport("  @import '@cngx/themes/cngx.css' layer(cngx);\n", CNGX)).toBe(true);
  });

  it('does not match a different url', () => {
    expect(hasStyleImport("@import '@cngx/themes/example-brand.css';\n", CNGX)).toBe(false);
  });

  it('matches a url() import, quoted or not', () => {
    expect(hasStyleImport("@import url('@cngx/themes/cngx.css');\n", CNGX)).toBe(true);
    expect(hasStyleImport('@import url("@cngx/themes/cngx.css") layer(cngx);\n', CNGX)).toBe(true);
    expect(hasStyleImport('@import url(@cngx/themes/cngx.css);\n', CNGX)).toBe(true);
  });

  it('matches a url behind a ~ or node_modules/ prefix', () => {
    expect(hasStyleImport("@import '~@cngx/themes/cngx.css';\n", CNGX)).toBe(true);
    expect(hasStyleImport("@import 'node_modules/@cngx/themes/cngx.css';\n", CNGX)).toBe(true);
    expect(hasStyleImport("@import '@cngx/themes/cngx.css';\n", "@import '~@cngx/themes/cngx.css';")).toBe(true);
  });

  it('matches the second statement on a line', () => {
    expect(hasStyleImport("@use '@angular/material' as mat; @import '@cngx/themes/cngx.css';\n", CNGX)).toBe(true);
  });

  it('does not match a commented-out import', () => {
    expect(hasStyleImport("// @import '@cngx/themes/cngx.css';\n", CNGX)).toBe(false);
  });

  it('rejects a statement that is not a module load', () => {
    expect(() => hasStyleImport('', 'body {}')).toThrow('Not a style import statement');
  });
});

describe('isInjectedStyleEntry', () => {
  it('skips only an object entry with inject: false', () => {
    expect(isInjectedStyleEntry('src/styles.scss')).toBe(true);
    expect(isInjectedStyleEntry({ input: 'src/theme.scss', bundleName: 'theme' })).toBe(true);
    expect(isInjectedStyleEntry({ input: 'src/theme.scss', inject: true })).toBe(true);
    expect(isInjectedStyleEntry({ input: 'src/theme.scss', inject: false })).toBe(false);
  });
});

describe('styleEntryPath', () => {
  it('reads a plain entry and the input of an object entry', () => {
    expect(styleEntryPath('src/styles.scss')).toBe('src/styles.scss');
    expect(styleEntryPath({ input: 'src/theme.scss', inject: false })).toBe('src/theme.scss');
  });

  it('finds no path in an entry without a string input', () => {
    expect(styleEntryPath({ bundleName: 'theme' })).toBeUndefined();
    expect(styleEntryPath({ input: 42 })).toBeUndefined();
    expect(styleEntryPath(['src/styles.css'])).toBeUndefined();
    expect(styleEntryPath(null)).toBeUndefined();
  });
});
