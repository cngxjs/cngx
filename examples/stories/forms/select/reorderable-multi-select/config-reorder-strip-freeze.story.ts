import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorderableMultiSelect: strip freeze via withReorderStripFreeze',
  subtitle:
    '<code>provideReorderableSelectConfigAt(withReorderStripFreeze(false))</code> turns off the freeze-on-commit for the subtree, so a second reorder supersedes an in-flight commit through the commit controller\'s supersede semantics instead of waiting for the first to settle. The default (<code>true</code>) freezes the strip until each commit resolves.',
  description:
    'Turn on <em>slow server</em>, reorder a chip, then reorder again before the first save settles: with freeze off the later reorder wins and the earlier commit is dropped. The commit log shows each intended order.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'template-only',
  apiComponents: ['CngxReorderableMultiSelect'],
  moduleImports: [
    "import { CngxReorderableMultiSelect, provideReorderableSelectConfigAt, withReorderStripFreeze, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { delay, of } from 'rxjs';",
  ],
  imports: ['CngxReorderableMultiSelect'],
  viewProviders: ['...provideReorderableSelectConfigAt(withReorderStripFreeze(false))'],
  setup: `protected readonly songs: CngxSelectOptionDef<string>[] = [
    { value: 's1', label: 'Intro' },
    { value: 's2', label: 'Heart-Shaped Box' },
    { value: 's3', label: 'Midnight City' },
    { value: 's4', label: 'Teardrop' },
  ];
  protected readonly order = signal<string[]>(['s1', 's2', 's3']);
  protected readonly commitAction = (intended: string[] | undefined) => {
    const line = new Date().toLocaleTimeString() + ' -> [' + (intended ?? []).join(', ') + ']';
    this.commitLog.update((l) => [...l.slice(-4), line]);
    return of(intended).pipe(delay(this.slow() ? 1200 : 300));
  };`,
  setupChrome: `protected readonly slow = signal(true);
  protected readonly commitLog = signal<string[]>([]);`,
  template: `<cngx-reorderable-multi-select
  [label]="'Playlist'"
  [options]="songs"
  [commitAction]="commitAction"
  [commitMode]="'optimistic'"
  [(values)]="order"
/>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="slow.set(!slow())">
      {{ slow() ? 'Slow server: ON' : 'Slow server: off' }}
    </button>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row"><span class="event-label">Order</span><span class="event-value">{{ order().join(' > ') || '-' }}</span></div>
    @for (line of commitLog(); track line) {
      <div class="event-row"><span class="event-label">commit</span><span class="event-value">{{ line }}</span></div>
    }
  </div>`,
};
