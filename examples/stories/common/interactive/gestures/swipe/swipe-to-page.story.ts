import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSwipe: swipe to page',
  subtitle: 'Swipe the card left or right to page through it. <code>axis="horizontal"</code> pins the gesture to the inline axis, so a vertical scroll never pages. The Previous and Next buttons are the keyboard and single-pointer path for the same action (WCAG 2.5.1).',
  description: 'Generic navigation atom: <code>(swiped)</code> emits the dominant direction once the pointer is released past <code>[threshold]</code>, and <code>swiping()</code>, <code>swipeProgress()</code> and <code>swipeDirection()</code> report the gesture while it builds. Unlike <code>CngxSwipeDismiss</code> it has no fixed direction or dismiss intent; the consumer maps the direction to an action.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    { label: 'WCAG 2.5.1 Pointer Gestures', href: 'https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures.html' },
  ],
  apiComponents: [
    'CngxSwipe',
  ],
  moduleImports: [
    'import { CngxSwipe, type SwipeDirection } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxSwipe'],
  setup: `protected readonly pages = ['Overview', 'Details', 'History'] as const;
  protected readonly page = signal(0);
  protected readonly lastSwipe = signal<SwipeDirection | null>(null);
  protected handleSwipe(direction: SwipeDirection): void {
    this.lastSwipe.set(direction);
    if (direction === 'left') {
      this.next();
    }
    if (direction === 'right') {
      this.previous();
    }
  }
  protected previous(): void {
    this.page.update((p) => Math.max(0, p - 1));
  }
  protected next(): void {
    this.page.update((p) => Math.min(this.pages.length - 1, p + 1));
  }`,
  template: `  <div
    cngxSwipe
    axis="horizontal"
    [threshold]="60"
    (swiped)="handleSwipe($event)"
    #sw="cngxSwipe"
    class="demo-gesture-target"
    [class.demo-gesture-target--accent]="sw.swiping()"
    style="display:flex;align-items:center;justify-content:center;width:240px;height:96px;user-select:none;"
    aria-live="polite"
  >
    Page {{ page() + 1 }} of {{ pages.length }}: {{ pages[page()] }}
  </div>
  <div class="button-row" style="margin-top:8px">
    <button type="button" class="chip" [attr.aria-disabled]="page() === 0" (click)="previous()">Previous</button>
    <button type="button" class="chip" [attr.aria-disabled]="page() === pages.length - 1" (click)="next()">Next</button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">swiping()</span>
      <span class="event-value">{{ sw.swiping() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">swipeProgress()</span>
      <span class="event-value">{{ sw.swipeProgress().toFixed(2) }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last swipe</span>
      <span class="event-value">{{ lastSwipe() ?? 'none' }}</span>
    </div>
  </div>`,
};
