import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'cngx-card host (no scope — errors visible immediately)',
  subtitle: 'Without a <code>cngxErrorScope</code> ancestor the aggregator falls back to <code>shouldShow === hasError</code>. Errors render the moment a source toggles. The card body host element carries <code>.cngx-error</code> + <code>aria-invalid="true"</code> reactively.',
  description: '<code>cngxErrorAggregator</code> rolls up child <code>cngxErrorSource</code> directives into one live A11y surface. Derived signals (<code>hasError</code>, <code>errorCount</code>, <code>activeErrors</code>, <code>errorLabels</code>, <code>shouldShow</code>, <code>announcement</code>) all carry structural <code>equal</code> fns so unrelated re-emissions do not cascade. The directive is template-free — render the SR live region yourself. Each section below shows the reactive state at the top so the consumer sees every signal toggle live.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'error-handling'],
  apiComponents: [
    'CngxErrorAggregator',
    'CngxErrorScope',
    'CngxErrorSource',
  ],
  moduleImports: [
    'import { CngxErrorAggregator, CngxErrorSource } from \'@cngx/common/interactive\';',
    'import { CngxCard, CngxCardHeader, CngxCardBody } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody', 'CngxErrorAggregator', 'CngxErrorSource'],
  setup: `protected readonly profileBioEmpty = signal(true);
  protected readonly profileAvatarMissing = signal(false);`,
  template: `
  <cngx-card>
    <header cngxCardHeader>Profile</header>
    <div
      cngxCardBody
      cngxErrorAggregator
      #profile="cngxErrorAggregator"
      [style.background]="profile.shouldShow() ? 'rgba(176, 0, 32, 0.04)' : 'transparent'"
      style="padding: 12px 16px;"
    >
      <span cngxErrorSource="bio-empty" [when]="profileBioEmpty()" label="Bio is empty"></span>
      <span cngxErrorSource="avatar-missing" [when]="profileAvatarMissing()" label="Avatar missing"></span>
      <p>Update your bio and avatar before saving.</p>

      <pre style="margin: 8px 0; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 0.85em;">hasError    : {{ profile.hasError() }}
errorCount  : {{ profile.errorCount() }}
shouldShow  : {{ profile.shouldShow() }}
announcement: "{{ profile.announcement() }}"</pre>

      @if (profile.hasError()) {
        <ul style="color: #b00020; margin: 8px 0; padding-inline-start: 24px;">
          @for (label of profile.errorLabels(); track label) {
            <li>{{ label }}</li>
          }
        </ul>
      }
      <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
        <button type="button" (click)="profileBioEmpty.set(!profileBioEmpty())">Toggle bio</button>
        <button type="button" (click)="profileAvatarMissing.set(!profileAvatarMissing())">Toggle avatar</button>
      </div>
    </div>
  </cngx-card>`,
};
