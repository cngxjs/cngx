import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: all 5 skins side-by-side',
  subtitle:
    'Every skin (classic + 4 new) rendered with the same 3-step state - step 1 completed, step 2 active, step 3 upcoming - so reviewers can compare them at a glance.',
  description:
    'Canonical reference shot for design review. Each row uses identical structure (3 steps, same labels, same active/completed/upcoming state) and only the <code>skin</code> input differs. Reviewers can spot layout shifts, alignment drift, or contrast regressions across skins by eye. Useful as a static screenshot target for visual-regression suites.',
  level: 'organism',
  audience: ['design', 'a11y', 'dev'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep'],
  moduleImports: [
    "import { CngxStep } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep'],
  setup: `protected readonly active = signal(1);`,
  template: `  <div class="cngx-stepper-side-by-side">
    <section>
      <h3>classic</h3>
      <cngx-stepper [(activeStepIndex)]="active" aria-label="Classic skin">
        <div cngxStep label="Step 1"></div>
        <div cngxStep label="Step 2"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>linear-minimal</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="linear-minimal" aria-label="Linear minimal">
        <div cngxStep label="Step 1"></div>
        <div cngxStep label="Step 2"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>stripe-status-rich</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="stripe-status-rich" aria-label="Stripe status rich">
        <div cngxStep label="Step 1"></div>
        <div cngxStep label="Step 2"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>path-chevron</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="path-chevron" aria-label="Path chevron">
        <div cngxStep label="Step 1"></div>
        <div cngxStep label="Step 2"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>pill-segment</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="pill-segment" aria-label="Pill segment">
        <div cngxStep label="Step 1"></div>
        <div cngxStep label="Step 2"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
  </div>`,
};
