import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxErrorAggregator: cngx-card host, no scope',
  subtitle:
    'Without a <code>cngxErrorScope</code> ancestor the aggregator falls back to <code>shouldShow === hasError</code>. Errors render the moment a source toggles. The card body host element carries <code>.cngx-error</code> and <code>aria-invalid="true"</code> reactively.',
  description:
    '<code>cngxErrorAggregator</code> rolls up child <code>cngxErrorSource</code> directives into one live A11y surface. Derived signals (<code>hasError</code>, <code>errorCount</code>, <code>activeErrors</code>, <code>errorLabels</code>, <code>shouldShow</code>, <code>announcement</code>) carry structural <code>equal</code> fns so unrelated re-emissions do not cascade. The directive is template-free; render the SR live region yourself.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'error-handling'],
  apiComponents: ['CngxErrorAggregator', 'CngxErrorSource'],
  moduleImports: [
    "import { CngxErrorAggregator, CngxErrorSource } from '@cngx/common/interactive';",
    "import { CngxCard, CngxCardHeader, CngxCardBody } from '@cngx/common/card';",
    "import { CngxLiveRegion } from '@cngx/common/a11y';",
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody', 'CngxErrorAggregator', 'CngxErrorSource', 'CngxLiveRegion'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-invalid',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-invalid',
    },
    {
      label: 'WAI-ARIA 1.2: aria-live',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-live',
    },
  ],
  setup: `protected readonly profileBioEmpty = signal(true);
  protected readonly profileAvatarMissing = signal(false);`,
  template: `
  <cngx-card>
    <header cngxCardHeader>Profile</header>
    <div cngxCardBody cngxErrorAggregator #profile="cngxErrorAggregator" class="demo-error-surface">
      <span cngxErrorSource="bio-empty" [when]="profileBioEmpty()" label="Bio is empty"></span>
      <span cngxErrorSource="avatar-missing" [when]="profileAvatarMissing()" label="Avatar missing"></span>
      <p>Update your bio and avatar before saving.</p>
      @if (profile.shouldShow()) {
        <ul role="alert" class="demo-error-list">
          @for (label of profile.errorLabels(); track label) {
            <li>{{ label }}</li>
          }
        </ul>
      }
    </div>
  </cngx-card>
  <span class="cngx-sr-only" cngxLiveRegion>{{ profile.announcement() }}</span>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row"><span class="event-label">hasError()</span><span class="event-value">{{ profile.hasError() }}</span></div>
    <div class="event-row"><span class="event-label">errorCount()</span><span class="event-value">{{ profile.errorCount() }}</span></div>
    <div class="event-row"><span class="event-label">shouldShow()</span><span class="event-value">{{ profile.shouldShow() }}</span></div>
    <div class="event-row"><span class="event-label">announcement()</span><span class="event-value">{{ profile.announcement() || '-' }}</span></div>
  </div>
  <div class="button-row" style="margin-top: 12px;">
    <button type="button" (click)="profileBioEmpty.set(!profileBioEmpty())">Toggle bio</button>
    <button type="button" (click)="profileAvatarMissing.set(!profileAvatarMissing())">Toggle avatar</button>
  </div>`,
};
