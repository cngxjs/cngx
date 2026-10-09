import { describe, expect, it } from 'vitest';

import { hasStyleImport, insertStyleImport } from './style-edit';

const CNGX = "@import '@cngx/themes/cngx.css';";

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

  it('is idempotent', () => {
    const once = insertStyleImport(MATERIAL_SCSS, CNGX);

    expect(insertStyleImport(once, CNGX)).toBe(once);
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

  it('rejects a statement that is not a module load', () => {
    expect(() => hasStyleImport('', 'body {}')).toThrow('Not a style import statement');
  });
});
