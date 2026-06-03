import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: classic + [connectors] inline rail',
  subtitle:
    'Opt the classic skin into a solid completed/upcoming connector rail via <code>[connectors]="true"</code>. Per-segment color cascades from the preceding step\'s <code>[data-state]</code> - 100% CSS, no derivation. The rule is double-scoped on <code>[data-skin=\'classic\']</code>: swap skins below and the rail disappears (each non-classic skin ships its own decoration).',
  description:
    'The connector rail is a classic-skin-scoped modifier, not a sixth skin and not a cross-skin orthogonal flag. Use it for the canonical "connected wizard" look on the classic numbered/icon disc layout, horizontal or vertical. The skin radio in the chrome row proves the scope: linear-minimal, stripe-status-rich, path-chevron, and pill-segment each ship their own inter-step decoration and ignore <code>[connectors]</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  setup: `protected readonly active = signal(1);`,
  setupChrome: `  protected readonly skinOptions = ['classic', 'linear-minimal', 'stripe-status-rich', 'path-chevron', 'pill-segment'] as const;
  protected readonly orientationOptions = ['horizontal', 'vertical'] as const;
  protected readonly skin = signal<typeof this.skinOptions[number]>('classic');
  protected readonly orientation = signal<typeof this.orientationOptions[number]>('horizontal');
  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 3));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper
    [(activeStepIndex)]="active"
    [skin]="skin()"
    [orientation]="orientation()"
    [connectors]="true"
    aria-label="Onboarding"
  >
    <div cngxStep label="Account" [completed]="active() > 0">
      <ng-template cngxStepContent>
        <p>Create the account and verify the email address.</p>
      </ng-template>
    </div>
    <div cngxStep label="Profile" [completed]="active() > 1">
      <ng-template cngxStepContent>
        <p>Add display name, avatar, and locale preferences.</p>
      </ng-template>
    </div>
    <div cngxStep label="Workspace" [completed]="active() > 2">
      <ng-template cngxStepContent>
        <p>Pick a workspace template and invite teammates.</p>
      </ng-template>
    </div>
    <div cngxStep label="Done">
      <ng-template cngxStepContent>
        <p>Setup complete - jump into the dashboard.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
    <fieldset style="display:flex;gap:12px;align-items:center;border:0;padding:0;margin:0">
      <legend style="font-weight:600;margin-right:4px">Skin</legend>
      @for (s of skinOptions; track s) {
        <label style="display:inline-flex;gap:4px;align-items:center">
          <input type="radio" name="connectors-demo-skin" [value]="s" [checked]="skin() === s" (change)="skin.set(s)" />
          <span>{{ s }}</span>
        </label>
      }
    </fieldset>
    <fieldset style="display:flex;gap:12px;align-items:center;border:0;padding:0;margin:0">
      <legend style="font-weight:600;margin-right:4px">Orientation</legend>
      @for (o of orientationOptions; track o) {
        <label style="display:inline-flex;gap:4px;align-items:center">
          <input type="radio" name="connectors-demo-orientation" [value]="o" [checked]="orientation() === o" (change)="orientation.set(o)" />
          <span>{{ o }}</span>
        </label>
      }
    </fieldset>
  </div>`,
};
