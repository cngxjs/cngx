import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Toggle',
  navLabel: 'Toggle',
  navCategory: 'interactive',
  description:
    'Single-value boolean switch atom. role="switch" with reactive aria-checked, aria-disabled, ' +
    'aria-describedby for the consumer-supplied disabled reason. Click + Space + Enter all flip. ' +
    'Provides CNGX_CONTROL_VALUE so CngxFormBridge (Phase 7) can bind to it without per-atom CVA.',
  apiComponents: ['CngxToggle'],
  moduleImports: ["import { CngxToggle } from '@cngx/common/interactive';"],
  setup: `
  protected readonly notifications = signal(false);
  protected readonly dark = signal(true);
  protected readonly systemLocked = signal(false);
  `,
  sections: [
    {
      title: 'Basic — two-way binding',
      subtitle:
        'Click anywhere on the row, or focus and press <strong>Space</strong>/<strong>Enter</strong>. ' +
        'The host signal updates via <code>[(value)]</code>.',
      imports: ['CngxToggle'],
      template: `
  <cngx-toggle [(value)]="notifications">Receive e-mail notifications</cngx-toggle>
  <p class="caption">Bound: <code>{{ notifications() }}</code></p>`,
      css: `.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 8px; }`,
    },
    {
      title: 'Disabled with reason',
      subtitle:
        'When <code>[disabled]</code> is true and <code>disabledReason</code> is non-empty, the host emits ' +
        '<code>aria-describedby</code> pointing to a hidden span — screen-readers announce <em>why</em> ' +
        'the control is disabled.',
      imports: ['CngxToggle'],
      template: `
  <button type="button" (click)="systemLocked.set(!systemLocked())" class="sort-btn">
    {{ systemLocked() ? 'Unlock OS preference' : 'Lock OS preference' }}
  </button>
  <cngx-toggle
    [(value)]="dark"
    [disabled]="systemLocked()"
    [disabledReason]="systemLocked() ? 'Locked by your OS preference' : ''"
  >Dark mode</cngx-toggle>`,
      css: `.sort-btn { margin-bottom: 16px; }`,
    },
    {
      title: 'Label position',
      subtitle:
        '<code>[labelPosition]="\'before\'"</code> renders the label to the left of the track via ' +
        '<code>flex-direction: row-reverse</code> on the host class.',
      imports: ['CngxToggle'],
      template: `
  <cngx-toggle [(value)]="notifications" labelPosition="before">Label before</cngx-toggle>
  <cngx-toggle [(value)]="notifications">Label after (default)</cngx-toggle>`,
      css: `cngx-toggle { display: inline-flex; margin-right: 24px; }`,
    },
    {
      title: 'Custom thumb glyph',
      subtitle:
        '<code>cngx-toggle</code> projects an optional <code>[thumbGlyph]</code> ' +
        '<code>TemplateRef&lt;void&gt;</code> inside the thumb span — useful for ' +
        'design-system icons or branded glyphs. The thumb wrapper stays ' +
        '<code>aria-hidden="true"</code>, so the glyph is decorative regardless of ' +
        'consumer markup.',
      imports: ['CngxToggle'],
      template: `
  <ng-template #starGlyph><span aria-hidden="true">★</span></ng-template>
  <ng-template #checkGlyph><span aria-hidden="true">✓</span></ng-template>
  <cngx-toggle [(value)]="notifications" [thumbGlyph]="starGlyph">Star thumb</cngx-toggle>
  <cngx-toggle [(value)]="notifications" [thumbGlyph]="checkGlyph">Check thumb</cngx-toggle>
  <cngx-toggle [(value)]="notifications">Default thumb (no glyph)</cngx-toggle>`,
      css: `cngx-toggle { display: inline-flex; margin-right: 24px; }`,
    },
  ],
};
