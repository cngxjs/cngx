import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: close and empty slots',
  subtitle:
    'Project <code>*cngxPopoverClose</code> to replace the built-in close button and <code>*cngxPopoverEmpty</code> to give the <code>[empty]</code> state visible content. Tick "No activity" to reach the empty state, untick "Use custom slot templates" to see the defaults.',
  description:
    'Neither slot has a template context. The close template is rendered in the header row only when <code>[showClose]</code> is on, and it owns its own button, so it calls <code>hide()</code> on the panel through a template reference and carries its own accessible name (here the visible text "Done"). Without an empty template the empty state renders no content at all, because the panel ships no default empty copy. While <code>[empty]</code> is true the header row (and with it the close control) is not rendered; Escape and a second click on the trigger still dismiss the panel.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'async-state'],
  apiComponents: ['CngxPopoverPanel', 'CngxPopoverClose', 'CngxPopoverEmpty'],
  moduleImports: [
    "import { CngxPopoverBody, CngxPopoverClose, CngxPopoverEmpty, CngxPopoverHeader, CngxPopoverPanel, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxPopoverPanel',
    'CngxPopoverTrigger',
    'CngxPopoverHeader',
    'CngxPopoverBody',
    'CngxPopoverClose',
    'CngxPopoverEmpty',
  ],
  setup: `protected readonly customSlots = signal(true);
  protected readonly noActivity = signal(false);`,
  template: `  <div class="demo-popover-stage">
    <button
      type="button"
      class="chip"
      [cngxPopoverTrigger]="activity.popover"
      (click)="activity.popover.toggle()"
    >
      Recent activity
    </button>
    <cngx-popover-panel
      #activity
      [showClose]="true"
      [empty]="noActivity()"
      placement="bottom-start"
    >
      <span cngxPopoverHeader>Recent activity</span>
      <ul cngxPopoverBody class="demo-popover-activity">
        <li>Invoice 1042 was paid</li>
        <li>Anna joined the workspace</li>
      </ul>
      @if (customSlots()) {
        <ng-template cngxPopoverClose>
          <button
            type="button"
            class="demo-popover-close"
            (click)="activity.popover.hide()"
          >
            Done
          </button>
        </ng-template>
        <ng-template cngxPopoverEmpty>
          <p class="demo-popover-empty">Nothing happened in the last 7 days.</p>
        </ng-template>
      }
    </cngx-popover-panel>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input
        type="checkbox"
        [checked]="customSlots()"
        (change)="customSlots.set($any($event.target).checked)"
      />
      Use custom slot templates
    </label>
    <label>
      <input
        type="checkbox"
        [checked]="noActivity()"
        (change)="noActivity.set($any($event.target).checked)"
      />
      No activity (empty state)
    </label>
  </div>`,
};
