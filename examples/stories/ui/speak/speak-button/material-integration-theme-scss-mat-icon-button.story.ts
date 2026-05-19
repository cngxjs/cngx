import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Material Integration — Theme SCSS + mat-icon-button',
  subtitle: '<code>CngxSpeakButton</code> ships a Material theme SCSS mixin that maps <code>--mat-sys-*</code> tokens to the button CSS variables. Alternatively, skip <code>CngxSpeakButton</code> entirely and use a <code>mat-icon-button</code> with the headless <code>CngxSpeak</code> directive.',
  description: 'Ready-made speaker button component that connects to a CngxSpeak directive. Fully themeable via CSS custom properties.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxSpeakButton',
    'CngxSpeak',
  ],
  moduleImports: [
    'import { MatIconButton, MatMiniFabButton } from \'@angular/material/button\';',
    'import { MatIcon } from \'@angular/material/icon\';',
  ],
  imports: ['CngxSpeak', 'CngxSpeakButton', 'MatIconButton', 'MatMiniFabButton', 'MatIcon'],
  template: `  <div style="display: flex; flex-direction: column; gap: 20px; max-width: 480px;">
    <div>
      <h4 style="margin: 0 0 8px; font-size: 0.8125rem; font-weight: 600;">CngxSpeakButton with Material Theme</h4>
      <p style="margin: 0 0 8px; font-size: 0.8125rem; color: var(--cngx-text-secondary, #666);">
        Include the theme mixin in your global styles to auto-derive colors
        from your Material theme.
      </p>
      <pre class="code-block" style="font-size: 0.75rem; margin: 0 0 12px;"><code>@use '@angular/material' as mat;
@use '@cngx/ui/speak/speak-button-theme' as speak;

$theme: mat.define-theme((
  color: ( theme-type: light, primary: mat.$azure-palette ),
));

html {{ '{' }}
  @include mat.all-component-themes($theme);
  @include speak.theme($theme);
{{ '}' }}</code></pre>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span
            [cngxSpeak]="'Default theme — outlined, uses surface and on-surface-variant colors from the Material palette.'"
            #ttsMat="cngxSpeak"
            style="font-size: 0.875rem;"
          >
            Default (outlined)
          </span>
          <cngx-speak-button [speakRef]="ttsMat" />
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span
            [cngxSpeak]="'Primary theme — filled with the Material primary color, white icon. Use the speak-btn-primary class.'"
            #ttsMatPrimary="cngxSpeak"
            style="font-size: 0.875rem;"
          >
            Primary (filled)
          </span>
          <cngx-speak-button class="speak-btn-primary" [speakRef]="ttsMatPrimary" />
        </div>
      </div>
    </div>

    <div>
      <h4 style="margin: 0 0 8px; font-size: 0.8125rem; font-weight: 600;">mat-icon-button — fully custom</h4>
      <p style="margin: 0 0 8px; font-size: 0.8125rem; color: var(--cngx-text-secondary, #666);">
        Skip <code>CngxSpeakButton</code> entirely. Use a Material icon button
        with the headless <code>CngxSpeak</code> directive — full Material
        styling, ripple, and density for free.
      </p>

      <div style="display: flex; align-items: center; gap: 8px;">
        <span
          [cngxSpeak]="'This uses a Material icon button instead of CngxSpeakButton. Full Material ripple and theming.'"
          #ttsIcon="cngxSpeak"
          style="font-size: 0.875rem;"
        >
          Material icon button
        </span>
        <button
          mat-icon-button
          (click)="ttsIcon.toggle()"
          [attr.aria-label]="ttsIcon.speaking() ? 'Stop speaking' : 'Read aloud'"
          [color]="ttsIcon.speaking() ? 'primary' : ''"
        >
          <mat-icon>{{ ttsIcon.speaking() ? 'stop' : 'volume_up' }}</mat-icon>
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
        <span
          [cngxSpeak]="'Mini FAB variant with a speaker icon. Works with any Material button variant.'"
          #ttsFab="cngxSpeak"
          style="font-size: 0.875rem;"
        >
          Mini FAB variant
        </span>
        <button
          mat-mini-fab
          (click)="ttsFab.toggle()"
          [attr.aria-label]="ttsFab.speaking() ? 'Stop speaking' : 'Read aloud'"
          [color]="ttsFab.speaking() ? 'warn' : 'primary'"
        >
          <mat-icon>{{ ttsFab.speaking() ? 'stop' : 'record_voice_over' }}</mat-icon>
        </button>
      </div>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">CngxSpeakButton</span>
      <span class="event-value">{{ ttsMat.speaking() ? 'speaking' : 'idle' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">mat-icon-button</span>
      <span class="event-value">{{ ttsIcon.speaking() ? 'speaking' : 'idle' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">mat-mini-fab</span>
      <span class="event-value">{{ ttsFab.speaking() ? 'speaking' : 'idle' }}</span>
    </div>
  </div>`,
};
