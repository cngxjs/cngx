import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSwipeDismiss: directional swipe',
  subtitle: 'Swipe the box in the selected direction. <code>swipeProgress</code> updates during the gesture and <code>(swiped)</code> emits on pointer-up if delta exceeds the threshold (WCAG 2.5.2). A separate <em>Dismiss now</em> button provides the keyboard / single-tap alternative required by WCAG 2.5.1.',
  description: 'Single-direction swipe with progress signal, plus an alternative dismiss button so keyboard and assistive-tech users have an equal path.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    { label: 'WCAG 2.5.1 Pointer Gestures', href: 'https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures.html' },
    { label: 'WCAG 2.5.2 Pointer Cancellation', href: 'https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation.html' },
  ],
  apiComponents: [
    'CngxSwipeDismiss',
  ],
  moduleImports: [
    'import { CngxSwipeDismiss, type SwipeDirection } from \'@cngx/common\';',
  ],
  imports: ['CngxSwipeDismiss'],
  setup: `protected readonly swipeDir = signal<SwipeDirection>('left');
  protected readonly swipeDirs: SwipeDirection[] = ['left', 'right', 'up', 'down'];
  protected readonly swipeCount = signal(0);
  protected dismiss(): void {
    this.swipeCount.update(n => n + 1);
  }`,
  template: `  <div
    [cngxSwipeDismiss]="swipeDir()"
    #swipe="cngxSwipeDismiss"
    [threshold]="60"
    (swiped)="dismiss()"
    role="group"
    [attr.aria-label]="'Swipe ' + swipeDir() + ' to dismiss, or use the Dismiss now button'"
    class="demo-swipe-target"
    [class.demo-swipe-target--active]="swipe.swiping()"
    style="margin-top: 0.75rem;"
    [style.transform]="swipe.swiping() ? 'scale(0.98)' : 'scale(1)'"
  >
    <p style="margin: 0; font-size: 1.25rem; font-weight: 600">
      Swipe {{ swipeDir() }}
    </p>
    <p class="demo-gesture-hint" style="margin: 0.5rem 0 0">
      threshold: 60px
    </p>
    <button type="button" class="sort-btn" (click)="dismiss()" style="margin-top:0.75rem">
      Dismiss now
    </button>
  </div>

  <div aria-live="polite" class="cngx-sr-only">
    @if (swipeCount() > 0) {
      Dismissed {{ swipeCount() }} {{ swipeCount() === 1 ? 'time' : 'times' }}.
    }
  </div>`,
  templateChrome: `<div class="filter-row">
    <span class="filter-label">Direction:</span>
    @for (d of swipeDirs; track d) {
      <button type="button" class="chip" [class.chip--active]="swipeDir() === d"
              (click)="swipeDir.set(d)">{{ d }}</button>
    }
  </div>
  <div class="status-row" style="margin-top: 0.75rem;">
    <span class="status-badge" [class.active]="swipe.swiping()">
      {{ swipe.swiping() ? 'swiping' : 'idle' }}
    </span>
    <span class="status-badge">
      progress: {{ (swipe.swipeProgress() * 100).toFixed(0) }}%
    </span>
    <span class="status-badge">
      dismissed: {{ swipeCount() }}
    </span>
  </div>`,
};
