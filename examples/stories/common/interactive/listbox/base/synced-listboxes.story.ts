import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxListbox: two listboxes, one signal',
  subtitle:
    'Pick in either box - the other follows. Both listboxes two-way bind <code>[(value)]</code> to the SAME signal; they never talk to each other, both views derive from one source.',
  description:
    'CngxListbox.value is a model(), so two hosts bound to one WritableSignal stay in sync without any bridging code (Ableitung statt Verwaltung). No cngx-form-field and no field bridge are involved; syncing two listboxes is a CngxListbox capability, not a forms concern.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Listbox pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',
    },
  ],
  apiComponents: ['CngxListbox', 'CngxOption'],
  moduleImports: [
    "import { CngxListbox, CngxOption } from '@cngx/common/interactive';",
  ],
  imports: ['CngxListbox', 'CngxOption'],
  setup: `protected readonly pick = signal<string | undefined>(undefined);`,
  template: `  <div class="demo-synced-listboxes">
    <div>
      <span class="demo-synced-listboxes__cap">Listbox A</span>
      <div cngxListbox [(value)]="pick" [label]="'Size A'" tabindex="0" class="demo-listbox-surface">
        <div cngxOption value="s">Small</div>
        <div cngxOption value="m">Medium</div>
        <div cngxOption value="l">Large</div>
        <div cngxOption value="xl">X-Large</div>
      </div>
    </div>

    <div>
      <span class="demo-synced-listboxes__cap">Listbox B (synced)</span>
      <div cngxListbox [(value)]="pick" [label]="'Size B'" tabindex="0" class="demo-listbox-surface">
        <div cngxOption value="s">Small</div>
        <div cngxOption value="m">Medium</div>
        <div cngxOption value="l">Large</div>
        <div cngxOption value="xl">X-Large</div>
      </div>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">shared pick()</span>
      <span class="event-value">{{ pick() ?? '-' }}</span>
    </div>
  </div>`,
};
