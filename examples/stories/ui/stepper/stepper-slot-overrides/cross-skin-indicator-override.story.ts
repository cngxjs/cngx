import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: cross-skin indicator slot override',
  subtitle:
    'One <code>*cngxStepIndicator</code> template rendered under all 5 skins side-by-side. The slot fires once per step row regardless of skin; SVG glyphs swap on <code>status</code>. Slot context: <code>{ position, node, active, status, busy }</code>.',
  description:
    'The slot directive is skin-agnostic - the same template works inside the classic, linear-minimal, stripe-status-rich, path-chevron, and pill-segment skins. This demo proves that visual parity by rendering the same SVG override (a star on success, a cross on error, a filled circle on default) under each skin. Useful as a regression target: any skin that breaks the slot would surface immediately by missing the glyph.',
  level: 'organism',
  audience: ['design', 'a11y', 'dev'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepIndicator'],
  moduleImports: [
    "import { CngxStep, CngxStepIndicator } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepIndicator'],
  setup: `protected readonly active = signal(1);`,
  template: `  <div style="display:grid;gap:16px">
    @for (skin of ['classic', 'linear-minimal', 'stripe-status-rich', 'path-chevron', 'pill-segment']; track skin) {
      <section style="display:grid;gap:6px">
        <h4 style="margin:0;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.04em;opacity:0.7">{{ skin }}</h4>
        <cngx-stepper [(activeStepIndex)]="active" [linear]="true" [skin]="skin" [attr.aria-label]="'Indicator override - ' + skin">
          <ng-template cngxStepIndicator let-position let-status="status">
            @if (status === 'success') {
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                <path d="M6 1l1.4 3.2 3.4.3-2.6 2.3.8 3.4L6 8.5 3 10.2l.8-3.4L1.2 4.5l3.4-.3z" fill="currentColor"/>
              </svg>
            } @else if (status === 'error') {
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              </svg>
            } @else {
              <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                <circle cx="6" cy="6" r="3" fill="currentColor"/>
              </svg>
            }
          </ng-template>
          <div cngxStep label="Step 1" [completed]="true"></div>
          <div cngxStep label="Step 2"></div>
          <div cngxStep label="Step 3"></div>
        </cngx-stepper>
      </section>
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px"><div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div></div>`,
};
