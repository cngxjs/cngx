import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: state copy cascade',
  subtitle:
    'Set the loading, error and empty copy per panel with <code>[loadingText]</code> / <code>[errorText]</code> / <code>[emptyText]</code>, or for a whole scope with <code>providePopoverPanel(withPopoverPanelLabels({ loading, error, empty }))</code>.',
  description:
    'Neither panel projects a state template, so each state view prints resolved copy. This view provides <code>withPopoverPanelLabels(...)</code> in its <code>viewProviders</code>, so every panel in it reads the config tier. "Shared files" binds no copy input and shows the config copy. "Team files" binds the three inputs, which win over the config tier. Unbind an input and that panel falls back to the config copy; drop the provider too and it falls back to the <code>popover</code> section of the language pack ("Loading", "Could not load", "Nothing to show"). Pick a state, then open either panel. In the error and empty views <code>aria-describedby</code> points at the state surface, so a screen reader reads the same copy as the dialog description.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'async-state'],
  apiComponents: ['CngxPopoverPanel'],
  moduleImports: [
    "import { CngxPopoverBody, CngxPopoverHeader, CngxPopoverPanel, CngxPopoverTrigger, providePopoverPanel, withPopoverPanelLabels } from '@cngx/common/popover';",
  ],
  imports: ['CngxPopoverPanel', 'CngxPopoverTrigger', 'CngxPopoverHeader', 'CngxPopoverBody'],
  viewProviders: [
    "providePopoverPanel(withPopoverPanelLabels({ loading: 'Fetching shared files', error: 'Shared files are unavailable', empty: 'Nobody shared a file yet' }))",
  ],
  setup: `protected readonly view = signal<'loading' | 'error' | 'empty'>('empty');`,
  template: `  <div class="demo-popover-stage" style="display:flex;gap:12px;flex-wrap:wrap">
    <div>
      <button
        type="button"
        class="chip"
        [cngxPopoverTrigger]="shared.popover"
        (click)="shared.popover.toggle()"
      >
        Shared files
      </button>
      <cngx-popover-panel
        #shared
        [showClose]="true"
        [loading]="view() === 'loading'"
        [error]="view() === 'error' ? 'Network timeout' : undefined"
        [empty]="view() === 'empty'"
        placement="bottom-start"
      >
        <span cngxPopoverHeader>Shared files</span>
        <p cngxPopoverBody>Quarterly report.pdf</p>
      </cngx-popover-panel>
    </div>
    <div>
      <button
        type="button"
        class="chip"
        [cngxPopoverTrigger]="team.popover"
        (click)="team.popover.toggle()"
      >
        Team files
      </button>
      <cngx-popover-panel
        #team
        [showClose]="true"
        [loading]="view() === 'loading'"
        [error]="view() === 'error' ? 'Network timeout' : undefined"
        [empty]="view() === 'empty'"
        loadingText="Fetching team files"
        errorText="Team files are unavailable"
        emptyText="Your team has no files yet"
        placement="bottom-start"
      >
        <span cngxPopoverHeader>Team files</span>
        <p cngxPopoverBody>Roadmap.docx</p>
      </cngx-popover-panel>
    </div>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px" role="radiogroup" aria-label="Panel state">
    <label>
      <input type="radio" name="state-copy-view" [checked]="view() === 'loading'" (change)="view.set('loading')" />
      Loading
    </label>
    <label>
      <input type="radio" name="state-copy-view" [checked]="view() === 'error'" (change)="view.set('error')" />
      Load error
    </label>
    <label>
      <input type="radio" name="state-copy-view" [checked]="view() === 'empty'" (change)="view.set('empty')" />
      Empty
    </label>
  </div>`,
};
