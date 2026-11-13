import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: Footer actions without a variant',
  subtitle:
    'A plain panel (no <code>variant</code>) with a ghost <code>button[cngxPopoverDismiss]</code>, a confirm disabled with a reason, and a solid primary <code>button[cngxPopoverAction]</code> with <code>cngxPending</code> / <code>cngxSucceeded</code> / <code>cngxFailed</code> templates.',
  description:
    'The footer actions are button-family hosts pinned to <code>sm</code>; their tone comes from the button, not from the panel, so a plain panel paints them the same as a tinted one. Both hosts take the button-family axes and slots: Cancel is <code>cngxPopoverDismiss="ghost"</code>, and Cancel and Publish project a <code>cngxButtonStart</code> icon (<code>svg[cngxIconSvg]</code>, decorative, so the label stays the accessible name). "Schedule" is a confirm with <code>[disabled]</code> and a <code>disabledReason</code>: it stays focusable, renders <code>aria-disabled="true"</code>, refuses the run and names the reason through <code>aria-describedby</code>. "Publish" runs its <code>[action]</code>: past the show delay the pending template replaces the label and stays through the dwell after the settle, then the result template shows once the busy visual releases, or <code>cngxFailed</code> on an error. Cancel and every close return focus to the trigger. <code>status()</code> of both confirms is readable through their <code>exportAs</code>.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxPopoverPanel', 'CngxPopoverAction', 'CngxPopoverDismiss'],
  moduleImports: [
    "import { signal } from '@angular/core';",
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter, CngxPopoverAction, CngxPopoverDismiss } from '@cngx/common/popover';",
    "import { CngxPending, CngxSucceeded, CngxFailed } from '@cngx/common/interactive';",
    "import { CngxButtonStart } from '@cngx/common/button';",
    "import { CngxIconSvg } from '@cngx/common/display';",
    "import { CNGX_ICON_CHECK, CNGX_ICON_X } from '@cngx/utils';",
    "import { failDemoActionWhen } from '../../../../fixtures';",
  ],
  imports: [
    'CngxPopoverPanel',
    'CngxPopoverTrigger',
    'CngxPopoverHeader',
    'CngxPopoverBody',
    'CngxPopoverFooter',
    'CngxPopoverAction',
    'CngxPopoverDismiss',
    'CngxPending',
    'CngxSucceeded',
    'CngxFailed',
    'CngxButtonStart',
    'CngxIconSvg',
  ],
  setup: `protected readonly cancelIcon = CNGX_ICON_X;
  protected readonly publishIcon = CNGX_ICON_CHECK;
  protected readonly scheduleReason = 'Pick a publish date first';
  protected readonly noDate = signal(true);
  protected readonly schedule = () => new Promise<void>((resolve) => setTimeout(resolve, 600));
  protected readonly publish = () => new Promise<void>((resolve) => setTimeout(resolve, 1200));`,
  setupChrome: `
  protected readonly failNext = signal(false);
  // Makes publish fail while the switch below is on.
  private readonly failSwitch = failDemoActionWhen(
    this,
    'publish',
    () => this.failNext(),
    () => 'Server unavailable',
  );`,
  template: `
  <div class="demo-popover-stage">
    <button type="button" [cngxPopoverTrigger]="draft.popover" (click)="draft.popover.toggle()" class="chip">
      Publish draft
    </button>
    <cngx-popover-panel #draft [showClose]="true" placement="bottom-start">
      <span cngxPopoverHeader>Publish "Release notes 0.3"?</span>
      <p cngxPopoverBody>Readers see the post as soon as it is published.</p>
      <div cngxPopoverFooter>
        <button cngxPopoverDismiss="ghost">
          <svg cngxButtonStart [cngxIconSvg]="cancelIcon" aria-hidden="true"></svg>
          Cancel
        </button>
        <button
          cngxPopoverAction
          [action]="schedule"
          [disabled]="noDate()"
          [disabledReason]="scheduleReason"
          #later="cngxPopoverAction"
        >
          Schedule
        </button>
        <button cngxPopoverAction="solid" tone="primary" [action]="publish" #act="cngxPopoverAction">
          <svg cngxButtonStart [cngxIconSvg]="publishIcon" aria-hidden="true"></svg>
          Publish
          <ng-template cngxPending>Publishing...</ng-template>
          <ng-template cngxSucceeded>Published</ng-template>
          <ng-template cngxFailed let-err>{{ err }}</ng-template>
        </button>
      </div>
    </cngx-popover-panel>
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label>
      <input type="checkbox" [checked]="noDate()" (change)="noDate.set($any($event.target).checked)" />
      No publish date yet (disables Schedule)
    </label>
    <label>
      <input type="checkbox" [checked]="failNext()" (change)="failNext.set($any($event.target).checked)" />
      Fail the next publish
    </label>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">State</p>
    <dl class="cngx-ex-sr-output__list">
      <dt>Publish status()</dt>
      <dd>{{ act.status() }}</dd>
      <dt>Publish busyVisible()</dt>
      <dd>{{ act.busyVisible() }}</dd>
      <dt>Schedule status()</dt>
      <dd>{{ later.status() }}</dd>
      <dt>Schedule reason</dt>
      <dd>{{ noDate() ? scheduleReason : '-' }}</dd>
    </dl>
    <p class="cngx-ex-sr-output__note">
      status() follows the run at once; the label follows busyVisible(): the pending template while it holds, the result template once it releases. Tab to Schedule while it is disabled: the reason is its accessible description.
    </p>
  </div>`,
};
