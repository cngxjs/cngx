import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: Footer actions without a variant',
  subtitle:
    'A plain panel (no <code>variant</code>) with <code>button[cngxPopoverDismiss]</code>, a confirm disabled with a reason, and a solid primary <code>button[cngxPopoverAction]</code> with <code>cngxPending</code> / <code>cngxSucceeded</code> / <code>cngxFailed</code> templates.',
  description:
    'The footer actions are button-family hosts pinned to <code>sm</code>; their tone comes from the button, not from the panel, so a plain panel paints them the same as a tinted one. "Schedule" is a confirm with <code>[disabled]</code> and a <code>disabledReason</code>: it stays focusable, renders <code>aria-disabled="true"</code>, refuses the run and names the reason through <code>aria-describedby</code>. Untick "No publish date yet" to enable it. "Publish" runs its <code>[action]</code>: past the show delay the pending template replaces the label, then the result template shows; tick "Fail the next publish" to reach <code>cngxFailed</code>. Cancel and every close return focus to the trigger. The readout below shows <code>status()</code> of both confirms through their <code>exportAs</code>.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxPopoverPanel', 'CngxPopoverAction', 'CngxPopoverDismiss'],
  moduleImports: [
    "import { signal } from '@angular/core';",
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter, CngxPopoverAction, CngxPopoverDismiss } from '@cngx/common/popover';",
    "import { CngxPending, CngxSucceeded, CngxFailed } from '@cngx/common/interactive';",
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
  ],
  setup: `protected readonly noDate = signal(true);
  protected readonly failNext = signal(false);
  protected readonly schedule = () => new Promise<void>((resolve) => setTimeout(resolve, 600));
  protected readonly publish = () =>
    new Promise<void>((resolve, reject) =>
      setTimeout(() => (this.failNext() ? reject('Server unavailable') : resolve()), 1200),
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
        <button cngxPopoverDismiss>Cancel</button>
        <button
          cngxPopoverAction
          [action]="schedule"
          [disabled]="noDate()"
          disabledReason="Pick a publish date first"
          #later="cngxPopoverAction"
        >
          Schedule
        </button>
        <button cngxPopoverAction="solid" tone="primary" [action]="publish" #act="cngxPopoverAction">
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
      <dd>{{ noDate() ? 'Pick a publish date first' : '-' }}</dd>
    </dl>
    <p class="cngx-ex-sr-output__note">
      status() follows the run at once; the pending template waits for busyVisible(). Tab to Schedule while it is disabled: the reason is its accessible description.
    </p>
  </div>`,
};
