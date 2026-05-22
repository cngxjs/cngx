import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorder: Pointer and keyboard',
  subtitle: '<code>[cngxReorder]="items"</code> turns any container into a reorderable list. Drag the handle or hold <kbd>Alt</kbd> and press <kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd>.',
  description: 'Level-2 atom that adds pointer drag and modifier-keyboard reordering to a flat list. Reads the current order lazily from the signal you pass via <code>[cngxReorder]</code>; never writes back. The <code>(reordered)</code> event carries the new array as a fresh reference plus the from / to indices, so consumers stay in control of when and how to commit the move (direct signal write, optimistic commit, route through a controller). Pointer flow uses a handle that matches <code>[cngxReorderHandle]</code> or <code>[data-reorder-handle]</code>; keyboard flow needs the configured modifier (Alt by default) plus arrow / Home / End on a focused element inside an item. Escape during a drag cancels without emitting.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: [
    'CngxReorder',
  ],
  moduleImports: [
    'import { CngxReorder, type CngxReorderEvent } from \'@cngx/common/interactive\';',
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxReorder', 'CngxChip'],
  references: [
    { label: 'W3C Pointer Events Level 3', href: 'https://www.w3.org/TR/pointerevents3/' },
    { label: 'WCAG 2.1 SC 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
    { label: 'WCAG 2.1 SC 2.5.7 Dragging Movements', href: 'https://www.w3.org/WAI/WCAG21/Understanding/dragging-movements.html' },
  ],
  setup: `
  protected readonly items = signal<readonly { id: string; label: string }[]>([
    { id: 'a', label: 'Alice' },
    { id: 'b', label: 'Bob' },
    { id: 'c', label: 'Charlie' },
    { id: 'd', label: 'Dani' },
    { id: 'e', label: 'Erin' },
  ]);

  protected handleReorder(event: CngxReorderEvent<{ id: string; label: string }>): void {
    this.items.set(event.next);
    this.lastMove.set(\`\${event.fromIndex} → \${event.toIndex}\`);
  }`,
  setupChrome: `
  protected readonly lastMove = signal<string>('—');

  protected readonly itemsLabel = computed<string>(() =>
    this.items().map((i) => i.label).join(', '),
  );`,
  template: `
  <div
    [cngxReorder]="items"
    (reordered)="handleReorder($event)"
    style="display:inline-flex; gap:8px; flex-wrap:wrap; min-height:2.5rem"
  >
    @for (item of items(); track item.id; let i = $index) {
      <cngx-chip [attr.data-reorder-index]="i">
        <button
          cngxReorderHandle
          type="button"
          [attr.aria-label]="'Move ' + item.label"
          style="margin-right:6px"
        >⋮⋮</button>
        {{ item.label }}
      </cngx-chip>
    }
  </div>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">Drag the <code>⋮⋮</code> handle to reorder by pointer, or focus a handle and hold <kbd>Alt</kbd> with <kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd> / <kbd>Home</kbd> / <kbd>End</kbd> to reorder by keyboard. Press <kbd>Escape</kbd> mid-drag to cancel.</p>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">order</span>
      <span class="event-value">{{ itemsLabel() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">last move</span>
      <span class="event-value">{{ lastMove() }}</span>
    </div>
  </div>`,
};
