import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

import { CngxTab, CngxTabContent } from '@cngx/common/tabs';
import { CngxTabGroup, CngxTabOverflow } from '@cngx/ui/tabs';

/**
 * Every `CngxTabGroup` skin rendered against a Material 3 palette, plus the
 * `CngxTabOverflow` "More" popover styled as a Material menu.
 *
 * The example's stylesheet builds a real M3 theme in SCSS: `mat.theme` emits
 * the `--mat-sys-*` system tokens, then the published
 * `@cngx/themes/material/tabs-theme` bridge routes every tab token onto its
 * Material counterpart:
 *
 * ```scss
 * @use '@angular/material' as mat;
 * @use '@cngx/themes/material/tabs-theme' as tabs;
 *
 * $theme: mat.define-theme((color: (theme-type: light, primary: mat.$azure-palette)));
 * html {
 *   @include mat.theme($theme);
 *   @include tabs.theme($theme);
 * }
 * ```
 *
 * So each skin inherits the active indicator / label (primary), surfaces
 * (surface) and error tones (error) from the Material palette with no per-skin
 * overrides, and the overflow popover reads as a `mat-menu`. The shared
 * `[(activeIndex)]` keeps every group in lock-step - the skin is purely
 * visual. `ViewEncapsulation.None` lets the global `html` theme and the
 * `:where(cngx-tab-group)` / `:where(.cngx-tab-overflow__panel)` bridge rules
 * reach the tabs and the top-layer popover.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxTabGroup, CngxTabOverflow, CngxTab, CngxTabContent],
  styleUrl: './skins-coverage.component.scss',
  template: `
    <div class="coverage">
      @for (skin of skins; track skin.id) {
        <section>
          <h3>{{ skin.id }}</h3>
          <cngx-tab-group [skin]="skin.id" [(activeIndex)]="active" [attr.aria-label]="skin.label">
            <div cngxTab [label]="'Overview'">
              <ng-template cngxTabContent><p>Overview content.</p></ng-template>
            </div>
            <div cngxTab [label]="'Activity'">
              <ng-template cngxTabContent><p>Activity content.</p></ng-template>
            </div>
            <div cngxTab [label]="'Settings'">
              <ng-template cngxTabContent><p>Settings content.</p></ng-template>
            </div>
          </cngx-tab-group>
        </section>
      }

      <section>
        <h3>overflow - "More" menu</h3>
        <div class="coverage__narrow">
          <cngx-tab-group [(activeIndex)]="overflowActive" aria-label="Overflow - Material menu">
            <div cngxTab [label]="'Profile'">
              <ng-template cngxTabContent><p>Profile</p></ng-template>
            </div>
            <div cngxTab [label]="'Account'">
              <ng-template cngxTabContent><p>Account</p></ng-template>
            </div>
            <div cngxTab [label]="'Notifications'">
              <ng-template cngxTabContent><p>Notifications</p></ng-template>
            </div>
            <div cngxTab [label]="'Privacy'">
              <ng-template cngxTabContent><p>Privacy</p></ng-template>
            </div>
            <div cngxTab [label]="'Sessions'">
              <ng-template cngxTabContent><p>Sessions</p></ng-template>
            </div>
            <div cngxTab [label]="'Tokens'">
              <ng-template cngxTabContent><p>API tokens</p></ng-template>
            </div>
            <div cngxTab [label]="'Billing'">
              <ng-template cngxTabContent><p>Billing</p></ng-template>
            </div>
            <div cngxTab [label]="'Danger zone'">
              <ng-template cngxTabContent><p>Destructive actions</p></ng-template>
            </div>
            <cngx-tab-overflow></cngx-tab-overflow>
          </cngx-tab-group>
        </div>
      </section>
    </div>
  `,
})
export class SkinsCoverageExample {
  protected readonly active = signal(0);
  protected readonly overflowActive = signal(0);

  protected readonly skins = [
    { id: 'line', label: 'Line skin' },
    { id: 'contained', label: 'Contained skin' },
    { id: 'segmented', label: 'Segmented skin' },
    { id: 'pill', label: 'Pill skin' },
    { id: 'pill-outline', label: 'Pill-outline skin' },
  ] as const;
}
