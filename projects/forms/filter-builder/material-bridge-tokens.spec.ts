import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

/**
 * Error-role contract for the filter-builder Material bridge
 * (`projects/themes/material/filter-builder-theme.scss`). The remove action
 * ink takes the M3 error role as is; the unread `error-fg` token is not
 * bridged. Co-located with the consumer because `projects/themes/material/`
 * has no test target.
 */

describe('filter-builder Material bridge error role', () => {
  it('keeps the M3 error role as is', () => {
    const css = compileThemeEntry(
      `
@use '@angular/material' as mat;
@use 'material/filter-builder-theme' as bridge;
$theme: mat.define-theme((color: (theme-type: light, primary: mat.$azure-palette)));
@include bridge.theme($theme);
`,
    );
    expect(css).toContain('--cngx-filter-builder-action-remove-fg: var(--mat-sys-error)');
    expect(css).not.toContain('--cngx-filter-builder-error-fg');
  });
});
