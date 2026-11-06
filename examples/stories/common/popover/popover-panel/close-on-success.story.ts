import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: Close on success',
  subtitle:
    'A footer confirm whose success closes the panel: <code>providePopoverPanel(withCloseOnSuccess(600))</code> scoped to this demo, focus back on the trigger, the result spoken outside the panel.',
  description:
    'The close-on-success delay is a panel config value, so the demo installs it the way an app would, through <code>providePopoverPanel(withCloseOnSuccess(600))</code>, here in the component\'s <code>viewProviders</code> so it reaches only this demo (an app puts it in its root or route providers). Each success of <code>button[cngxPopoverAction]</code> closes the composing popover 600 ms after the settle; a failure keeps the panel open with the <code>cngxFailed</code> template, so the user can retry or cancel. One confirm can deviate with <code>[closeOnSuccessDelay]</code>: a number wins over the config (and works without <code>withCloseOnSuccess()</code>), <code>null</code> keeps that confirm\'s panel open. Neither footer host restores focus itself: the panel\'s restore claim returns focus to the trigger after the close, and the trigger reports <code>aria-expanded="false"</code>. The confirm\'s own live region sits inside the panel and hides with it, so a success that closes the panel is spoken once through <code>CngxLiveAnnouncer</code> in a region outside the panel instead. Tick "Fail the next archive" to see the panel stay open on an error.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxPopoverPanel', 'CngxPopoverAction', 'CngxPopoverDismiss'],
  moduleImports: [
    "import { signal } from '@angular/core';",
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter, CngxPopoverAction, CngxPopoverDismiss, providePopoverPanel, withCloseOnSuccess } from '@cngx/common/popover';",
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
  viewProviders: ['providePopoverPanel(withCloseOnSuccess(600))'],
  setup: `protected readonly failNext = signal(false);
  protected readonly archive = () =>
    new Promise<void>((resolve, reject) =>
      setTimeout(() => (this.failNext() ? reject('Server unavailable') : resolve()), 800),
    );`,
  template: `
  <div class="demo-popover-stage">
    <button type="button" [cngxPopoverTrigger]="confirm.popover" (click)="confirm.popover.toggle()" class="chip">
      Archive project
    </button>
    <cngx-popover-panel #confirm placement="bottom-start">
      <span cngxPopoverHeader>Archive "Atlas"?</span>
      <p cngxPopoverBody>Archived projects are read-only until you restore them.</p>
      <div cngxPopoverFooter>
        <button cngxPopoverDismiss="ghost">Cancel</button>
        <button cngxPopoverAction="solid" tone="primary" [action]="archive" #act="cngxPopoverAction">
          Archive
          <ng-template cngxPending>Archiving...</ng-template>
          <ng-template cngxSucceeded>Archived</ng-template>
          <ng-template cngxFailed let-err>{{ err }}</ng-template>
        </button>
      </div>
    </cngx-popover-panel>
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label>
      <input type="checkbox" [checked]="failNext()" (change)="failNext.set($any($event.target).checked)" />
      Fail the next archive
    </label>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">State</p>
    <dl class="cngx-ex-sr-output__list">
      <dt>Archive status()</dt>
      <dd>{{ act.status() }}</dd>
      <dt>Archive busyVisible()</dt>
      <dd>{{ act.busyVisible() }}</dd>
      <dt>Popover state()</dt>
      <dd>{{ confirm.popover.state() }}</dd>
    </dl>
    <p class="cngx-ex-sr-output__note">
      A success closes the panel 600 ms after the settle and focus returns to the trigger; an error keeps it open.
    </p>
  </div>`,
};
