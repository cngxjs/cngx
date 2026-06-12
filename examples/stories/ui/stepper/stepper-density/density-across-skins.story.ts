import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: density across skins',
  subtitle:
    'The same continuous <code>density: \'auto\'</code> model on every skin. Pick a skin and drag the frame edge: labels stay full while there is room, then give way furthest-from-active first, and the active label stays readable - with no horizontal scrollbar.',
  description:
    'Density is orthogonal to the visual skin - it lives on the shared strip structure (<code>.cngx-stepper__label</code> / <code>__step</code>), so the continuous distance-weighted shrink applies identically to classic, linear-minimal, stripe-status-rich, path-chevron, pill-segment, chips and breadcrumb. Switch the skin and resize: labels stay full while they fit, then ellipsis-truncate in flow with the step furthest from the active one giving way first, while the active label is kept as the anchor - the strip never grows a horizontal scrollbar on any skin, and freed space is reused rather than left empty. Each skin keeps its own treatment: skins with a numbered disc (classic, stripe-status-rich) keep it visible as labels collapse; equal-tile skins (path-chevron, pill-segment) keep equal tiles; label-only skins with no number (chips, breadcrumb, path-chevron) truncate to a small readable stub. <code>[skin]</code> is a per-instance input; the density config comes from <code>provideStepperConfigAt(withStepperDensity(\'auto\'))</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'visual-variants'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, provideStepperConfigAt, withStepperDensity, type CngxStepperSkin } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  viewProviders: [
    "provideStepperConfigAt(withStepperDensity('auto', { compact: 145, minimal: 120 }))",
  ],
  setup: `protected readonly active = signal(0);
  protected readonly skin = signal<CngxStepperSkin>('classic');
  protected readonly steps = ['Repository', 'Validation', 'Packaging', 'Deployment'];`,
  setupChrome: `  protected readonly skins: CngxStepperSkin[] = ['classic', 'linear-minimal', 'stripe-status-rich', 'path-chevron', 'pill-segment', 'chips', 'breadcrumb'];
  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, this.steps.length - 1));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <div style="resize: horizontal; overflow: hidden; min-width: 320px; max-width: 100%; width: 560px;">
    <cngx-stepper [(activeStepIndex)]="active" [skin]="skin()" aria-label="Release pipeline">
      @for (label of steps; track label) {
        <div cngxStep [label]="label">
          <ng-template cngxStepContent><p>{{ label }} stage.</p></ng-template>
        </div>
      }
    </cngx-stepper>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="button-row" role="group" aria-label="Skin">
      @for (s of skins; track s) {
        <button type="button" class="chip" [attr.aria-pressed]="skin() === s" (click)="skin.set(s)">{{ s }}</button>
      }
    </div>
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-value">Drag the frame's right edge to narrow it; the active skin degrades without a scrollbar.</span></div>
  </div>`,
};
