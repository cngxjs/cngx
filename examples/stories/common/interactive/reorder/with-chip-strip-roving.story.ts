import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorder: With chip strip roving',
  subtitle: 'Pair <code>CngxReorder</code> with <code>createChipStripRoving()</code> so plain <kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd> moves focus and <kbd>Alt</kbd>+arrow moves the chip.',
  description: 'The two helpers split the keyboard contract cleanly so they can coexist on the same chip strip without racing. <code>CngxReorder</code> claims modifier+arrow combinations (default <code>Alt</code>) for chip moves; <code>createChipStripRoving()</code> handles plain arrows for focus traversal. The roving controller is a plain factory (not a directive), call it in an injection context, hand it a <code>count</code> signal and a container <code>Signal&lt;HTMLElement | null&gt;</code> resolved via <code>viewChild</code>, then bind <code>[attr.tabindex]</code> off the controller\'s <code>activeIndex</code> on each wrapper. The controller clamps <code>activeIndex</code> automatically when the count drops, so removing the last chip never leaves focus dangling.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxReorder',
    'createChipStripRoving',
  ],
  moduleImports: [
    'import { CngxReorder, createChipStripRoving, type CngxReorderEvent } from \'@cngx/common/interactive\';',
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxReorder', 'CngxChip'],
  references: [
    { label: 'WAI-ARIA APG: Managing focus within components', href: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_general_within' },
    { label: 'WCAG 2.1 SC 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
  setup: `
  protected readonly stripRef = viewChild<ElementRef<HTMLElement>>('strip');

  protected readonly items = signal<readonly { id: string; label: string }[]>([
    { id: 'a', label: 'Alice' },
    { id: 'b', label: 'Bob' },
    { id: 'c', label: 'Charlie' },
    { id: 'd', label: 'Dani' },
  ]);

  protected readonly count = computed<number>(() => this.items().length);

  protected readonly roving = createChipStripRoving({
    count: this.count,
    container: computed(() => this.stripRef()?.nativeElement ?? null),
  });

  protected handleReorder(event: CngxReorderEvent<{ id: string; label: string }>): void {
    this.items.set(event.next);
    this.roving.focusAt(event.toIndex);
  }`,
  setupChrome: `
  protected readonly itemsLabel = computed<string>(() =>
    this.items().map((i) => i.label).join(', '),
  );`,
  template: `
  <div
    #strip
    [cngxReorder]="items"
    (reordered)="handleReorder($event)"
    (keydown)="roving.handleKeydown($event)"
    style="display:inline-flex; gap:8px; flex-wrap:wrap; min-height:2.5rem"
  >
    @for (item of items(); track item.id; let i = $index) {
      <cngx-chip
        [attr.data-reorder-index]="i"
        [attr.tabindex]="i === roving.activeIndex() ? 0 : -1"
        (focus)="roving.markFocused(i)"
      >
        <button
          cngxReorderHandle
          type="button"
          tabindex="-1"
          [attr.aria-label]="'Move ' + item.label"
          style="margin-right:6px"
        >⋮⋮</button>
        {{ item.label }}
      </cngx-chip>
    }
  </div>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">Tab into the strip, then move focus with plain <kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd>. Hold <kbd>Alt</kbd> with the arrow to move the focused chip instead. Focus follows the chip after a move, so successive presses keep operating on the same item.</p>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">order</span>
      <span class="event-value">{{ itemsLabel() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">activeIndex()</span>
      <span class="event-value">{{ roving.activeIndex() }}</span>
    </div>
  </div>`,
};
