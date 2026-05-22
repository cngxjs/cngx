import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChip: Removable',
  subtitle: '<code>[removable]="true"</code> renders the close button; <code>(remove)</code> fires on click. The chip never mutates state itself.',
  description: 'The chip atom does not own the removal: it dispatches the event and the parent decides whether to splice the value out of an array, route through a commit controller, or do nothing. Click the ✕ on a chip below to fire the event; the log shows what the parent sees. Use <code>[removeAriaLabel]</code> to feed the close button a specific accessible name like "Remove Frontend" instead of the generic default.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: [
    'CngxChip',
  ],
  moduleImports: [
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxChip'],
  setup: `
  protected readonly tags = signal<string[]>(['Frontend', 'Cleared', 'Pending review']);

  protected handleRemove(tag: string): void {
    this.tags.update((current) => current.filter((t) => t !== tag));
    this.removeLog.update((log) => [...log.slice(-9), tag + ' @ ' + new Date().toLocaleTimeString()]);
  }`,
  setupChrome: `
  protected readonly removeLog = signal<string[]>([]);

  protected handleReset(): void {
    this.tags.set(['Frontend', 'Cleared', 'Pending review']);
    this.removeLog.set([]);
  }`,
  template: `
  <div style="display:flex; gap:8px; flex-wrap:wrap; min-height:2rem">
    @for (tag of tags(); track tag) {
      <cngx-chip
        [removable]="true"
        [removeAriaLabel]="'Remove ' + tag"
        (remove)="handleRemove(tag)"
      >
        {{ tag }}
      </cngx-chip>
    } @empty {
      <span>No tags. Reset to restore.</span>
    }
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleReset()">Reset</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    @for (entry of removeLog(); track entry) {
      <div class="event-row">
        <span class="event-label">remove</span>
        <span class="event-value">{{ entry }}</span>
      </div>
    } @empty {
      <div class="event-row">
        <span class="event-label">remove</span>
        <span class="event-value">No events yet</span>
      </div>
    }
  </div>`,
};
