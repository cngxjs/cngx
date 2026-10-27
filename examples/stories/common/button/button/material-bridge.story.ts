import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Material bridge',
  subtitle: 'With <code>button-theme</code> included, cngx buttons read as Material 3 next to the real Material buttons.',
  description: 'Each row pairs a Material button with its cngx counterpart under the same M3 theme, and a third copy with <code>cngxRipple</code> co-hosted: Material buttons ripple by default, a cngx button ripples only where you add the directive. The bridge maps tone <code>primary</code> to the primary role (the filled button), the <code>secondary</code> variant to the container roles (the tonal button), <code>outline</code> to the outline role, tone <code>danger</code> to error, and rounds the family to the full corner. It also gives the buttons the M3 metrics and label type: 40px high, 24px inline padding (12px for the text button, 16px on the side of a leading icon), the label-large role. Every length is a rung of the <code>--cngx-space-*</code> scale, so the last row re-scales in <code>[data-density]</code> islands (compact, comfortable, spacious) inside the Material app. A <code>mat-icon</code> goes inside <code>cngx-icon</code>, in the start slot (<code>&lt;cngx-icon cngxButtonStart&gt;</code>) and in an icon button; the icon bridge sizes the wrapped glyph to the <code>cngx-icon</code> rung. A bare <code>mat-icon</code> is not the pattern: it stays at Material\'s fixed 24px. The wrapper class stands in for <code>html &#123; @include button.theme($theme); @include icon.theme($theme); &#125;</code> in the app stylesheet, next to <code>mat.theme</code>; <code>@cngx/themes/material/theme</code> includes both bridges.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'integration'],
  apiComponents: ['CngxButton', 'CngxIconButton', 'CngxButtonStart', 'CngxIcon', 'CngxRipple'],
  moduleImports: [
    "import { CngxButton, CngxButtonStart, CngxIconButton } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CngxRipple } from '@cngx/common/interactive';",
    "import { MatButtonModule } from '@angular/material/button';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: ['CngxButton', 'CngxButtonStart', 'CngxIconButton', 'CngxIcon', 'CngxRipple', 'MatButtonModule', 'MatIconModule'],
  css: `@use '@angular/material' as mat;
@use '@cngx/themes/material/button-theme' as button;
@use '@cngx/themes/material/icon-theme' as icon;

$theme: mat.define-theme((color: (primary: mat.$azure-palette)));

html {
  @include mat.theme((color: (primary: mat.$azure-palette)));
  @include button.theme($theme);
  @include icon.theme($theme);
}`,
  template: `
  <div class="demo-material-bridge" style="display:flex; flex-direction:column; gap:16px">
    <div class="demo-inline-actions">
      <button mat-flat-button>Save</button>
      <button cngxButton tone="primary">Save</button>
      <button cngxButton tone="primary" cngxRipple>Save</button>
    </div>
    <div class="demo-inline-actions">
      <button matButton="tonal">Save draft</button>
      <button cngxButton="secondary">Save draft</button>
      <button cngxButton="secondary" cngxRipple>Save draft</button>
    </div>
    <div class="demo-inline-actions">
      <button mat-stroked-button>Export</button>
      <button cngxButton="outline">Export</button>
      <button cngxButton="outline" cngxRipple>Export</button>
    </div>
    <div class="demo-inline-actions">
      <button mat-button>Cancel</button>
      <button cngxButton="ghost" tone="primary">Cancel</button>
      <button cngxButton="ghost" tone="primary" cngxRipple>Cancel</button>
    </div>
    <div class="demo-inline-actions">
      <button mat-flat-button><mat-icon>add</mat-icon>New item</button>
      <button cngxButton tone="primary"><cngx-icon cngxButtonStart><mat-icon>add</mat-icon></cngx-icon>New item</button>
      <button cngxButton tone="primary" cngxRipple><cngx-icon cngxButtonStart><mat-icon>add</mat-icon></cngx-icon>New item</button>
    </div>
    <div class="demo-inline-actions">
      <button matIconButton aria-label="Delete"><mat-icon>delete</mat-icon></button>
      <button cngxIconButton aria-label="Delete"><cngx-icon><mat-icon>delete</mat-icon></cngx-icon></button>
      <button cngxIconButton cngxRipple [rippleCentered]="true" aria-label="Delete"><cngx-icon><mat-icon>delete</mat-icon></cngx-icon></button>
      <button cngxButton tone="danger">Delete</button>
      <button cngxButton="secondary" tone="danger">Discard</button>
      <button cngxButton="secondary" tone="danger" cngxRipple>Discard</button>
    </div>
    <div class="demo-inline-actions">
      @for (density of densities; track density) {
        <div class="demo-inline-actions" [attr.data-density]="density">
          <button cngxButton tone="primary"><cngx-icon cngxButtonStart><mat-icon>add</mat-icon></cngx-icon>{{ density }}</button>
          <button cngxIconButton [attr.aria-label]="'Delete, ' + density"><cngx-icon><mat-icon>delete</mat-icon></cngx-icon></button>
        </div>
      }
    </div>
  </div>`,
  setup: `protected readonly densities = ['compact', 'comfortable', 'spacious'] as const;`,
};
