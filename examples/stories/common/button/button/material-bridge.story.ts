import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Material bridge',
  subtitle: 'With <code>button-theme</code> included, cngx buttons read as Material 3 next to the real Material buttons.',
  description: 'Each row pairs a Material button with its cngx counterpart under the same M3 theme. The bridge maps tone <code>primary</code> to the primary role (the filled button), the <code>secondary</code> variant to the container roles (the tonal button), <code>outline</code> to the outline role, tone <code>danger</code> to error, and rounds the family to the full corner. A <code>mat-icon</code> in <code>cngxButtonStart</code> or in an icon button takes the size of the glyph it replaces instead of Material\'s fixed 24px. The wrapper class stands in for <code>html &#123; @include button.theme($theme); &#125;</code> in the app stylesheet, next to <code>mat.theme</code>; <code>@cngx/themes/material/theme</code> includes the same bridge.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'integration'],
  apiComponents: ['CngxButton', 'CngxIconButton', 'CngxButtonStart'],
  moduleImports: [
    "import { CngxButton, CngxButtonStart, CngxIconButton } from '@cngx/common/button';",
    "import { MatButtonModule } from '@angular/material/button';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: ['CngxButton', 'CngxButtonStart', 'CngxIconButton', 'MatButtonModule', 'MatIconModule'],
  css: `@use '@angular/material' as mat;
@use '@cngx/themes/material/button-theme' as button;

$theme: mat.define-theme((color: (primary: mat.$azure-palette)));

html {
  @include mat.theme((color: (primary: mat.$azure-palette)));
  @include button.theme($theme);
}`,
  template: `
  <div class="demo-material-bridge" style="display:flex; flex-direction:column; gap:16px">
    <div class="demo-inline-actions">
      <button mat-flat-button>Save</button>
      <button cngxButton tone="primary">Save</button>
    </div>
    <div class="demo-inline-actions">
      <button matButton="tonal">Save draft</button>
      <button cngxButton="secondary">Save draft</button>
    </div>
    <div class="demo-inline-actions">
      <button mat-stroked-button>Export</button>
      <button cngxButton="outline">Export</button>
    </div>
    <div class="demo-inline-actions">
      <button mat-button>Cancel</button>
      <button cngxButton="ghost" tone="primary">Cancel</button>
    </div>
    <div class="demo-inline-actions">
      <button mat-flat-button><mat-icon>add</mat-icon>New item</button>
      <button cngxButton tone="primary"><mat-icon cngxButtonStart>add</mat-icon>New item</button>
    </div>
    <div class="demo-inline-actions">
      <button matIconButton aria-label="Delete"><mat-icon>delete</mat-icon></button>
      <button cngxIconButton aria-label="Delete"><mat-icon>delete</mat-icon></button>
      <button cngxButton tone="danger">Delete</button>
      <button cngxButton="secondary" tone="danger">Discard</button>
    </div>
  </div>`,
};
