import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSplitButton: Custom caret host',
  subtitle: 'Write your own split caret: <code>CngxButtonBrain</code>, the two menu triggers and <code>CngxSplitCaret</code> in <code>hostDirectives</code>.',
  description: '<code>cngxIconMenuButton</code> is one caret; any button host can be another. <code>demoOutlineCaret</code> declares <code>CngxButtonBrain</code>, <code>CngxMenuTrigger</code>, <code>CngxPopoverTrigger</code> and <code>CngxSplitCaret</code>. As the direct child of <code>cngxSplitButton</code> it becomes the caret: while the main action runs or is disabled it reads <code>aria-disabled</code>, never opens its menu (an open menu still closes) and points <code>aria-describedby</code> at the cause, the main button\'s reason or the busy note. The host renders the name and the busy note from <code>CngxSplitCaret</code> (<code>label()</code>, <code>busyNote()</code>, <code>busyNoteId</code>), both from the language pack. Run the publish or disable it to see the caret follow. The fixture sits next to this story as <code>_outline-caret.component.ts</code>. The dashed box below mirrors what a screen reader gets for the main button and the caret: role, name, description, state and the announcements are exposed or spoken, not painted.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Button Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    },
  ],
  apiComponents: ['CngxSplitCaret', 'CngxSplitButton', 'CngxButtonBrain', 'CngxButton', 'CngxAsyncClick'],
  moduleImports: [
    "import { CngxButton } from '@cngx/common/button';",
    "import { CngxAsyncClick, CngxMenu, CngxMenuItem } from '@cngx/common/interactive';",
    "import { CngxSplitButton } from '@cngx/common/menu-button';",
    "import { CngxPopover } from '@cngx/common/popover';",
    "import { OutlineCaret } from './_outline-caret.component';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxButton', 'CngxAsyncClick', 'CngxMenu', 'CngxMenuItem', 'CngxSplitButton', 'CngxPopover', 'OutlineCaret'],
  setup: `
  protected readonly locked = signal(false);

  protected readonly publish = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 1500));`,
  template: `
  <div cngxSplitButton variant="outline" aria-label="Publish">
    <button
      cngxButton
      [cngxAsyncClick]="publish"
      [disabled]="locked()"
      disabledReason="The document is locked for review."
      #run="cngxAsyncClick"
    >
      Publish
    </button>
    <button demoOutlineCaret [menu]="menu" [popover]="pop"></button>
  </div>
  <div cngxPopover placement="bottom-end" #pop="cngxPopover">
    <ul cngxMenu [label]="'Publish options'" tabindex="0" #menu="cngxMenu">
      <li cngxMenuItem value="draft">Save as draft</li>
      <li cngxMenuItem value="team">Publish to team only</li>
    </ul>
  </div>`,
  setupChrome: `
  // Mirrors the accessibility layer of the buttons into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'main', selector: '[cngxsplitbutton] > button:first-of-type' },
    { label: 'caret', selector: '[cngxsplitbutton] > button:last-of-type' },
  ]);

  protected handleLock(): void {
    this.locked.update((v) => !v);
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleLock()">{{ locked() ? 'Unlock' : 'Lock' }} the document</button>
  </div>
  <div class="status-row">Main busy: {{ run.pending() ? 'yes' : 'no' }}</div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} role</dt>
        <dd>{{ row.role }}{{ row.popup ? ', ' + row.popup : '' }}</dd>
        <dt>{{ row.label }} name</dt>
        <dd>"{{ row.name }}"</dd>
        <dt>{{ row.label }} description</dt>
        <dd>{{ row.description }}</dd>
        <dt>{{ row.label }} state</dt>
        <dd>aria-disabled {{ row.disabled }}, aria-busy {{ row.busy }}</dd>
      }
      @for (entry of sr.heard(); track entry.n) {
        <dt>announced #{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes, plus the last five texts written to a live region, newest last; none of it is painted. The name approximates accname: aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
