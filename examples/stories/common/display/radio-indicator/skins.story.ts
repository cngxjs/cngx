import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadioIndicator: Skins',
  subtitle: '<code>[skin]</code> picks <code>default</code>, <code>check</code> or <code>tinted</code>. Same ring geometry in all three, only the checked paint changes.',
  description: 'One row per skin: unchecked, checked and disabled at <code>md</code>, then checked at <code>sm</code> and <code>lg</code>. <code>check</code> fills the disc with the checked colour and strokes the shared check glyph in <code>--cngx-radio-indicator-mark-color</code>, the skin for choice cards and tiles. <code>tinted</code> fills the disc with a 16% tint behind the primary ring and a smaller dot (<code>--cngx-radio-indicator-tinted-dot-scale</code>). App-wide via <code>provideRadioConfig(withRadioSkin(\'check\'))</code>.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxRadioIndicator',
  ],
  moduleImports: [
    'import { CngxRadioIndicator } from \'@cngx/common/display\';',
  ],
  imports: ['CngxRadioIndicator'],
  template: `
  <div class="demo-radio-row" style="color: var(--cngx-color-text)">
    <div class="demo-radio-cell">
      <span class="demo-radio-caption"><code>default</code></span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="default" />
      <span class="demo-radio-caption">unchecked</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="default" [checked]="true" />
      <span class="demo-radio-caption">checked</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="default" [checked]="true" [disabled]="true" />
      <span class="demo-radio-caption">disabled</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="default" [checked]="true" size="sm" />
      <span class="demo-radio-caption">sm</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="default" [checked]="true" size="lg" />
      <span class="demo-radio-caption">lg</span>
    </div>
  </div>
  <div class="demo-radio-row" style="color: var(--cngx-color-text)">
    <div class="demo-radio-cell">
      <span class="demo-radio-caption"><code>check</code></span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="check" />
      <span class="demo-radio-caption">unchecked</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="check" [checked]="true" />
      <span class="demo-radio-caption">checked</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="check" [checked]="true" [disabled]="true" />
      <span class="demo-radio-caption">disabled</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="check" [checked]="true" size="sm" />
      <span class="demo-radio-caption">sm</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="check" [checked]="true" size="lg" />
      <span class="demo-radio-caption">lg</span>
    </div>
  </div>
  <div class="demo-radio-row" style="color: var(--cngx-color-text)">
    <div class="demo-radio-cell">
      <span class="demo-radio-caption"><code>tinted</code></span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="tinted" />
      <span class="demo-radio-caption">unchecked</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="tinted" [checked]="true" />
      <span class="demo-radio-caption">checked</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="tinted" [checked]="true" [disabled]="true" />
      <span class="demo-radio-caption">disabled</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="tinted" [checked]="true" size="sm" />
      <span class="demo-radio-caption">sm</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator skin="tinted" [checked]="true" size="lg" />
      <span class="demo-radio-caption">lg</span>
    </div>
  </div>`,
};
