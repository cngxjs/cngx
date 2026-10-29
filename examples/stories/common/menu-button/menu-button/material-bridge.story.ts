import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuButton: Material bridge',
  subtitle: 'With <code>button-theme</code> included, menu buttons and split buttons read as Material 3 next to <code>[matMenuTriggerFor]</code>.',
  description: 'The menu buttons carry <code>.cngx-button</code>, so the button bridge gives them the M3 colour roles, the full corner, the 40px row and the label-large type unchanged. The caret is the end slot: 16px on its side and 24px on the other for a filled button, 12px and 16px for a text button, the 18px slot icon, the same box <code>mat-button</code> draws around a trailing <code>arrow_drop_down</code>. <code>CNGX_BUTTON_CARET_ICON</code> swaps the default chevron for that Material glyph; the menu button wraps it in its caret <code>&lt;cngx-icon&gt;</code> and the icon bridge sizes it. The split button follows the M3 split-button anatomy, which Angular Material does not ship: a 2px gap between the two parts instead of a divider line, corner-full outer ends and 4px inner corners. Every length is a rung of the <code>--cngx-space-*</code> scale, so the last row re-scales in <code>[data-density]</code> islands. An app includes the bridges with <code>html &#123; @include button.theme($theme); @include icon.theme($theme); &#125;</code> next to <code>mat.theme</code>; <code>@cngx/themes/material/theme</code> includes both.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'integration'],
  apiComponents: ['CngxMenuButton', 'CngxIconMenuButton', 'CngxSplitButton', 'CngxButton', 'CngxIcon', 'CngxMenu', 'CngxMenuItem', 'CngxPopover'],
  moduleImports: [
    "import { CngxButton } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';",
    "import { CNGX_BUTTON_CARET_ICON, CngxIconMenuButton, CngxMenuButton, CngxSplitButton } from '@cngx/common/menu-button';",
    "import { CngxPopover } from '@cngx/common/popover';",
    "import { MatButtonModule } from '@angular/material/button';",
    "import { MatIconModule } from '@angular/material/icon';",
    "import { MatMenuModule } from '@angular/material/menu';",
    "import { MaterialCaret } from './_material-caret.component';",
  ],
  imports: ['CngxButton', 'CngxIcon', 'CngxMenu', 'CngxMenuItem', 'CngxIconMenuButton', 'CngxMenuButton', 'CngxSplitButton', 'CngxPopover', 'MatButtonModule', 'MatIconModule', 'MatMenuModule'],
  viewProviders: ['{ provide: CNGX_BUTTON_CARET_ICON, useValue: MaterialCaret }'],
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
  <div style="display:flex; flex-direction:column; gap:16px">
    <div class="demo-inline-actions">
      <button mat-flat-button [matMenuTriggerFor]="matExport">Export<mat-icon iconPositionEnd>arrow_drop_down</mat-icon></button>
      <button cngxMenuButton tone="primary" [menu]="solidMenu" [popover]="solidPop">Export</button>
    </div>
    <div class="demo-inline-actions">
      <button mat-stroked-button [matMenuTriggerFor]="matExport">Export<mat-icon iconPositionEnd>arrow_drop_down</mat-icon></button>
      <button cngxMenuButton="outline" [menu]="outlineMenu" [popover]="outlinePop">Export</button>
    </div>
    <div class="demo-inline-actions">
      <button mat-button [matMenuTriggerFor]="matExport">Export<mat-icon iconPositionEnd>arrow_drop_down</mat-icon></button>
      <button cngxMenuButton="ghost" tone="primary" [menu]="ghostMenu" [popover]="ghostPop">Export</button>
    </div>
    <div class="demo-inline-actions">
      <button matIconButton aria-label="More actions" [matMenuTriggerFor]="matExport"><mat-icon>more_vert</mat-icon></button>
      <button cngxIconMenuButton aria-label="More actions" [menu]="moreMenu" [popover]="morePop"><cngx-icon><mat-icon>more_vert</mat-icon></cngx-icon></button>
    </div>
    <div class="demo-inline-actions">
      @for (split of splits; track split.variant) {
        <div cngxSplitButton [variant]="split.variant" aria-label="Publish">
          <button cngxButton [tone]="split.tone">Publish</button>
          <button cngxIconMenuButton [tone]="split.tone" [menu]="splitMenu" [popover]="splitPop"></button>
        </div>
        <div cngxPopover placement="bottom-end" #splitPop="cngxPopover">
          <ul cngxMenu [label]="'Publish options'" tabindex="0" #splitMenu="cngxMenu">
            <li cngxMenuItem value="draft">Save as draft</li>
            <li cngxMenuItem value="scheduled">Schedule for tomorrow</li>
          </ul>
        </div>
      }
    </div>
    <div class="demo-inline-actions">
      @for (density of densities; track density) {
        <div class="demo-inline-actions" [attr.data-density]="density">
          <button cngxMenuButton tone="primary" [menu]="densityMenu" [popover]="densityPop">{{ density }}</button>
          <div cngxSplitButton variant="solid" [attr.aria-label]="'Publish, ' + density">
            <button cngxButton tone="primary">Publish</button>
            <button cngxIconMenuButton tone="primary" [menu]="densitySplitMenu" [popover]="densitySplitPop"></button>
          </div>
        </div>
        <div cngxPopover placement="bottom-start" #densityPop="cngxPopover">
          <ul cngxMenu [label]="'Export format'" tabindex="0" #densityMenu="cngxMenu">
            <li cngxMenuItem value="pdf">PDF</li>
            <li cngxMenuItem value="csv">CSV</li>
          </ul>
        </div>
        <div cngxPopover placement="bottom-end" #densitySplitPop="cngxPopover">
          <ul cngxMenu [label]="'Publish options'" tabindex="0" #densitySplitMenu="cngxMenu">
            <li cngxMenuItem value="draft">Save as draft</li>
          </ul>
        </div>
      }
    </div>
  </div>
  <mat-menu #matExport="matMenu">
    <button mat-menu-item>PDF</button>
    <button mat-menu-item>CSV</button>
  </mat-menu>
  <div cngxPopover placement="bottom-start" #solidPop="cngxPopover">
    <ul cngxMenu [label]="'Export format'" tabindex="0" #solidMenu="cngxMenu">
      <li cngxMenuItem value="pdf">PDF</li>
      <li cngxMenuItem value="csv">CSV</li>
    </ul>
  </div>
  <div cngxPopover placement="bottom-start" #outlinePop="cngxPopover">
    <ul cngxMenu [label]="'Export format'" tabindex="0" #outlineMenu="cngxMenu">
      <li cngxMenuItem value="pdf">PDF</li>
      <li cngxMenuItem value="csv">CSV</li>
    </ul>
  </div>
  <div cngxPopover placement="bottom-start" #ghostPop="cngxPopover">
    <ul cngxMenu [label]="'Export format'" tabindex="0" #ghostMenu="cngxMenu">
      <li cngxMenuItem value="pdf">PDF</li>
      <li cngxMenuItem value="csv">CSV</li>
    </ul>
  </div>
  <div cngxPopover placement="bottom-end" #morePop="cngxPopover">
    <ul cngxMenu [label]="'More actions'" tabindex="0" #moreMenu="cngxMenu">
      <li cngxMenuItem value="rename">Rename</li>
      <li cngxMenuItem value="archive">Archive</li>
    </ul>
  </div>`,
  setup: `protected readonly splits = [
    { variant: 'solid', tone: 'primary' },
    { variant: 'secondary', tone: 'neutral' },
    { variant: 'outline', tone: 'neutral' },
  ] as const;
  protected readonly densities = ['compact', 'comfortable', 'spacious'] as const;`,
};
