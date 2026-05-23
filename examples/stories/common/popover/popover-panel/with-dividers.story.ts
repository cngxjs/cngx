import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: With dividers',
  subtitle:
    '<code>cngxPopoverDivider</code> composes <code>CngxDivider</code> via <code>hostDirectives</code>. Use it to separate body sections and action groups inside the panel.',
  description:
    'A boarding-pass summary popover. Four horizontal dividers in the body separate departure, in-flight, arrival, connection, and travel-docs sections; a vertical divider in the footer separates the dismiss action from the primary check-in. Every divider carries <code>role="separator"</code> + <code>aria-orientation</code> automatically via the composed <code>CngxDivider</code> host directive.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxPopoverPanel', 'CngxPopoverDivider'],
  moduleImports: [
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter, CngxPopoverAction, CngxPopoverDivider } from '@cngx/common/popover';",
    "import { CngxPending, CngxSucceeded } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxPopoverPanel',
    'CngxPopoverTrigger',
    'CngxPopoverHeader',
    'CngxPopoverBody',
    'CngxPopoverFooter',
    'CngxPopoverAction',
    'CngxPopoverDivider',
    'CngxPending',
    'CngxSucceeded',
  ],
  setup: `protected readonly checkIn = () => new Promise<void>((resolve) => setTimeout(resolve, 1200));`,
  template: `
  <div class="demo-popover-stage">
    <button [cngxPopoverTrigger]="pass.popover" (click)="pass.popover.toggle()" class="chip">
      BA 247 to NRT
    </button>
    <cngx-popover-panel #pass variant="info" [showClose]="true" [showArrow]="true"
                        placement="bottom-start">
      <span cngxPopoverHeader>British Airways 247 - LHR &rarr; NRT</span>

      <div cngxPopoverBody>
        <section class="demo-flight-section">
          <div class="demo-flight-section-head">
            <h4>Departure</h4>
            <span class="demo-flight-pill demo-flight-pill--ok">On time</span>
          </div>
          <dl class="demo-flight-row"><dt>Gate</dt><dd>B45</dd></dl>
          <dl class="demo-flight-row"><dt>Boarding</dt><dd>10:25</dd></dl>
          <dl class="demo-flight-row"><dt>Departure</dt><dd>10:55 BST</dd></dl>
        </section>

        <span cngxPopoverDivider></span>

        <section class="demo-flight-section">
          <h4>In flight</h4>
          <dl class="demo-flight-row"><dt>Aircraft</dt><dd>Boeing 787-9</dd></dl>
          <dl class="demo-flight-row"><dt>Duration</dt><dd>11 h 45 m</dd></dl>
          <dl class="demo-flight-row"><dt>Cabin</dt><dd>Club World 14A</dd></dl>
          <dl class="demo-flight-row"><dt>Meal</dt><dd>Lunch &amp; light snack</dd></dl>
        </section>

        <span cngxPopoverDivider></span>

        <section class="demo-flight-section">
          <div class="demo-flight-section-head">
            <h4>Arrival</h4>
            <span class="demo-flight-pill demo-flight-pill--warn">+15 min</span>
          </div>
          <dl class="demo-flight-row"><dt>Local time</dt><dd>06:55 JST +1</dd></dl>
          <dl class="demo-flight-row"><dt>Terminal</dt><dd>NRT T2</dd></dl>
          <dl class="demo-flight-row"><dt>Baggage</dt><dd>Belt 7</dd></dl>
        </section>

        <span cngxPopoverDivider></span>

        <section class="demo-flight-section">
          <h4>Onward connection</h4>
          <dl class="demo-flight-row"><dt>JL 3041</dt><dd>NRT &rarr; HND</dd></dl>
          <dl class="demo-flight-row"><dt>Transfer</dt><dd>2 h 25 m</dd></dl>
          <dl class="demo-flight-row"><dt>Departure</dt><dd>09:20 JST</dd></dl>
        </section>

        <span cngxPopoverDivider [inset]="true"></span>

        <section class="demo-flight-section">
          <h4>Travel documents</h4>
          <div class="demo-flight-doc-note">
            <span>
              <strong>Passport required:</strong>
              valid through 28 Nov 2026. Japan eVisa attached to booking.
            </span>
          </div>
        </section>
      </div>

      <div cngxPopoverFooter>
        <div class="demo-flight-footer">
          <cngx-popover-action role="dismiss">Not now</cngx-popover-action>
          <span class="demo-flight-footer-spacer"></span>
          <span cngxPopoverDivider orientation="vertical" [inset]="true"></span>
          <cngx-popover-action role="confirm" [action]="checkIn" variant="primary">
            Check in
            <ng-template cngxPending>Checking in...</ng-template>
            <ng-template cngxSucceeded>Seat 14A confirmed</ng-template>
          </cngx-popover-action>
        </div>
      </div>
    </cngx-popover-panel>
  </div>`,
};
